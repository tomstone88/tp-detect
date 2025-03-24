import type { Logger } from "winston"

export interface ScanOptions {
  output: string
  summary: string
  format: "text" | "json" | "csv"
  logFile: string
  verbose: boolean
  quiet: boolean
  localOnly: boolean
  awsRegions?: string[]
  awsProfile?: string
  gcpProjects?: string[]
  azureSubscriptions?: string[]
  maxWorkers?: number
  base64Decode: boolean
  performanceReport?: string
  scanDir?: string
  logger: Logger
}

export interface PatternMatch {
  pattern: string
  match: string
  category: PatternCategory
  weight: number
}

export type PatternCategory =
  | "miner_software"
  | "mining_pools"
  | "wallet_patterns"
  | "miner_parameters"
  | "behavioral_indicators"
  | "obfuscation_techniques"
  | "network_indicators"

export interface ScanResult {
  timestamp: string
  source: string
  itemType: string
  contentPreview: string
  matches: PatternMatch[]
  score: number
  severity: "HIGH" | "MEDIUM" | "LOW" | "CLEAN"
}

export interface DetectionPattern {
  pattern: RegExp
  category: PatternCategory
  weight: number
  description: string
}

