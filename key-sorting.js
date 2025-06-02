/**
 * Key Sorting Functions for Figma Plugin
 * Handles sorting of JSON object keys with priority for leading zeros
 * ONLY sorts pure numeric keys like "02", "04", "12"
 */

// Helper function to sort JSON object keys with leading zeros FIRST
function sortJsonKeysNumerically(obj) {
  if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) {
    return obj;
  }

  const sortedObj = {};
  
  // Get all keys and sort them
  const keys = Object.keys(obj);
  
  // Simple sorting function focused ONLY on pure numeric keys
  keys.sort((a, b) => {
    // Check if both keys are PURE numeric strings (only digits)
    const aIsPureNumeric = /^\d+$/.test(a);
    const bIsPureNumeric = /^\d+$/.test(b);
    
    // If both are pure numeric, apply special sorting
    if (aIsPureNumeric && bIsPureNumeric) {
      // Check for leading zeros (multi-digit starting with 0)
      const aHasLeadingZero = a.length > 1 && a.charAt(0) === '0';
      const bHasLeadingZero = b.length > 1 && b.charAt(0) === '0';
      
      // Leading zero keys come FIRST
      if (aHasLeadingZero && !bHasLeadingZero) {
        return -1; // a comes before b
      }
      if (!aHasLeadingZero && bHasLeadingZero) {
        return 1; // b comes before a
      }
      
      // Both have leading zeros OR both don't have leading zeros
      // Sort by actual numeric value
      const aValue = parseInt(a, 10);
      const bValue = parseInt(b, 10);
      return aValue - bValue;
    }
    
    // If only one is pure numeric, numeric comes first
    if (aIsPureNumeric && !bIsPureNumeric) {
      return -1;
    }
    if (!aIsPureNumeric && bIsPureNumeric) {
      return 1;
    }
    
    // Both are non-numeric, sort alphabetically
    return a.localeCompare(b);
  });
  
  // Build new object with sorted keys and recursively sort nested objects
  keys.forEach(key => {
    sortedObj[key] = sortJsonKeysNumerically(obj[key]);
  });
  
  return sortedObj;
}

// Export functions for use in other files
if (typeof module !== 'undefined' && module.exports) {
  // Node.js environment
  module.exports = {
    sortJsonKeysNumerically
  };
} else {
  // Browser environment - attach to window
  window.KeySorting = {
    sortJsonKeysNumerically
  };
}