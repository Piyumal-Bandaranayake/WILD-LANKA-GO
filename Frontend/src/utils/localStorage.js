/**
 * Safe localStorage utilities
 * Handles localStorage operations with proper error handling
 */

export const safeLocalStorage = {
  /**
   * Safely get item from localStorage
   * @param {string} key - The key to retrieve
   * @returns {string|null} - The stored value or null if not found/invalid
   */
  getItem(key) {
    try {
      const item = localStorage.getItem(key);
      if (item === null || item === 'undefined' || item === 'null') {
        return null;
      }
      return item;
    } catch (error) {
      console.error(`❌ Error getting item from localStorage (${key}):`, error);
      return null;
    }
  },

  /**
   * Safely set item in localStorage
   * @param {string} key - The key to store
   * @param {any} value - The value to store
   * @returns {boolean} - True if successful, false otherwise
   */
  setItem(key, value) {
    try {
      if (value === null || value === undefined) {
        localStorage.removeItem(key);
        return true;
      }
      
      // Handle different types of values
      let stringValue;
      if (typeof value === 'string') {
        stringValue = value;
      } else {
        stringValue = JSON.stringify(value);
      }
      
      localStorage.setItem(key, stringValue);
      console.log(`✅ Stored ${key} in localStorage:`, value);
      return true;
    } catch (error) {
      console.error(`❌ Error setting item in localStorage (${key}):`, error);
      return false;
    }
  },

  /**
   * Safely remove item from localStorage
   * @param {string} key - The key to remove
   * @returns {boolean} - True if successful, false otherwise
   */
  removeItem(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`❌ Error removing item from localStorage (${key}):`, error);
      return false;
    }
  },

  /**
   * Safely parse JSON from localStorage
   * @param {string} key - The key to retrieve and parse
   * @returns {any|null} - The parsed value or null if not found/invalid
   */
  getJSON(key) {
    try {
      const item = this.getItem(key);
      if (item === null) {
        return null;
      }
      
      // Try to parse as JSON, if it fails, return the string value
      try {
        const parsed = JSON.parse(item);
        console.log(`✅ Retrieved ${key} from localStorage:`, parsed);
        return parsed;
      } catch (parseError) {
        // If JSON parsing fails, it might be a plain string
        console.log(`⚠️ ${key} is not valid JSON, returning as string:`, item);
        return item;
      }
    } catch (error) {
      console.error(`❌ Error getting JSON from localStorage (${key}):`, error);
      // Remove corrupted data
      this.removeItem(key);
      return null;
    }
  },

  /**
   * Clear all auth-related data
   */
  clearAuthData() {
    this.removeItem('user');
    this.removeItem('token');
    this.removeItem('backendUser');
    console.log('🧹 Cleared all auth data from localStorage');
  },

  /**
   * Force clear all auth data and reload page
   * Use this when there are authentication conflicts
   */
  forceClearAuth() {
    console.log('🧹 Force clearing all authentication data');
    this.clearAuthData();
    // Clear any other potential auth-related keys
    this.removeItem('auth0');
    this.removeItem('auth0Cache');
    this.removeItem('auth0.is.authenticated');
    // Reload the page to ensure clean state
    window.location.reload();
  }
};

export default safeLocalStorage;

