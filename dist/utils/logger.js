"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupLogger = setupLogger;
const winston_1 = __importDefault(require("winston"));
function setupLogger(options) {
    const { format } = winston_1.default;
    // Create format for console output
    const consoleFormat = format.combine(format.colorize(), format.timestamp(), format.printf(({ timestamp, level, message }) => {
        return `${timestamp} ${level}: ${message}`;
    }));
    // Create format for file output
    const fileFormat = format.combine(format.timestamp(), format.json());
    const transports = [];
    // Add console transport if not quiet
    if (!options.quiet) {
        transports.push(new winston_1.default.transports.Console({
            level: options.verbose ? "debug" : "info",
            format: consoleFormat,
        }));
    }
    // Add file transport if log file specified
    if (options.logFile) {
        transports.push(new winston_1.default.transports.File({
            filename: options.logFile,
            level: "debug",
            format: fileFormat,
        }));
    }
    return winston_1.default.createLogger({
        transports,
    });
}
