/**
 * API Error Handler with retry mechanisms and comprehensive error logging
 * Provides consistent error handling and retry logic for API calls
 */

class APIError extends Error {
  constructor(message, status, code, details = {}) {
    super(message);
    this.name = 'APIError';
    this.status = status;
    this.code = code;
    this.details = details;
    this.timestamp = new Date().toISOString();
  }
}

class APIErrorHandler {
  constructor() {
    this.retryConfig = {
      maxRetries: 3,
      baseDelay: 1000, // 1 second
      maxDelay: 10000, // 10 seconds
      backoffFactor: 2,
      retryableStatuses: [408, 429, 500, 502, 503, 504]
    };
  }

  /**
   * Determines if an error is retryable
   */
  isRetryable(error) {
    if (!error.status) return false;
    return this.retryConfig.retryableStatuses.includes(error.status);
  }

  /**
   * Calculates delay for retry with exponential backoff
   */
  calculateDelay(attempt) {
    const delay = this.retryConfig.baseDelay * Math.pow(this.retryConfig.backoffFactor, attempt - 1);
    return Math.min(delay, this.retryConfig.maxDelay);
  }

  /**
   * Sleeps for specified milliseconds
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Logs API errors with context
   */
  logError(error, context = {}) {
    const errorLog = {
      timestamp: new Date().toISOString(),
      error: {
        message: error.message,
        status: error.status,
        code: error.code,
        details: error.details
      },
      context: {
        url: context.url,
        method: context.method,
        userRole: context.userRole,
        userId: context.userId,
        attempt: context.attempt,
        ...context
      },
      userAgent: navigator.userAgent,
      location: window.location.href
    };

    console.error('API Error:', errorLog);

    // In production, send to logging service
    if (process.env.NODE_ENV === 'production') {
      this.sendToLoggingService(errorLog);
    }
  }

  /**
   * Sends error logs to external logging service
   */
  async sendToLoggingService(errorLog) {
    try {
      // In a real application, replace with your logging service endpoint
      // await fetch('/api/logs/errors', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(errorLog)
      // });
      console.log('Error logged to service:', errorLog);
    } catch (logError) {
      console.error('Failed to send error to logging service:', logError);
    }
  }

  /**
   * Parses API response and creates appropriate error
   */
  async parseError(response, context = {}) {
    let errorData;
    try {
      errorData = await response.json();
    } catch {
      errorData = { message: 'Unknown error occurred' };
    }

    const error = new APIError(
      errorData.message || `HTTP ${response.status}`,
      response.status,
      errorData.code || 'UNKNOWN_ERROR',
      {
        ...errorData,
        url: response.url,
        statusText: response.statusText
      }
    );

    this.logError(error, context);
    return error;
  }

  /**
   * Executes API call with retry logic
   */
  async executeWithRetry(apiCall, context = {}) {
    let lastError;
    
    for (let attempt = 1; attempt <= this.retryConfig.maxRetries + 1; attempt++) {
      try {
        const response = await apiCall();
        
        // Log successful retry if this wasn't the first attempt
        if (attempt > 1) {
          console.log(`API call succeeded on attempt ${attempt}`, context);
        }
        
        return response;
      } catch (error) {
        lastError = error;
        
        // Enhanced context for logging
        const errorContext = {
          ...context,
          attempt,
          maxRetries: this.retryConfig.maxRetries
        };

        // If this is the last attempt or error is not retryable, throw
        if (attempt > this.retryConfig.maxRetries || !this.isRetryable(error)) {
          this.logError(error, { ...errorContext, finalAttempt: true });
          throw error;
        }

        // Log retry attempt
        const delay = this.calculateDelay(attempt);
        console.warn(`API call failed (attempt ${attempt}), retrying in ${delay}ms:`, error.message);
        this.logError(error, { ...errorContext, retrying: true, delay });

        // Wait before retry
        await this.sleep(delay);
      }
    }

    throw lastError;
  }

  /**
   * Wraps fetch with error handling and retry logic
   */
  async fetchWithRetry(url, options = {}, context = {}) {
    const apiCall = async () => {
      const response = await fetch(url, options);
      
      if (!response.ok) {
        throw await this.parseError(response, {
          ...context,
          url,
          method: options.method || 'GET'
        });
      }
      
      return response;
    };

    return this.executeWithRetry(apiCall, {
      ...context,
      url,
      method: options.method || 'GET'
    });
  }

  /**
   * Creates user-friendly error messages
   */
  getUserFriendlyMessage(error) {
    if (!error.status) {
      return 'Network error. Please check your connection and try again.';
    }

    switch (error.status) {
      case 400:
        return error.message || 'Invalid request. Please check your input and try again.';
      case 401:
        return 'Authentication required. Please log in and try again.';
      case 403:
        return 'Access denied. You don\'t have permission to perform this action.';
      case 404:
        return 'The requested resource was not found.';
      case 408:
        return 'Request timeout. Please try again.';
      case 429:
        return 'Too many requests. Please wait a moment and try again.';
      case 500:
        return 'Server error. Please try again later.';
      case 502:
      case 503:
      case 504:
        return 'Service temporarily unavailable. Please try again later.';
      default:
        return error.message || 'An unexpected error occurred. Please try again.';
    }
  }

  /**
   * Creates error notification object for UI
   */
  createErrorNotification(error, context = {}) {
    return {
      id: Date.now().toString(),
      type: 'error',
      title: 'Error',
      message: this.getUserFriendlyMessage(error),
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      timestamp: new Date().toISOString(),
      canRetry: this.isRetryable(error),
      context
    };
  }
}

// Create singleton instance
const apiErrorHandler = new APIErrorHandler();

export default apiErrorHandler;
export { APIError, APIErrorHandler };