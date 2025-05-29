# PMR_BTC_EVENT_Import Error Handling and Logging

This document outlines the error handling and logging architecture for the BTC to TT event import process.

## Error Classification

Errors in the import process are classified into the following categories:

1. **API Access Errors**
   - WordPress API connection failures
   - TangoTiempo API connection failures
   - Authentication failures
   - Rate limiting issues

2. **Entity Resolution Errors**
   - Venue not found
   - Organizer not found
   - Category not mapped
   - Geographic hierarchy issues

3. **Data Validation Errors**
   - Missing required fields
   - Invalid field formats
   - Data type mismatches
   - Date/time conversion errors

4. **Processing Errors**
   - Parsing failures
   - Mapping failures
   - Database errors
   - Duplicate detection issues

5. **System Errors**
   - Out of memory
   - Timeout
   - Unexpected exceptions
   - File system errors

## Error Handling Implementation

```javascript
// error-handler.js
// Error handling and logging utilities for BTC import

const fs = require('fs');
const path = require('path');

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
const ErrorCategory = {
  API_ACCESS: 'API_ACCESS',
  ENTITY_RESOLUTION: 'ENTITY_RESOLUTION',
  DATA_VALIDATION: 'DATA_VALIDATION',
  PROCESSING: 'PROCESSING',
  SYSTEM: 'SYSTEM'
};

/**
 * Error severities
 */
const ErrorSeverity = {
  INFO: 'INFO',
  WARNING: 'WARNING',
  ERROR: 'ERROR',
  FATAL: 'FATAL'
};

/**
 * Import stages
 */
const ImportStage = {
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
 * Custom error class for BTC import errors
 */
class ImportError extends Error {
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
 * Generate a unique error ID
 * @returns {string} Unique error ID
 */
function generateErrorId() {
  return `ERR-${Date.now()}-${Math.floor(Math.random() * 1000000).toString().padStart(6, '0')}`;
}

/**
 * Error logger
 */
class ErrorLogger {
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
  
  /**
   * Get list of error IDs for detailed investigation
   * @param {Object} filters - Filters to apply (category, severity, stage)
   * @returns {Array} List of error IDs
   */
  static getErrorIds(filters = {}) {
    if (!fs.existsSync(ERROR_LOG_FILE)) {
      return [];
    }
    
    const logContent = fs.readFileSync(ERROR_LOG_FILE, 'utf8');
    const logLines = logContent.split('\n').filter(line => line.trim());
    
    const regex = /\[.*?\] \[(ERR-.*?)\] \[(.*?)\] \[(.*?)\] \[(.*?)\]/;
    const errorIds = [];
    
    logLines.forEach(line => {
      const match = line.match(regex);
      if (match) {
        const [, errorId, severity, category, stage] = match;
        
        // Apply filters
        let include = true;
        if (filters.category && category !== filters.category) include = false;
        if (filters.severity && severity !== filters.severity) include = false;
        if (filters.stage && stage !== filters.stage) include = false;
        
        if (include) {
          errorIds.push(errorId);
        }
      }
    });
    
    return errorIds;
  }
  
  /**
   * Get error details by ID
   * @param {string} errorId - Error ID
   * @returns {Object|null} Error details or null if not found
   */
  static getErrorDetails(errorId) {
    const detailsFile = path.join(ERROR_DETAILS_DIR, `${errorId}.json`);
    if (!fs.existsSync(detailsFile)) {
      return null;
    }
    
    try {
      return JSON.parse(fs.readFileSync(detailsFile, 'utf8'));
    } catch (error) {
      console.error(`Error parsing error details for ${errorId}:`, error);
      return null;
    }
  }
}

/**
 * API error handler with retry capabilities
 */
class ApiErrorHandler {
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

module.exports = {
  ErrorCategory,
  ErrorSeverity,
  ImportStage,
  ImportError,
  ErrorLogger,
  ApiErrorHandler
};
```

## Logging Format

### Log Files

The error handling system creates two types of log files:

1. **Main Log File**
   - Path: `logs/import-errors.log`
   - Format: `[timestamp] [error-id] [severity] [category] [stage] message`
   - Purpose: Provides a chronological record of all errors

2. **Detailed Error Files**
   - Path: `logs/error-details/ERR-{timestamp}-{random}.json`
   - Format: JSON with complete error details
   - Purpose: Stores full context for each error

### Log Entry Structure

Each detailed error log contains:

```json
{
  "timestamp": "2025-04-24T15:30:45.123Z",
  "error": {
    "id": "ERR-1714147845123-123456",
    "timestamp": "2025-04-24T15:30:45.123Z",
    "name": "ImportError",
    "message": "Failed to resolve venue 'Dance Studio Name'",
    "category": "ENTITY_RESOLUTION",
    "severity": "WARNING",
    "stage": "ENTITY_RESOLUTION",
    "context": {
      "venueName": "Dance Studio Name",
      "venueId": "678",
      "apiResponseStatus": 404
    },
    "stack": "ImportError: Failed to resolve venue...",
    "originalError": {
      "name": "AxiosError",
      "message": "Request failed with status code 404",
      "stack": "AxiosError: Request failed with status code 404..."
    }
  }
}
```

## Retry Strategy

The `ApiErrorHandler` class implements a sophisticated retry strategy:

1. **Exponential Backoff**
   - Initial delay: 1000ms (1 second)
   - Each retry doubles the delay
   - Maximum delay: 30000ms (30 seconds)

2. **Status-based Retries**
   - HTTP 429 (Rate Limit): Always retry
   - HTTP 5xx (Server Error): Retry
   - HTTP 401/403 (Auth Error): Don't retry
   - HTTP 4xx (Client Error): Don't retry
   - Network errors: Retry

3. **Retry Limits**
   - Default: 3 retries
   - Configurable per operation

4. **Header Respect**
   - Honors `Retry-After` headers when present

## Error Reporting

The system provides error reporting capabilities:

1. **Error Statistics**
   - Count by category
   - Count by severity
   - Count by import stage

2. **Filtered Error Reports**
   - Filter by category
   - Filter by severity
   - Filter by stage

3. **Detailed Error Lookup**
   - Retrieve full error details by ID

## Usage Examples

### Basic Error Logging

```javascript
const { ErrorLogger, ImportStage } = require('./error-handler');

try {
  // Attempt some operation
  throw new Error('Something went wrong');
} catch (error) {
  // Log the error
  ErrorLogger.logProcessingError(
    'Failed to process event',
    ImportStage.TRANSFORMATION,
    { eventId: '12345' },
    error
  );
}
```

### API Call With Retry

```javascript
const { ApiErrorHandler, ImportStage } = require('./error-handler');
const axios = require('axios');

async function fetchEventData(date) {
  const apiHandler = new ApiErrorHandler(3, 1000, 30000);
  
  return await apiHandler.executeWithRetry(
    async () => {
      const response = await axios.get('https://example.com/api/events', {
        params: { date }
      });
      return response.data;
    },
    ImportStage.EXTRACTION,
    { date }
  );
}
```

### Generate Error Report

```javascript
const { ErrorLogger } = require('./error-handler');

// Get error statistics
const errorStats = ErrorLogger.getErrorStats();
console.log(`Total errors: ${errorStats.totalErrors}`);
console.log('By category:', errorStats.byCategory);
console.log('By severity:', errorStats.bySeverity);

// Get list of entity resolution errors
const entityErrorIds = ErrorLogger.getErrorIds({
  category: 'ENTITY_RESOLUTION'
});

// Get details for a specific error
if (entityErrorIds.length > 0) {
  const errorDetails = ErrorLogger.getErrorDetails(entityErrorIds[0]);
  console.log('Error details:', errorDetails);
}
```

## Integration with Import Process

This error handling and logging system should be integrated throughout the import process:

1. **Initialization Stage**
   - Log API configuration
   - Validate prerequisites
   - Handle configuration errors

2. **Extraction Stage**
   - Handle WordPress API rate limits
   - Retry server errors
   - Log data extraction issues

3. **Entity Resolution Stage**
   - Log unmatched venues/organizers/categories
   - Record mapping statistics
   - Highlight entities needing manual intervention

4. **Validation Stage**
   - Log invalid or missing data
   - Identify events that cannot be imported
   - Record validation statistics

5. **Loading Stage**
   - Handle TangoTiempo API errors
   - Track successful imports
   - Log insertion failures

6. **Verification Stage**
   - Validate imported events
   - Compare counts between systems
   - Log discrepancies