"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateReport = generateReport;
const promises_1 = __importDefault(require("fs/promises"));
/**
 * Generates a report based on scan results
 */
async function generateReport(results, options) {
    const { format, output, summary, logger } = options;
    // Sort results by severity and score
    results.sort((a, b) => {
        const severityOrder = { HIGH: 3, MEDIUM: 2, LOW: 1, CLEAN: 0 };
        const severityDiff = severityOrder[b.severity] - severityOrder[a.severity];
        if (severityDiff !== 0) {
            return severityDiff;
        }
        return b.score - a.score;
    });
    // Generate report in the specified format
    let reportContent = "";
    if (format === "json") {
        reportContent = JSON.stringify(results, null, 2);
    }
    else if (format === "csv") {
        reportContent = generateCSV(results);
    }
    else {
        // Default to text format
        reportContent = generateTextReport(results);
    }
    // Write report to file
    await promises_1.default.writeFile(output, reportContent);
    logger.info(`Report written to ${output}`);
    // Generate summary report
    const summaryContent = generateSummaryReport(results);
    await promises_1.default.writeFile(summary, summaryContent);
    logger.info(`Summary report written to ${summary}`);
}
/**
 * Generates a text report
 */
function generateTextReport(results) {
    let report = "ENHANCED CRYPTOJACKING DETECTION REPORT\n";
    report += "=====================================\n\n";
    report += `Scan completed at: ${new Date().toISOString()}\n`;
    report += `Total items scanned: ${results.length}\n\n`;
    // Group by severity
    const highSeverity = results.filter((r) => r.severity === "HIGH");
    const mediumSeverity = results.filter((r) => r.severity === "MEDIUM");
    const lowSeverity = results.filter((r) => r.severity === "LOW");
    // High severity findings
    report += `HIGH SEVERITY FINDINGS (${highSeverity.length})\n`;
    report += "==========================\n\n";
    if (highSeverity.length === 0) {
        report += "No high severity findings.\n\n";
    }
    else {
        for (const result of highSeverity) {
            report += formatResultText(result);
        }
    }
    // Medium severity findings
    report += `MEDIUM SEVERITY FINDINGS (${mediumSeverity.length})\n`;
    report += "============================\n\n";
    if (mediumSeverity.length === 0) {
        report += "No medium severity findings.\n\n";
    }
    else {
        for (const result of mediumSeverity) {
            report += formatResultText(result);
        }
    }
    // Low severity findings
    report += `LOW SEVERITY FINDINGS (${lowSeverity.length})\n`;
    report += "=========================\n\n";
    if (lowSeverity.length === 0) {
        report += "No low severity findings.\n\n";
    }
    else {
        for (const result of lowSeverity) {
            report += formatResultText(result);
        }
    }
    return report;
}
/**
 * Formats a single result for text report
 */
function formatResultText(result) {
    let text = `[${result.severity}] ${result.source} (Score: ${result.score})\n`;
    text += `Type: ${result.itemType}\n`;
    text += `Timestamp: ${result.timestamp}\n`;
    text += "Content Preview:\n";
    text += `${result.contentPreview}\n\n`;
    text += "Matches:\n";
    for (const match of result.matches) {
        text += `- Category: ${match.category} (Weight: ${match.weight})\n`;
        text += `  Pattern: ${match.pattern}\n`;
        text += `  Match: ${match.match}\n`;
    }
    text += "\n";
    return text;
}
/**
 * Generates a CSV report
 */
function generateCSV(results) {
    // CSV header
    let csv = "timestamp,source,item_type,content_preview,matches,score,severity\n";
    // CSV rows
    for (const result of results) {
        const row = [
            result.timestamp,
            `"${result.source.replace(/"/g, '""')}"`,
            `"${result.itemType.replace(/"/g, '""')}"`,
            `"${result.contentPreview.replace(/"/g, '""')}"`,
            `"${JSON.stringify(result.matches).replace(/"/g, '""')}"`,
            result.score,
            result.severity,
        ];
        csv += row.join(",") + "\n";
    }
    return csv;
}
/**
 * Generates a summary report
 */
function generateSummaryReport(results) {
    let summary = "ENHANCED CRYPTOJACKING DETECTION SUMMARY\n";
    summary += "=======================================\n\n";
    summary += `Scan completed at: ${new Date().toISOString()}\n\n`;
    // Count by severity
    const highSeverity = results.filter((r) => r.severity === "HIGH").length;
    const mediumSeverity = results.filter((r) => r.severity === "MEDIUM").length;
    const lowSeverity = results.filter((r) => r.severity === "LOW").length;
    const clean = results.filter((r) => r.severity === "CLEAN").length;
    summary += "FINDINGS SUMMARY\n";
    summary += "===============\n\n";
    summary += `HIGH severity: ${highSeverity}\n`;
    summary += `MEDIUM severity: ${mediumSeverity}\n`;
    summary += `LOW severity: ${lowSeverity}\n`;
    summary += `CLEAN: ${clean}\n\n`;
    // Group by source type
    const sourceTypes = new Map();
    for (const result of results) {
        const sourceType = result.itemType;
        sourceTypes.set(sourceType, (sourceTypes.get(sourceType) || 0) + 1);
    }
    summary += "FINDINGS BY TYPE\n";
    summary += "===============\n\n";
    for (const [type, count] of sourceTypes.entries()) {
        summary += `${type}: ${count}\n`;
    }
    return summary;
}
