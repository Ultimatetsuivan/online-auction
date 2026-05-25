/**
 * Winston Logger Configuration
 * Provides structured logging for production and development environments
 */

const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');

// Define log levels
const levels = {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4,
};

// Define colors for each level
const colors = {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    debug: 'blue',
};

winston.addColors(colors);

// Determine log level based on environment
const level = () => {
    const env = process.env.NODE_ENV || 'development';
    const isDevelopment = env === 'development';
    return isDevelopment ? 'debug' : 'info';
};

// Define log format for console (development)
const consoleFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.colorize({ all: true }),
    winston.format.printf(
        (info) => {
            const { timestamp, level, message, ...meta } = info;
            const metaString = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
            return `${timestamp} [${level}]: ${message} ${metaString}`;
        }
    )
);

// Define log format for files (production)
const fileFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.json()
);

// Define transports
const transports = [];

// Console transport (always enabled)
transports.push(
    new winston.transports.Console({
        format: consoleFormat,
    })
);

// File transports (only in production or if explicitly enabled)
const enableFileLogging = process.env.ENABLE_FILE_LOGGING === 'true' || process.env.NODE_ENV === 'production';

if (enableFileLogging) {
    // Create logs directory path
    const logsDir = path.join(__dirname, '..', 'logs');

    // Combined log - all logs
    transports.push(
        new DailyRotateFile({
            filename: path.join(logsDir, 'combined-%DATE%.log'),
            datePattern: 'YYYY-MM-DD',
            maxSize: '20m',
            maxFiles: '14d', // Keep logs for 14 days
            format: fileFormat,
        })
    );

    // Error log - only errors
    transports.push(
        new DailyRotateFile({
            level: 'error',
            filename: path.join(logsDir, 'error-%DATE%.log'),
            datePattern: 'YYYY-MM-DD',
            maxSize: '20m',
            maxFiles: '30d', // Keep error logs for 30 days
            format: fileFormat,
        })
    );

    // HTTP log - HTTP requests
    transports.push(
        new DailyRotateFile({
            level: 'http',
            filename: path.join(logsDir, 'http-%DATE%.log'),
            datePattern: 'YYYY-MM-DD',
            maxSize: '20m',
            maxFiles: '7d', // Keep HTTP logs for 7 days
            format: fileFormat,
        })
    );
}

// Create the logger instance
const logger = winston.createLogger({
    level: level(),
    levels,
    transports,
    // Handle uncaught exceptions and unhandled promise rejections
    exceptionHandlers: enableFileLogging ? [
        new DailyRotateFile({
            filename: path.join(__dirname, '..', 'logs', 'exceptions-%DATE%.log'),
            datePattern: 'YYYY-MM-DD',
            maxSize: '20m',
            maxFiles: '30d',
            format: fileFormat,
        })
    ] : [],
    rejectionHandlers: enableFileLogging ? [
        new DailyRotateFile({
            filename: path.join(__dirname, '..', 'logs', 'rejections-%DATE%.log'),
            datePattern: 'YYYY-MM-DD',
            maxSize: '20m',
            maxFiles: '30d',
            format: fileFormat,
        })
    ] : [],
    exitOnError: false, // Don't exit on handled exceptions
});

module.exports = logger;
