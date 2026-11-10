import * as winston from "winston";
import * as path from "path";
import * as fs from "fs";

// Ensure logs directory exists
const logsDir = path.join(process.cwd(), "logs");
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Custom format for console output (colorized)
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.colorize({ all: true }),
  winston.format.printf(({ timestamp, level, message, context, trace }) => {
    const contextStr = context ? `[${context}]` : "";
    const traceStr = trace ? `\n${trace}` : "";
    return `${timestamp} ${level} ${contextStr} ${message}${traceStr}`;
  }),
);

// Custom format for file output (no colors, JSON-friendly)
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.printf(({ timestamp, level, message, context, trace }) => {
    const contextStr = context ? `[${context}]` : "";
    const traceStr = trace ? `\n${trace}` : "";
    return `${timestamp} ${level.toUpperCase()} ${contextStr} ${message}${traceStr}`;
  }),
);

// Winston configuration with file transports
export const winstonConfig: winston.LoggerOptions = {
  level: process.env.LOG_LEVEL || "debug", // Capture ALL logs by default
  transports: [
    // Console transport - for terminal output
    new winston.transports.Console({
      format: consoleFormat,
    }),
    // Combined log file - ALL logs
    new winston.transports.File({
      filename: path.join(logsDir, "combined.log"),
      format: fileFormat,
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5,
    }),
    // Error log file - only errors
    new winston.transports.File({
      filename: path.join(logsDir, "error.log"),
      level: "error",
      format: fileFormat,
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5,
    }),
  ],
};
