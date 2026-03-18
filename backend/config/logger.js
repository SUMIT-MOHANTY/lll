const winston = require('winston');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');
const { format } = winston;

// Ensure logs directory exists
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

/**
 * Configure Winston logger with console and file transports
 */
const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.errors({ stack: true }),
    format.splat(),
    format.json()
  ),
  defaultMeta: { service: 'passport-booking-api' },
  transports: [
    // Console transport for development
    new winston.transports.Console({
      format: format.combine(
        format.colorize(),
        format.printf(({ timestamp, level, message, ...meta }) => {
          return `${timestamp} [${level}]: ${message} ${
            Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''
          }`;
        })
      ),
    }),
    // Rotating file transport for all logs
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      maxsize: 10485760, // 10MB
      maxFiles: 5,
    }),
    // Separate file for error logs
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: 10485760, // 10MB
      maxFiles: 5,
    })
  ],
});

/**
 * Configure Morgan HTTP request logger middleware
 * Stream logs to Winston
 */
const morganMiddleware = morgan(
  // Define message format string (similar to Apache Combined Log Format)
  ':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" - :response-time ms',
  {
    // Stream logs to Winston
    stream: {
      write: (message) => logger.http(message.trim()),
    },
  }
);

// Create shorthand logging methods
const logRequest = (req, message, meta = {}) => {
  logger.info(message, {
    requestId: req.id,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    ...meta,
  });
};

const logError = (req, error, meta = {}) => {
  logger.error(`${error.message || 'Unknown error'}`, {
    requestId: req.id,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    stack: error.stack,
    ...meta,
  });
};

// Export the logger and middleware
module.exports = {
  logger,
  morganMiddleware,
  logRequest,
  logError,
};
