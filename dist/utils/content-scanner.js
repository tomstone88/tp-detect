"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.scanContent = scanContent;
const miner_patterns_1 = require("../patterns/miner-patterns");
const base64_detector_1 = require("./base64-detector");
/**
 * Scans content for cryptojacking indicators
 */
function scanContent(content, options) {
    const matches = [];
    // Check each detection pattern
    for (const { pattern, category, weight, description } of miner_patterns_1.detectionPatterns) {
        const contentMatches = content.match(pattern);
        if (contentMatches) {
            for (const match of contentMatches) {
                matches.push({
                    pattern: pattern.toString(),
                    match,
                    category,
                    weight,
                });
            }
        }
    }
    // Check for base64-encoded content if enabled
    if (options.base64Decode) {
        // Split content into words and check each for base64 encoding
        const words = content.split(/\s+/);
        for (const word of words) {
            if (word.length >= 20 && (0, base64_detector_1.isLikelyBase64)(word)) {
                const decoded = (0, base64_detector_1.tryDecodeBase64)(word);
                if (decoded) {
                    // Scan the decoded content
                    const decodedMatches = scanContent(decoded, { ...options, base64Decode: false });
                    if (decodedMatches.length > 0) {
                        matches.push({
                            pattern: "base64_encoded_content",
                            match: word.substring(0, 20) + "...",
                            category: "obfuscation_techniques",
                            weight: 4,
                        });
                        // Add the decoded matches
                        matches.push(...decodedMatches);
                    }
                }
            }
        }
    }
    return matches;
}
