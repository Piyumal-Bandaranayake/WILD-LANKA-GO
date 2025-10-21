import fs from 'fs';
import path from 'path';

/**
 * Comprehensive logging utility for authentication and dashboard access
 * Implements structured logging with different levels and categories
 */

const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3
};

const LOG_CATEGORIES = {
  AUTH: 'AUTH',
  DASHBOARD: 'DASHBOARD',
  API: 'API',
  SYSTEM: 'SYSTEM'
};

class Logger {
  constructor() {
    this.logLevel = process.env.LOG_LEVEL || 'INFO';
    this.logDir = path.join(process.cwd(), 'logs');
    this.ensureLogDirectory();
  }

  ensureLogDirectory() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  formatLogEntry(level, category, message, metadata = {}) {
    return {
      timestamp: new Date().toISOString(),
      level,
      category,
      message,
      metadata: {
        ...metadata,
        pid: process.pid,
        nodeEnv: process.env.NODE_ENV
      }
    };
  }

  writeToFile(logEntry) {
    const filename = `${logEntry.category.toLowerCase()}-${new Date().toISOString().split('T')[0]}.log`;
    const filepath = path.join(this.logDir, filename);
    const logLine = JSON.stringify(logEntry) + '\n';
    
    try {
      fs.appendFileSync(filepath, logLine);
    } catch (error) {
      console.error('Failed to write to log file:', error);
    }
  }

  shouldLog(level) {
    const currentLevel = LOG_LEVELS[this.logLevel] || LOG_LEVELS.INFO;
    const messageLevel = LOG_LEVELS[level] || LOG_LEVELS.INFO;
    return messageLevel <= currentLevel;
  }

  log(level, category, message, metadata = {}) {
    if (!this.shouldLog(level)) return;

    const logEntry = this.formatLogEntry(level, category, message, metadata);
    
    // Console output with colors
    const colors = {
      ERROR: '\x1b[31m', // Red
      WARN: '\x1b[33m',  // Yellow
      INFO: '\x1b[36m',  // Cyan
      DEBUG: '\x1b[37m'  // White
    };
    
    const reset = '\x1b[0m';
    const color = colors[level] || colors.INFO;
    
    console.log(`${color}[${logEntry.timestamp}] ${level} ${category}: ${message}${reset}`);
    
    if (Object.keys(metadata).length > 0) {
      console.log(`${color}Metadata:${reset}`, JSON.stringify(metadata, null, 2));
    }

    // Write to file for ERROR and WARN levels, or if explicitly enabled
    if (level === 'ERROR' || level === 'WARN' || process.env.LOG_TO_FILE === 'true') {
      this.writeToFile(logEntry);
    }
  }

  // Authentication specific logging methods
  authSuccess(message, metadata = {}) {
    this.log('INFO', LOG_CATEGORIES.AUTH, `✅ ${message}`, {
      ...metadata,
      event: 'auth_success'
    });
  }

  authFailure(message, metadata = {}) {
    this.log('ERROR', LOG_CATEGORIES.AUTH, `❌ ${message}`, {
      ...metadata,
      event: 'auth_failure'
    });
  }

  authAttempt(message, metadata = {}) {
    this.log('INFO', LOG_CATEGORIES.AUTH, `🔐 ${message}`, {
      ...metadata,
      event: 'auth_attempt'
    });
  }

  roleAssignment(message, metadata = {}) {
    this.log('INFO', LOG_CATEGORIES.AUTH, `👤 ${message}`, {
      ...metadata,
      event: 'role_assignment'
    });
  }

  // Dashboard specific logging methods
  dashboardAccess(message, metadata = {}) {
    this.log('INFO', LOG_CATEGORIES.DASHBOARD, `📊 ${message}`, {
      ...metadata,
      event: 'dashboard_access'
    });
  }

  dashboardError(message, metadata = {}) {
    this.log('ERROR', LOG_CATEGORIES.DASHBOARD, `💥 ${message}`, {
      ...metadata,
      event: 'dashboard_error'
    });
  }

  // API specific logging methods
  apiRequest(message, metadata = {}) {
    this.log('DEBUG', LOG_CATEGORIES.API, `🌐 ${message}`, {
      ...metadata,
      event: 'api_request'
    });
  }

  apiError(message, metadata = {}) {
    this.log('ERROR', LOG_CATEGORIES.API, `🚨 ${message}`, {
      ...metadata,
      event: 'api_error'
    });
  }

  // System logging methods
  systemError(message, metadata = {}) {
    this.log('ERROR', LOG_CATEGORIES.SYSTEM, `⚠️ ${message}`, {
      ...metadata,
      event: 'system_error'
    });
  }

  systemInfo(message, metadata = {}) {
    this.log('INFO', LOG_CATEGORIES.SYSTEM, `ℹ️ ${message}`, {
      ...metadata,
      event: 'system_info'
    });
  }

  // Generic logging methods
  error(message, metadata = {}) {
    this.log('ERROR', LOG_CATEGORIES.SYSTEM, message, metadata);
  }

  warn(message, metadata = {}) {
    this.log('WARN', LOG_CATEGORIES.SYSTEM, message, metadata);
  }

  info(message, metadata = {}) {
    this.log('INFO', LOG_CATEGORIES.SYSTEM, message, metadata);
  }

  debug(message, metadata = {}) {
    this.log('DEBUG', LOG_CATEGORIES.SYSTEM, message, metadata);
  }
}

// Create singleton instance
const logger = new Logger();

export default logger;
export { LOG_CATEGORIES, LOG_LEVELS };