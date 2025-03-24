"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isLikelyBase64 = isLikelyBase64;
exports.tryDecodeBase64 = tryDecodeBase64;
/**
 * Detects if a string is likely base64 encoded
 * @param str String to check
 * @returns True if the string is likely base64 encoded
 */
function isLikelyBase64(str) {
    // Base64 strings are typically multiples of 4 characters
    if (str.length % 4 !== 0) {
        return false;
    }
    // Base64 strings only contain these characters
    const base64Regex = /^[A-Za-z0-9+/=]+$/;
    if (!base64Regex.test(str)) {
        return false;
    }
    // Base64 strings typically have a certain entropy
    // This is a simple heuristic to check if the string has enough variety of characters
    const uniqueChars = new Set(str).size;
    if (uniqueChars < 6) {
        return false;
    }
    return true;
}
/**
 * Attempts to decode a base64 string
 * @param str String to decode
 * @returns Decoded string or null if decoding failed
 */
function tryDecodeBase64(str) {
    try {
        const decoded = Buffer.from(str, "base64").toString("utf-8");
        // Check if the decoded string contains printable ASCII characters
        // If it's binary data, it's probably not what we're looking for
        if (/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\xFF]/.test(decoded)) {
            return null;
        }
        return decoded;
    }
    catch (error) {
        return null;
    }
}
