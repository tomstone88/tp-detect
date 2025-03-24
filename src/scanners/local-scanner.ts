import fs from "fs/promises"
import path from "path"
import os from "os"
import { exec } from "child_process"
import { promisify } from "util"
import type { ScanOptions, ScanResult, PatternMatch } from "../types"
import { detectionPatterns } from "../patterns/miner-patterns"
import { isLikelyBase64, tryDecodeBase64 } from "../utils/base64-detector"

const execAsync = promisify(exec)

/**
 * Scans the local system for cryptojacking indicators
 */
export async function scanLocalSystem(options: ScanOptions): Promise<ScanResult[]> {
  const results: ScanResult[] = []
  const { logger } = options

  logger.info("Starting local system scan")

  // Determine OS type
  const platform = os.platform()

  if (platform === "linux") {
    logger.info("Detected Linux system")

    // Scan Linux-specific locations
    await scanLinuxStartupScripts(options, results)
    await scanLinuxCronJobs(options, results)
    await scanLinuxServices(options, results)
  } else if (platform === "win32") {
    logger.info("Detected Windows system")

    // Scan Windows-specific locations
    await scanWindowsStartupLocations(options, results)
    await scanWindowsScheduledTasks(options, results)
    await scanWindowsServices(options, results)
  } else {
    logger.warn(`Unsupported platform: ${platform}`)
  }

  // Scan additional directory if specified
  if (options.scanDir) {
    logger.info(`Scanning additional directory: ${options.scanDir}`)
    await scanDirectory(options.scanDir, options, results)
  }

  logger.info(`Local system scan complete. Found ${results.length} potential issues.`)

  return results
}

/**
 * Scans Linux startup scripts
 */
async function scanLinuxStartupScripts(options: ScanOptions, results: ScanResult[]): Promise<void> {
  const { logger } = options

  // Common startup script locations
  const startupLocations = [
    "/etc/init.d",
    "/etc/rc.local",
    "/etc/rc.d",
    "/etc/profile",
    "/etc/profile.d",
    "/etc/bash.bashrc",
    "/etc/csh.cshrc",
    "/etc/zsh/zshrc",
    "/etc/environment",
  ]

  // User startup files
  try {
    const homeDir = os.homedir()
    const userStartupFiles = [
      path.join(homeDir, ".bashrc"),
      path.join(homeDir, ".bash_profile"),
      path.join(homeDir, ".profile"),
      path.join(homeDir, ".zshrc"),
      path.join(homeDir, ".cshrc"),
    ]

    startupLocations.push(...userStartupFiles)
  } catch (error) {
    logger.error("Error accessing user home directory:", error)
  }

  // Scan each location
  for (const location of startupLocations) {
    try {
      const stats = await fs.stat(location)

      if (stats.isDirectory()) {
        await scanDirectory(location, options, results)
      } else if (stats.isFile()) {
        await scanFile(location, options, results)
      }
    } catch (error) {
      // File or directory may not exist, which is fine
      logger.debug(`Could not access ${location}: ${error.message}`)
    }
  }
}

/**
 * Scans Linux cron jobs
 */
async function scanLinuxCronJobs(options: ScanOptions, results: ScanResult[]): Promise<void> {
  const { logger } = options

  // System crontab files
  const cronLocations = [
    "/etc/crontab",
    "/etc/cron.d",
    "/etc/cron.hourly",
    "/etc/cron.daily",
    "/etc/cron.weekly",
    "/etc/cron.monthly",
  ]

  // Scan each location
  for (const location of cronLocations) {
    try {
      const stats = await fs.stat(location)

      if (stats.isDirectory()) {
        await scanDirectory(location, options, results)
      } else if (stats.isFile()) {
        await scanFile(location, options, results)
      }
    } catch (error) {
      // File or directory may not exist, which is fine
      logger.debug(`Could not access ${location}: ${error.message}`)
    }
  }

  // User crontabs
  try {
    const { stdout } = await execAsync('cut -d: -f1 /etc/passwd | grep -v "^#"')
    const users = stdout.split("\n").filter(Boolean)

    for (const user of users) {
      try {
        const { stdout: crontab } = await execAsync(`crontab -l -u ${user}`)

        if (crontab) {
          const matches = scanContent(crontab, options)

          if (matches.length > 0) {
            const score = calculateScore(matches)
            results.push({
              timestamp: new Date().toISOString(),
              source: `User Crontab: ${user}`,
              itemType: "Crontab",
              contentPreview: crontab.substring(0, 200) + (crontab.length > 200 ? "..." : ""),
              matches,
              score,
              severity: getSeverity(score),
            })
          }
        }
      } catch (error) {
        // User may not have a crontab or we may not have permission
        logger.debug(`Could not access crontab for user ${user}: ${error.message}`)
      }
    }
  } catch (error) {
    logger.error("Error accessing user list:", error)
  }
}

/**
 * Scans Linux services
 */
async function scanLinuxServices(options: ScanOptions, results: ScanResult[]): Promise<void> {
  const { logger } = options

  // Systemd service locations
  const serviceLocations = [
    "/etc/systemd/system",
    "/usr/lib/systemd/system",
    "/lib/systemd/system",
    "/run/systemd/system",
  ]

  // Scan each location
  for (const location of serviceLocations) {
    try {
      await scanDirectory(location, options, results)
    } catch (error) {
      // Directory may not exist, which is fine
      logger.debug(`Could not access ${location}: ${error.message}`)
    }
  }

  // List running services
  try {
    const { stdout } = await execAsync(
      "systemctl list-units --type=service --state=running --no-pager --plain --no-legend",
    )
    const services = stdout.split("\n").filter(Boolean)

    for (const serviceInfo of services) {
      const serviceName = serviceInfo.split(/\s+/)[0]

      if (serviceName) {
        try {
          const { stdout: serviceDetails } = await execAsync(`systemctl show ${serviceName} -p ExecStart`)

          if (serviceDetails) {
            const matches = scanContent(serviceDetails, options)

            if (matches.length > 0) {
              const score = calculateScore(matches)
              results.push({
                timestamp: new Date().toISOString(),
                source: `Systemd Service: ${serviceName}`,
                itemType: "Service",
                contentPreview: serviceDetails.substring(0, 200) + (serviceDetails.length > 200 ? "..." : ""),
                matches,
                score,
                severity: getSeverity(score),
              })
            }
          }
        } catch (error) {
          logger.debug(`Could not get details for service ${serviceName}: ${error.message}`)
        }
      }
    }
  } catch (error) {
    logger.error("Error listing services:", error)
  }
}

/**
 * Scans Windows startup locations
 */
async function scanWindowsStartupLocations(options: ScanOptions, results: ScanResult[]): Promise<void> {
  const { logger } = options

  // Common startup locations
  const startupLocations = [
    path.join(os.homedir(), "AppData", "Roaming", "Microsoft", "Windows", "Start Menu", "Programs", "Startup"),
    path.join("C:", "ProgramData", "Microsoft", "Windows", "Start Menu", "Programs", "StartUp"),
    path.join("C:", "Windows", "System32", "GroupPolicy", "Machine", "Scripts", "Startup"),
    path.join("C:", "Windows", "System32", "GroupPolicy", "User", "Scripts", "Logon"),
  ]

  // Scan each location
  for (const location of startupLocations) {
    try {
      await scanDirectory(location, options, results)
    } catch (error) {
      // Directory may not exist, which is fine
      logger.debug(`Could not access ${location}: ${error.message}`)
    }
  }

  // Check registry run keys
  try {
    const { stdout: runKeys } = await execAsync(
      'reg query "HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run" /s',
    )

    if (runKeys) {
      const matches = scanContent(runKeys, options)

      if (matches.length > 0) {
        const score = calculateScore(matches)
        results.push({
          timestamp: new Date().toISOString(),
          source: "Registry: HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run",
          itemType: "Registry",
          contentPreview: runKeys.substring(0, 200) + (runKeys.length > 200 ? "..." : ""),
          matches,
          score,
          severity: getSeverity(score),
        })
      }
    }
  } catch (error) {
    logger.debug("Could not query registry run keys:", error)
  }
}

/**
 * Scans Windows scheduled tasks
 */
async function scanWindowsScheduledTasks(options: ScanOptions, results: ScanResult[]): Promise<void> {
  const { logger } = options

  try {
    // List all scheduled tasks
    const { stdout: taskList } = await execAsync("schtasks /query /fo LIST /v")

    if (taskList) {
      // Split by task
      const tasks = taskList.split("TaskName:").slice(1)

      for (const task of tasks) {
        const matches = scanContent(task, options)

        if (matches.length > 0) {
          const taskNameMatch = task.match(/^\s*(.+?)$/m)
          const taskName = taskNameMatch ? taskNameMatch[1].trim() : "Unknown Task"

          const score = calculateScore(matches)
          results.push({
            timestamp: new Date().toISOString(),
            source: `Scheduled Task: ${taskName}`,
            itemType: "Scheduled Task",
            contentPreview: task.substring(0, 200) + (task.length > 200 ? "..." : ""),
            matches,
            score,
            severity: getSeverity(score),
          })
        }
      }
    }
  } catch (error) {
    logger.error("Error listing scheduled tasks:", error)
  }
}

/**
 * Scans Windows services
 */
async function scanWindowsServices(options: ScanOptions, results: ScanResult[]): Promise<void> {
  const { logger } = options

  try {
    // List all services
    const { stdout: serviceList } = await execAsync("sc query state= all")

    if (serviceList) {
      // Extract service names
      const serviceNameRegex = /SERVICE_NAME:\s+(.+?)$/gm
      let match
      const serviceNames = []

      while ((match = serviceNameRegex.exec(serviceList)) !== null) {
        serviceNames.push(match[1].trim())
      }

      // Query each service for details
      for (const serviceName of serviceNames) {
        try {
          const { stdout: serviceConfig } = await execAsync(`sc qc "${serviceName}"`)

          if (serviceConfig) {
            const matches = scanContent(serviceConfig, options)

            if (matches.length > 0) {
              const score = calculateScore(matches)
              results.push({
                timestamp: new Date().toISOString(),
                source: `Windows Service: ${serviceName}`,
                itemType: "Service",
                contentPreview: serviceConfig.substring(0, 200) + (serviceConfig.length > 200 ? "..." : ""),
                matches,
                score,
                severity: getSeverity(score),
              })
            }
          }
        } catch (error) {
          logger.debug(`Could not query service ${serviceName}: ${error.message}`)
        }
      }
    }
  } catch (error) {
    logger.error("Error listing services:", error)
  }
}

/**
 * Recursively scans a directory for files
 */
async function scanDirectory(dirPath: string, options: ScanOptions, results: ScanResult[]): Promise<void> {
  const { logger } = options

  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true })

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name)

      if (entry.isDirectory()) {
        // Recursively scan subdirectories
        await scanDirectory(fullPath, options, results)
      } else if (entry.isFile()) {
        // Scan individual file
        await scanFile(fullPath, options, results)
      }
    }
  } catch (error) {
    logger.debug(`Error scanning directory ${dirPath}: ${error.message}`)
  }
}

/**
 * Scans an individual file for cryptojacking indicators
 */
async function scanFile(filePath: string, options: ScanOptions, results: ScanResult[]): Promise<void> {
  const { logger } = options

  try {
    // Check file extension to filter out binary files
    const ext = path.extname(filePath).toLowerCase()
    const textFileExtensions = [
      ".sh",
      ".bash",
      ".py",
      ".pl",
      ".rb",
      ".js",
      ".php",
      ".bat",
      ".cmd",
      ".ps1",
      ".vbs",
      ".conf",
      ".cfg",
      ".ini",
      ".service",
      ".timer",
      ".socket",
      ".txt",
    ]

    // Skip binary files unless they have a known text extension
    if (!textFileExtensions.includes(ext)) {
      const stats = await fs.stat(filePath)

      // Skip large files (> 10MB)
      if (stats.size > 10 * 1024 * 1024) {
        logger.debug(`Skipping large file: ${filePath} (${stats.size} bytes)`)
        return
      }
    }

    // Read file content
    const content = await fs.readFile(filePath, "utf-8")

    // Scan content for indicators
    const matches = scanContent(content, options)

    if (matches.length > 0) {
      const score = calculateScore(matches)
      results.push({
        timestamp: new Date().toISOString(),
        source: `File: ${filePath}`,
        itemType: "File",
        contentPreview: content.substring(0, 200) + (content.length > 200 ? "..." : ""),
        matches,
        score,
        severity: getSeverity(score),
      })
    }
  } catch (error) {
    logger.debug(`Error scanning file ${filePath}: ${error.message}`)
  }
}

/**
 * Scans content for cryptojacking indicators
 */
function scanContent(content: string, options: ScanOptions): PatternMatch[] {
  const matches: PatternMatch[] = []

  // Check each detection pattern
  for (const { pattern, category, weight, description } of detectionPatterns) {
    const contentMatches = content.match(pattern)

    if (contentMatches) {
      for (const match of contentMatches) {
        matches.push({
          pattern: pattern.toString(),
          match,
          category,
          weight,
        })
      }
    }
  }

  // Check for base64-encoded content if enabled
  if (options.base64Decode) {
    // Split content into words and check each for base64 encoding
    const words = content.split(/\s+/)

    for (const word of words) {
      if (word.length >= 20 && isLikelyBase64(word)) {
        const decoded = tryDecodeBase64(word)

        if (decoded) {
          // Scan the decoded content
          const decodedMatches = scanContent(decoded, { ...options, base64Decode: false })

          if (decodedMatches.length > 0) {
            matches.push({
              pattern: "base64_encoded_content",
              match: word.substring(0, 20) + "...",
              category: "obfuscation_techniques",
              weight: 4,
            })

            // Add the decoded matches
            matches.push(...decodedMatches)
          }
        }
      }
    }
  }

  return matches
}

/**
 * Calculates the score based on matches
 */
function calculateScore(matches: PatternMatch[]): number {
  return matches.reduce((total, match) => total + match.weight, 0)
}

/**
 * Determines severity based on score
 */
function getSeverity(score: number): "HIGH" | "MEDIUM" | "LOW" | "CLEAN" {
  if (score >= 15) {
    return "HIGH"
  } else if (score >= 8) {
    return "MEDIUM"
  } else if (score > 0) {
    return "LOW"
  } else {
    return "CLEAN"
  }
}

