#!/usr/bin/env node

import { Command } from "commander"
import chalk from "chalk"
import { scanLocalSystem } from "./scanners/local-scanner"
import { scanAWS } from "./scanners/aws-scanner"
import { scanGCP } from "./scanners/gcp-scanner"
import { scanAzure } from "./scanners/azure-scanner"
import { generateReport } from "./reporting/report-generator"
import { setupLogger } from "./utils/logger"
import type { ScanOptions, ScanResult } from "./types"

// Initialize the CLI
const program = new Command()

program
  .name("crypto-detector")
  .description("Enhanced Cryptojacking Detection Tool")
  .version("1.0.0")
  .option(
    "-o, --output <file>",
    "Output file for scan results",
    `crypto_scan_${new Date().toISOString().replace(/:/g, "-")}.txt`,
  )
  .option(
    "-s, --summary <file>",
    "Summary report file",
    `crypto_scan_summary_${new Date().toISOString().replace(/:/g, "-")}.txt`,
  )
  .option("-f, --format <format>", "Output format (text, json, csv)", "text")
  .option(
    "-l, --log-file <file>",
    "Log file path",
    `crypto_scan_log_${new Date().toISOString().replace(/:/g, "-")}.txt`,
  )
  .option("-v, --verbose", "Enable verbose logging", false)
  .option("-q, --quiet", "Suppress console output", false)
  .option("--local-only", "Only scan local system, skip cloud providers", false)
  .option("--aws-regions <regions...>", "AWS regions to scan")
  .option("--aws-profile <profile>", "AWS profile to use")
  .option("--gcp-projects <projects...>", "GCP projects to scan")
  .option("--azure-subscriptions <subscriptions...>", "Azure subscription IDs to scan")
  .option("--max-workers <number>", "Maximum number of worker threads for parallel scanning")
  .option("--no-base64-decode", "Disable base64 decoding of content", false)
  .option("-p, --performance-report <file>", "Performance report file")
  .option("-d, --scan-dir <directory>", "Additional directory to scan")

async function main() {
  program.parse()
  const options = program.opts()

  // Setup logger
  const logger = setupLogger(options)

  logger.info(chalk.blue("Enhanced Cryptojacking Detection Tool"))
  logger.info(chalk.blue("======================================"))

  const scanOptions: ScanOptions = {
    ...options,
    logger,
  }

  try {
    // Start performance monitoring
    const startTime = process.hrtime()

    // Initialize results array
    const results: ScanResult[] = []

    // Scan local system
    logger.info(chalk.green("Scanning local system..."))
    const localResults = await scanLocalSystem(scanOptions)
    results.push(...localResults)

    // Scan cloud providers if not local-only
    if (!options.localOnly) {
      // Scan AWS
      try {
        logger.info(chalk.green("Scanning AWS resources..."))
        const awsResults = await scanAWS(scanOptions)
        results.push(...awsResults)
      } catch (error) {
        logger.error(chalk.red("Error scanning AWS resources:"), error)
      }

      // Scan GCP
      try {
        logger.info(chalk.green("Scanning GCP resources..."))
        const gcpResults = await scanGCP(scanOptions)
        results.push(...gcpResults)
      } catch (error) {
        logger.error(chalk.red("Error scanning GCP resources:"), error)
      }

      // Scan Azure
      try {
        logger.info(chalk.green("Scanning Azure resources..."))
        const azureResults = await scanAzure(scanOptions)
        results.push(...azureResults)
      } catch (error) {
        logger.error(chalk.red("Error scanning Azure resources:"), error)
      }
    }

    // Generate report
    logger.info(chalk.green("Generating report..."))
    await generateReport(results, scanOptions)

    // Calculate and log performance metrics
    const endTime = process.hrtime(startTime)
    const executionTimeMs = (endTime[0] * 1000 + endTime[1] / 1000000).toFixed(2)
    logger.info(chalk.green(`Scan completed in ${executionTimeMs}ms`))

    // Log summary
    const highSeverity = results.filter((r) => r.severity === "HIGH").length
    const mediumSeverity = results.filter((r) => r.severity === "MEDIUM").length
    const lowSeverity = results.filter((r) => r.severity === "LOW").length

    logger.info(chalk.green("Scan Summary:"))
    logger.info(chalk.red(`  HIGH severity issues: ${highSeverity}`))
    logger.info(chalk.yellow(`  MEDIUM severity issues: ${mediumSeverity}`))
    logger.info(chalk.blue(`  LOW severity issues: ${lowSeverity}`))
    logger.info(chalk.green(`  Total issues: ${results.length}`))
  } catch (error) {
    logger.error(chalk.red("Error during scan:"), error)
    process.exit(1)
  }
}

main()

