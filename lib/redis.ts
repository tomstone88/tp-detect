import { Redis } from "@upstash/redis"
import type { User, ScanResult, Detection } from "./types"

// Update the Redis client initialization to use the existing environment variables
const redis = new Redis({
  url: process.env.KV_REST_API_URL || "",
  token: process.env.KV_REST_API_TOKEN || "",
})

// Redis keys
const USERS_KEY = "users"
const USER_SCANS_KEY = "user:scans"
const SCAN_RESULTS_KEY = "scan:results"
const DETECTION_PATTERNS_KEY = "detection:patterns"

// User functions
export async function createUser(user: User): Promise<boolean> {
  try {
    await redis.hset(USERS_KEY, { [user.id]: user })
    return true
  } catch (error) {
    console.error("Error creating user:", error)
    return false
  }
}

export async function getUserByEmail(email: string): Promise<User | null> {
  try {
    const users = (await redis.hgetall(USERS_KEY)) as Record<string, User>
    if (!users) return null

    const user = Object.values(users).find((u) => u.email === email)
    return user || null
  } catch (error) {
    console.error("Error fetching user by email:", error)
    return null
  }
}

export async function getUserById(userId: string): Promise<User | null> {
  try {
    return (await redis.hget(USERS_KEY, userId)) as User | null
  } catch (error) {
    console.error("Error fetching user by ID:", error)
    return null
  }
}

// Scan functions
export async function getScanResult(scanId: string): Promise<ScanResult | null> {
  try {
    const result = await redis.hget(SCAN_RESULTS_KEY, scanId)
    return result as ScanResult | null
  } catch (error) {
    console.error("Error fetching scan result:", error)
    return null
  }
}

export async function saveScanResult(scanResult: ScanResult): Promise<boolean> {
  try {
    await redis.hset(SCAN_RESULTS_KEY, { [scanResult.id]: scanResult })
    await redis.lpush(`${USER_SCANS_KEY}:${scanResult.userId}`, scanResult.id)
    return true
  } catch (error) {
    console.error("Error saving scan result:", error)
    return false
  }
}

export async function getUserScans(userId: string, limit = 10): Promise<string[]> {
  try {
    return await redis.lrange(`${USER_SCANS_KEY}:${userId}`, 0, limit - 1)
  } catch (error) {
    console.error("Error fetching user scans:", error)
    return []
  }
}

export async function getUserScanResults(userId: string, limit = 10): Promise<ScanResult[]> {
  try {
    const scanIds = await getUserScans(userId, limit)
    if (!scanIds.length) return []

    const results: ScanResult[] = []
    for (const id of scanIds) {
      const result = await getScanResult(id)
      if (result) results.push(result)
    }

    return results
  } catch (error) {
    console.error("Error fetching user scan results:", error)
    return []
  }
}

export async function getDetectionPatterns(): Promise<Detection[]> {
  try {
    return ((await redis.get(DETECTION_PATTERNS_KEY)) as Detection[]) || []
  } catch (error) {
    console.error("Error fetching detection patterns:", error)
    return []
  }
}

// Initialize default detection patterns if they don't exist
export async function initializeDetectionPatterns(): Promise<void> {
  const patterns = await getDetectionPatterns()
  if (patterns.length === 0) {
    const defaultPatterns: Detection[] = [
      {
        id: "crypto-miner-1",
        name: "XMRig Cryptocurrency Miner",
        description: "XMRig is a high-performance Monero (XMR) CPU miner",
        severity: "high",
        location: "Process execution",
        resourceId: "vm-instance-01",
        detectionPattern: "xmrig",
        recommendation: "Terminate the process and remove the malicious executable",
        canTerminate: true,
        canTrace: true,
      },
      {
        id: "crypto-miner-2",
        name: "Coinhive JavaScript Miner",
        description: "In-browser cryptocurrency miner that uses visitors' CPU resources",
        severity: "medium",
        location: "Web scripts",
        resourceId: "web-server-03",
        detectionPattern: "coinhive.min.js",
        recommendation: "Remove the script from your web pages",
        canTerminate: true,
        canTrace: true,
      },
      {
        id: "crypto-miner-3",
        name: "Hidden Cryptojacking Script",
        description: "Obfuscated JavaScript that mines cryptocurrency in the background",
        severity: "high",
        location: "Web application",
        resourceId: "cdn-assets-01",
        detectionPattern: "Cryptonight",
        recommendation: "Audit all JavaScript files and remove malicious code",
        canTerminate: false,
        canTrace: true,
      },
      {
        id: "crypto-miner-4",
        name: "EternalBlue Exploit with Miner Payload",
        description: "Uses EternalBlue vulnerability to deploy cryptocurrency miners",
        severity: "high",
        location: "Network traffic",
        resourceId: "subnet-private-01",
        detectionPattern: "ms17-010",
        recommendation: "Patch systems with the latest security updates",
        canTerminate: false,
        canTrace: true,
      },
      {
        id: "crypto-miner-5",
        name: "Docker Container Cryptojacking",
        description: "Unauthorized cryptocurrency mining in Docker containers",
        severity: "medium",
        location: "Container environment",
        resourceId: "container-backend-07",
        detectionPattern: "dockerized miner",
        recommendation: "Review all running containers and implement proper security controls",
        canTerminate: true,
        canTrace: true,
      },
      {
        id: "crypto-miner-6",
        name: "Cron Job Cryptocurrency Miner",
        description: "Scheduled task that runs a cryptocurrency miner",
        severity: "medium",
        location: "Cron jobs",
        resourceId: "vm-instance-05",
        detectionPattern: "cron mining",
        recommendation: "Review all cron jobs and remove unauthorized entries",
        canTerminate: true,
        canTrace: false,
      },
      {
        id: "crypto-miner-7",
        name: "NPM Package with Mining Code",
        description: "NPM package that contains hidden cryptocurrency mining code",
        severity: "medium",
        location: "Node.js dependencies",
        resourceId: "app-server-01",
        detectionPattern: "package mining",
        recommendation: "Audit all NPM packages and remove suspicious dependencies",
        canTerminate: false,
        canTrace: true,
      },
      {
        id: "crypto-miner-8",
        name: "GPU-Based Ethereum Miner",
        description: "Unauthorized Ethereum mining using GPU resources",
        severity: "high",
        location: "Process execution",
        resourceId: "gpu-instance-02",
        detectionPattern: "ethminer",
        recommendation: "Terminate the process and implement GPU monitoring",
        canTerminate: true,
        canTrace: true,
      },
      {
        id: "crypto-miner-9",
        name: "Base64 Encoded Mining Payload",
        description: "Obfuscated mining code hidden in base64 encoded strings",
        severity: "low",
        location: "Application code",
        resourceId: "backup-scripts-01",
        detectionPattern: "base64 mining",
        recommendation: "Implement code scanning and review for obfuscated payloads",
        canTerminate: false,
        canTrace: true,
      },
      {
        id: "crypto-miner-10",
        name: "WebAssembly Cryptocurrency Miner",
        description: "Uses WebAssembly to efficiently mine cryptocurrency in browsers",
        severity: "medium",
        location: "Web application",
        resourceId: "frontend-assets-02",
        detectionPattern: "wasm miner",
        recommendation: "Monitor WebAssembly usage and implement Content Security Policy",
        canTerminate: true,
        canTrace: true,
      },
    ]

    await redis.set(DETECTION_PATTERNS_KEY, defaultPatterns)
  }
}

export async function getScanHistory(limit = 20): Promise<string[]> {
  try {
    const scanIds = await redis.keys(`${USER_SCANS_KEY}:*`)
    const allScanIds: string[] = []

    for (const key of scanIds) {
      const userScanIds = await redis.lrange(key, 0, -1)
      allScanIds.push(...userScanIds)
    }

    // Sort by timestamp (assuming scanId contains timestamp information)
    allScanIds.sort((a, b) => {
      // Basic lexicographical comparison as timestamps are not directly embedded
      return b.localeCompare(a)
    })

    return allScanIds.slice(0, limit)
  } catch (error) {
    console.error("Error fetching scan history:", error)
    return []
  }
}

