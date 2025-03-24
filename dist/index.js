#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const chalk_1 = __importDefault(require("chalk"));
const local_scanner_1 = require("./scanners/local-scanner");
const aws_scanner_1 = require("./scanners/aws-scanner");
const gcp_scanner_1 = require("./scanners/gcp-scanner");
const azure_scanner_1 = require("./scanners/azure-scanner");
const report_generator_1 = require("./reporting/report-generator");
const logger_1 = require("./utils/logger");
// Initialize the CLI
const program = new commander_1.Command();
program
    .name("crypto-detector")
    .description("Enhanced Cryptojacking Detection Tool")
    .version("1.0.0")
    .option("-o, --output <file>", "Output file for scan results", `crypto_scan_${new Date().toISOString().replace(/:/g, "-")}.txt`)
    .option("-s, --summary <file>", "Summary report file", `crypto_scan_summary_${new Date().toISOString().replace(/:/g, "-")}.txt`)
    .option("-f, --format <format>", "Output format (text, json, csv)", "text")
    .option("-l, --log-file <file>", "Log file path", `crypto_scan_log_${new Date().toISOString().replace(/:/g, "-")}.txt`)
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
    .option("-d, --scan-dir <directory>", "Additional directory to scan");
async function main() {
    program.parse();
    const options = program.opts();
    // Setup logger
    const logger = (0, logger_1.setupLogger)(options);
    logger.info(chalk_1.default.blue("Enhanced Cryptojacking Detection Tool"));
    logger.info(chalk_1.default.blue("======================================"));
    const scanOptions = {
        ...options,
        logger,
    };
    try {
        // Start performance monitoring
        const startTime = process.hrtime();
        // Initialize results array
        const results = [];
        // Scan local system
        logger.info(chalk_1.default.green("Scanning local system..."));
        const localResults = await (0, local_scanner_1.scanLocalSystem)(scanOptions);
        results.push(...localResults);
        // Scan cloud providers if not local-only
        if (!options.localOnly) {
            // Scan AWS
            try {
                logger.info(chalk_1.default.green("Scanning AWS resources..."));
                const awsResults = await (0, aws_scanner_1.scanAWS)(scanOptions);
                results.push(...awsResults);
            }
            catch (error) {
                logger.error(chalk_1.default.red("Error scanning AWS resources:"), error);
            }
            // Scan GCP
            try {
                logger.info(chalk_1.default.green("Scanning GCP resources..."));
                const gcpResults = await (0, gcp_scanner_1.scanGCP)(scanOptions);
                results.push(...gcpResults);
            }
            catch (error) {
                logger.error(chalk_1.default.red("Error scanning GCP resources:"), error);
            }
            // Scan Azure
            try {
                logger.info(chalk_1.default.green("Scanning Azure resources..."));
                const azureResults = await (0, azure_scanner_1.scanAzure)(scanOptions);
                results.push(...azureResults);
            }
            catch (error) {
                logger.error(chalk_1.default.red("Error scanning Azure resources:"), error);
            }
        }
        // Generate report
        logger.info(chalk_1.default.green("Generating report..."));
        await (0, report_generator_1.generateReport)(results, scanOptions);
        // Calculate and log performance metrics
        const endTime = process.hrtime(startTime);
        const executionTimeMs = (endTime[0] * 1000 + endTime[1] / 1000000).toFixed(2);
        logger.info(chalk_1.default.green(`Scan completed in ${executionTimeMs}ms`));
        // Log summary
        const highSeverity = results.filter((r) => r.severity === "HIGH").length;
        const mediumSeverity = results.filter((r) => r.severity === "MEDIUM").length;
        const lowSeverity = results.filter((r) => r.severity === "LOW").length;
        logger.info(chalk_1.default.green("Scan Summary:"));
        logger.info(chalk_1.default.red(`  HIGH severity issues: ${highSeverity}`));
        logger.info(chalk_1.default.yellow(`  MEDIUM severity issues: ${mediumSeverity}`));
        logger.info(chalk_1.default.blue(`  LOW severity issues: ${lowSeverity}`));
        logger.info(chalk_1.default.green(`  Total issues: ${results.length}`));
    }
    catch (error) {
        logger.error(chalk_1.default.red("Error during scan:"), error);
        process.exit(1);
    }
}
main();
