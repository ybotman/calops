// error-handler.js
// Error handling and logging utilities for BTC import

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const ERROR_LOG_DIR = process.env.ERROR_LOG_DIR || path.join(__dirname, 'logs');
const ERROR_LOG_FILE = path.join(ERROR_LOG_DIR, 'import-errors.log');
const ERROR_DETAILS_DIR = path.join(ERROR_LOG_DIR, 'error-details');

// Create directories if they don't exist
if (!fs.existsSync(ERROR_LOG_DIR)) {
  fs.mkdirSync(ERROR_LOG_DIR, { recursive: true });
}
if (!fs.existsSync(ERROR_DETAILS_DIR)) {
  fs.mkdirSync(ERROR_DETAILS_DIR, { recursive: true });
}

/**
 * Error categories
 */
export const ErrorCategory = {
  API_ACCESS: 'API_ACCESS',
  ENTITY_RESOLUTION: 'ENTITY_RESOLUTION',
  DATA_VALIDATION: 'DATA_VALIDATION',
  PROCESSING: 'PROCESSING',
  SYSTEM: 'SYSTEM'
};

/**
 * Error severities
 */
export const ErrorSeverity = {
  INFO: 'INFO',
  WARNING: 'WARNING',
  ERROR: 'ERROR',
  FATAL: 'FATAL'
};

/**
 * Import stages
 */
export const ImportStage = {
  INITIALIZATION: 'INITIALIZATION',
  EXTRACTION: 'EXTRACTION',
  TRANSFORMATION: 'TRANSFORMATION',
  ENTITY_RESOLUTION: 'ENTITY_RESOLUTION',
  VALIDATION: 'VALIDATION',
  LOADING: 'LOADING',
  VERIFICATION: 'VERIFICATION',
  CLEANUP: 'CLEANUP'
};

/**
 * Generate a unique error ID
 * @returns {string} Unique error ID
 */
function generateErrorId() {
  return `ERR-${Date.now()}-${Math.floor(Math.random() * 1000000).toString().padStart(6, '0')}`;
}

/**
 * Custom error class for BTC import errors
 */
export class ImportError extends Error {
  /**
   * @param {string} message - Error message
   * @param {string} category - Error category
   * @param {string} severity - Error severity
   * @param {string} stage - Import stage where error occurred
   * @param {Object} context - Additional context
   * @param {Error} originalError - Original error (if wrapping)
   */
  constructor(message, category, severity, stage, context = {}, originalError = null) {
    super(message);
    this.name = 'ImportError';
    this.category = category || ErrorCategory.SYSTEM;
    this.severity = severity || ErrorSeverity.ERROR;
    this.stage = stage || ImportStage.INITIALIZATION;
    this.context = context;
    this.originalError = originalError;
    this.timestamp = new Date().toISOString();
    this.id = generateErrorId();
  }
  
  /**
   * Convert error to JSON representation
   * @returns {Object} JSON representation of error
   */
  toJSON() {
    return {
      id: this.id,
      timestamp: this.timestamp,
      name: this.name,
      message: this.message,
      category: this.category,
      severity: this.severity,
      stage: this.stage,
      context: this.context,
      stack: this.stack,
      originalError: this.originalError ? {
        name: this.originalError.name,
        message: this.originalError.message,
        stack: this.originalError.stack
      } : null
    };
  }
}

/**
 * Error logger
 */
export class ErrorLogger {
  /**
   * Log an error
   * @param {ImportError} error - Error to log
   */
  static logError(error) {
    // Create log entry
    const entry = {
      timestamp: new Date().toISOString(),
      error: error.toJSON()
    };
    
    // Write to main log file
    const logLine = `[${entry.timestamp}] [${error.id}] [${error.severity}] [${error.category}] [${error.stage}] ${error.message}\n`;
    fs.appendFileSync(ERROR_LOG_FILE, logLine);
    
    // Write detailed error to separate file
    const detailsFile = path.join(ERROR_DETAILS_DIR, `${error.id}.json`);
    fs.writeFileSync(detailsFile, JSON.stringify(entry, null, 2));
    
    // Console output for immediate visibility
    if (error.severity === ErrorSeverity.ERROR || error.severity === ErrorSeverity.FATAL) {
      console.error(`[${error.severity}] ${error.message} (ID: ${error.id})`);
    } else if (error.severity === ErrorSeverity.WARNING) {
      console.warn(`[${error.severity}] ${error.message} (ID: ${error.id})`);
    } else {
      console.info(`[${error.severity}] ${error.message} (ID: ${error.id})`);
    }
    
    return error.id;
  }
  
  /**
   * Create and log an error
   * @param {string} message - Error message
   * @param {string} category - Error category
   * @param {string} severity - Error severity
   * @param {string} stage - Import stage
   * @param {Object} context - Additional context
   * @param {Error} originalError - Original error (if wrapping)
   * @returns {string} Error ID
   */
  static createAndLogError(message, category, severity, stage, context = {}, originalError = null) {
    const error = new ImportError(message, category, severity, stage, context, originalError);
    return ErrorLogger.logError(error);
  }
  
  /**
   * Create and log an API access error
   * @param {string} message - Error message
   * @param {string} stage - Import stage
   * @param {Object} context - Additional context
   * @param {Error} originalError - Original error (if wrapping)
   * @returns {string} Error ID
   */
  static logApiError(message, stage, context = {}, originalError = null) {
    return ErrorLogger.createAndLogError(
      message,
      ErrorCategory.API_ACCESS,
      ErrorSeverity.ERROR,
      stage,
      context,
      originalError
    );
  }
  
  /**
   * Create and log an entity resolution error
   * @param {string} message - Error message
   * @param {string} stage - Import stage
   * @param {Object} context - Additional context
   * @param {Error} originalError - Original error (if wrapping)
   * @returns {string} Error ID
   */
  static logEntityError(message, stage, context = {}, originalError = null) {
    return ErrorLogger.createAndLogError(
      message,
      ErrorCategory.ENTITY_RESOLUTION,
      ErrorSeverity.WARNING,
      stage,
      context,
      originalError
    );
  }
  
  /**
   * Create and log a data validation error
   * @param {string} message - Error message
   * @param {string} stage - Import stage
   * @param {Object} context - Additional context
   * @param {Error} originalError - Original error (if wrapping)
   * @returns {string} Error ID
   */
  static logValidationError(message, stage, context = {}, originalError = null) {
    return ErrorLogger.createAndLogError(
      message,
      ErrorCategory.DATA_VALIDATION,
      ErrorSeverity.WARNING,
      stage,
      context,
      originalError
    );
  }
  
  /**
   * Create and log a processing error
   * @param {string} message - Error message
   * @param {string} stage - Import stage
   * @param {Object} context - Additional context
   * @param {Error} originalError - Original error (if wrapping)
   * @returns {string} Error ID
   */
  static logProcessingError(message, stage, context = {}, originalError = null) {
    return ErrorLogger.createAndLogError(
      message,
      ErrorCategory.PROCESSING,
      ErrorSeverity.ERROR,
      stage,
      context,
      originalError
    );
  }
  
  /**
   * Create and log a system error
   * @param {string} message - Error message
   * @param {string} stage - Import stage
   * @param {Object} context - Additional context
   * @param {Error} originalError - Original error (if wrapping)
   * @returns {string} Error ID
   */
  static logSystemError(message, stage, context = {}, originalError = null) {
    return ErrorLogger.createAndLogError(
      message,
      ErrorCategory.SYSTEM,
      ErrorSeverity.FATAL,
      stage,
      context,
      originalError
    );
  }
  
  /**
   * Log an info message
   * @param {string} message - Info message
   * @param {string} stage - Import stage
   * @param {Object} context - Additional context
   * @returns {string} Error ID
   */
  static logInfo(message, stage, context = {}) {
    return ErrorLogger.createAndLogError(
      message,
      ErrorCategory.PROCESSING,
      ErrorSeverity.INFO,
      stage,
      context
    );
  }
  
  /**
   * Get error statistics by category, severity, and stage
   * @returns {Object} Error statistics
   */
  static getErrorStats() {
    // Read and parse error log
    if (!fs.existsSync(ERROR_LOG_FILE)) {
      return {
        totalErrors: 0,
        byCategory: {},
        bySeverity: {},
        byStage: {}
      };
    }
    
    const logContent = fs.readFileSync(ERROR_LOG_FILE, 'utf8');
    const logLines = logContent.split('\n').filter(line => line.trim());
    
    const stats = {
      totalErrors: logLines.length,
      byCategory: {},
      bySeverity: {},
      byStage: {}
    };
    
    // Parse log lines to build statistics
    const regex = /\[.*?\] \[(ERR-.*?)\] \[(.*?)\] \[(.*?)\] \[(.*?)\]/;
    
    logLines.forEach(line => {
      const match = line.match(regex);
      if (match) {
        const [, , severity, category, stage] = match;
        
        // Count by category
        stats.byCategory[category] = (stats.byCategory[category] || 0) + 1;
        
        // Count by severity
        stats.bySeverity[severity] = (stats.bySeverity[severity] || 0) + 1;
        
        // Count by stage
        stats.byStage[stage] = (stats.byStage[stage] || 0) + 1;
      }
    });
    
    return stats;
  }
}

/**
 * API error handler with retry capabilities
 */
export class ApiErrorHandler {
  /**
   * Constructor
   * @param {number} maxRetries - Maximum number of retry attempts
   * @param {number} initialDelay - Initial delay in milliseconds
   * @param {number} maxDelay - Maximum delay in milliseconds
   */
  constructor(maxRetries = 3, initialDelay = 1000, maxDelay = 30000) {
    this.maxRetries = maxRetries;
    this.initialDelay = initialDelay;
    this.maxDelay = maxDelay;
  }
  
  /**
   * Execute an API call with retry logic
   * @param {Function} apiCall - API call function to execute
   * @param {string} stage - Import stage
   * @param {Object} context - Additional context
   * @returns {Promise<any>} API call result
   */
  async executeWithRetry(apiCall, stage, context = {}) {
    let retries = 0;
    let delay = this.initialDelay;
    
    while (true) {
      try {
        return await apiCall();
      } catch (error) {
        // Check if we've exhausted retry attempts
        if (retries >= this.maxRetries) {
          // Log the final failure
          ErrorLogger.logApiError(
            `API call failed after ${retries} retries: ${error.message}`,
            stage,
            { ...context, retries },
            error
          );
          throw error;
        }
        
        // Handle specific error cases
        let shouldRetry = false;
        let errorMessage = '';
        
        if (error.response) {
          // Server responded with error status
          const { status, data } = error.response;
          
          if (status === 429) {
            // Rate limit exceeded - always retry
            shouldRetry = true;
            errorMessage = `Rate limit exceeded (429): ${JSON.stringify(data)}`;
            
            // Use Retry-After header if available
            const retryAfter = error.response.headers['retry-after'];
            if (retryAfter) {
              delay = parseInt(retryAfter, 10) * 1000; // Convert to milliseconds
            }
          } else if (status >= 500) {
            // Server error - retry
            shouldRetry = true;
            errorMessage = `Server error (${status}): ${JSON.stringify(data)}`;
          } else if (status === 401 || status === 403) {
            // Authentication/authorization error - don't retry
            shouldRetry = false;
            errorMessage = `Authentication error (${status}): ${JSON.stringify(data)}`;
          } else {
            // Other client errors - don't retry
            shouldRetry = false;
            errorMessage = `API error (${status}): ${JSON.stringify(data)}`;
          }
        } else if (error.request) {
          // No response received - retry
          shouldRetry = true;
          errorMessage = 'No response received from server';
        } else {
          // Request setup error - don't retry
          shouldRetry = false;
          errorMessage = `Request setup error: ${error.message}`;
        }
        
        // Log the error
        if (shouldRetry) {
          ErrorLogger.logApiError(
            `${errorMessage}. Retrying (${retries + 1}/${this.maxRetries})...`,
            stage,
            { ...context, retries, delay },
            error
          );
          
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, delay));
          
          // Increase delay for next retry (exponential backoff)
          delay = Math.min(delay * 2, this.maxDelay);
          retries++;
        } else {
          // Log and throw for non-retryable errors
          ErrorLogger.logApiError(
            errorMessage,
            stage,
            context,
            error
          );
          throw error;
        }
      }
    }
  }
}

export default {
  ErrorCategory,
  ErrorSeverity,
  ImportStage,
  ImportError,
  ErrorLogger,
  ApiErrorHandler
};