import type { ScanOptions, PatternMatch } from "../types"
import { detectionPatterns } from "../patterns/miner-patterns"
import { isLikelyBase64, tryDecodeBase64 } from "./base64-detector"

/**
 * Scans content for cryptojacking indicators
 */
export function scanContent(content: string, options: ScanOptions): PatternMatch[] {
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

