import React, { useState, useEffect } from 'react';

/**
 * Error notification component for displaying API errors and system messages
 * Provides user-friendly error messages with retry options
 */
const ErrorNotification = ({ 
  error, 
  onRetry, 
  onDismiss, 
  autoHide = true, 
  hideDelay = 5000,
  position = 'top-right' 
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (autoHide && error && !error.canRetry) {
      const timer = setTimeout(() => {
        handleDismiss();
      }, hideDelay);

      return () => clearTimeout(timer);
    }
  }, [error, autoHide, hideDelay]);

  const handleDismiss = () => {
    setIsAnimating(true);
    setTimeout(() => {
      setIsVisible(false);
      if (onDismiss) onDismiss();
    }, 300);
  };

  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    }
    handleDismiss();
  };

  if (!error || !isVisible) return null;

  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-center': 'top-4 left-1/2 transform -translate-x-1/2',
    'bottom-center': 'bottom-4 left-1/2 transform -translate-x-1/2'
  };

  const getErrorIcon = () => {
    if (error.canRetry) {
      return (
        <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
      );
    }
    return (
      <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
      </svg>
    );
  };

  const getBorderColor = () => {
    return error.canRetry ? 'border-yellow-200' : 'border-red-200';
  };

  const getBackgroundColor = () => {
    return error.canRetry ? 'bg-yellow-50' : 'bg-red-50';
  };

  const getTextColor = () => {
    return error.canRetry ? 'text-yellow-800' : 'text-red-800';
  };

  return (
    <div 
      className={`fixed z-50 ${positionClasses[position]} transition-all duration-300 ${
        isAnimating ? 'opacity-0 transform scale-95' : 'opacity-100 transform scale-100'
      }`}
    >
      <div className={`max-w-sm w-full ${getBackgroundColor()} border ${getBorderColor()} rounded-lg shadow-lg p-4`}>
        <div className="flex items-start">
          <div className="flex-shrink-0">
            {getErrorIcon()}
          </div>
          <div className="ml-3 w-0 flex-1">
            <div className={`text-sm font-medium ${getTextColor()}`}>
              {error.title || (error.canRetry ? 'Connection Issue' : 'Error')}
            </div>
            <div className={`mt-1 text-sm ${getTextColor()}`}>
              {error.message}
            </div>
            {error.details && process.env.NODE_ENV === 'development' && (
              <div className="mt-2 text-xs text-gray-600">
                <details>
                  <summary className="cursor-pointer">Technical Details</summary>
                  <pre className="mt-1 whitespace-pre-wrap">{error.details}</pre>
                </details>
              </div>
            )}
            {error.timestamp && (
              <div className="mt-1 text-xs text-gray-500">
                {new Date(error.timestamp).toLocaleTimeString()}
              </div>
            )}
          </div>
          <div className="ml-4 flex-shrink-0 flex">
            <button
              onClick={handleDismiss}
              className={`inline-flex ${getTextColor()} hover:text-gray-500 focus:outline-none focus:text-gray-500 transition ease-in-out duration-150`}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
        
        {error.canRetry && onRetry && (
          <div className="mt-3 flex justify-end">
            <button
              onClick={handleRetry}
              className="text-sm bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2"
            >
              <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Retry
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Hook for managing error notifications
 */
export const useErrorNotification = () => {
  const [errors, setErrors] = useState([]);

  const addError = (error) => {
    const errorWithId = {
      ...error,
      id: error.id || Date.now().toString() + Math.random().toString(36).substr(2, 9)
    };
    setErrors(prev => [...prev, errorWithId]);
  };

  const removeError = (errorId) => {
    setErrors(prev => prev.filter(error => error.id !== errorId));
  };

  const clearErrors = () => {
    setErrors([]);
  };

  return {
    errors,
    addError,
    removeError,
    clearErrors
  };
};

export default ErrorNotification;
