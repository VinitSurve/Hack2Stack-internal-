/**
 * Performs a Firebase query with automatic retries for network-related errors
 * @param {Function} queryFn - Function that returns a promise (Firebase query)
 * @param {number} maxRetries - Maximum number of retry attempts
 * @param {number} delayMs - Initial delay in milliseconds before retrying
 * @returns {Promise} The result of the query
 */
export const retryOperation = async (queryFn, maxRetries = 3, delayMs = 1000) => {
  let retries = 0;
  let lastError;

  while (retries <= maxRetries) {
    try {
      return await queryFn();
    } catch (error) {
      lastError = error;
      
      // Only retry for network-related errors
      const isNetworkError = error.code === 'unavailable' || 
                            error.code === 'network-request-failed' ||
                            error.message.includes('network') ||
                            error.message.includes('timeout');
      
      if (!isNetworkError || retries >= maxRetries) {
        throw error;
      }
      
      // Exponential backoff - delay increases with each retry
      const delay = delayMs * Math.pow(2, retries);
      console.log(`Network error, retrying in ${delay}ms...`, error);
      
      await new Promise(resolve => setTimeout(resolve, delay));
      retries++;
    }
  }
  
  throw lastError;
};

/**
 * Checks if the browser is online
 * @returns {boolean} True if online, false otherwise
 */
export const isOnline = () => {
  return typeof navigator !== 'undefined' && typeof navigator.onLine === 'boolean' 
    ? navigator.onLine 
    : true; // Default to true if we can't determine
};
