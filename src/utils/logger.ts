import winston from "winston"
import type { ScanOptions } from "../types"

export function setupLogger(options: Partial<ScanOptions>): winston.Logger {
  const { format } = winston

  // Create format for console output
  const consoleFormat = format.combine(
    format.colorize(),
    format.timestamp(),
    format.printf(({ timestamp, level, message }) => {
      return `${timestamp} ${level}: ${message}`
    }),
  )

  // Create format for file output
  const fileFormat = format.combine(format.timestamp(), format.json())

  const transports: winston.transport[] = []

  // Add console transport if not quiet
  if (!options.quiet) {
    transports.push(
      new winston.transports.Console({
        level: options.verbose ? "debug" : "info",
        format: consoleFormat,
      }),
    )
  }

  // Add file transport if log file specified
  if (options.logFile) {
    transports.push(
      new winston.transports.File({
        filename: options.logFile,
        level: "debug",
        format: fileFormat,
      }),
    )
  }

  return winston.createLogger({
    transports,
  })
}

