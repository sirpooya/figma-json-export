/**
 * Sorts JSON object keys numerically in ascending order
 * Handles both pure numeric keys and keys with numeric prefixes
 */

function sortJsonKeysNumerically(obj) {
  if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) {
    return obj;
  }

  const sortedObj = {};
  
  // Get all keys and sort them
  const keys = Object.keys(obj);
  
  // Custom sorting function that prioritizes numeric values
  keys.sort((a, b) => {
    // Extract numeric parts from keys
    const getNumericValue = (key) => {
      // Handle pure numbers (like "02", "04", "96")
      if (/^\d+$/.test(key)) {
        return parseInt(key, 10);
      }
      
      // Handle keys that start with numbers (like "2xl", "3xs")
      const numMatch = key.match(/^(\d+)/);
      if (numMatch) {
        return parseInt(numMatch[1], 10);
      }
      
      // Handle keys with numbers at the end (like "border-1", "space-10")
      const endNumMatch = key.match(/(\d+)$/);
      if (endNumMatch) {
        return parseInt(endNumMatch[1], 10);
      }
      
      // Return a high number for non-numeric keys to put them at the end
      return Infinity;
    };
    
    const numA = getNumericValue(a);
    const numB = getNumericValue(b);
    
    // If both have numeric values, sort numerically
    if (numA !== Infinity && numB !== Infinity) {
      if (numA !== numB) {
        return numA - numB;
      }
      // If numeric parts are equal, sort alphabetically
      return a.localeCompare(b);
    }
    
    // If only one has numeric value, put numeric first
    if (numA !== Infinity) return -1;
    if (numB !== Infinity) return 1;
    
    // If neither has numeric value, sort alphabetically
    return a.localeCompare(b);
  });
  
  // Build new object with sorted keys and recursively sort nested objects
  keys.forEach(key => {
    sortedObj[key] = sortJsonKeysNumerically(obj[key]);
  });
  
  return sortedObj;
}

// Enhanced version that can target specific paths or levels
function sortJsonKeysAtLevel(obj, targetLevel = null, currentLevel = 0) {
  if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) {
    return obj;
  }

  const sortedObj = {};
  const keys = Object.keys(obj);
  
  // Determine if we should sort at this level
  const shouldSort = targetLevel === null || currentLevel === targetLevel;
  
  if (shouldSort) {
    // Sort keys numerically (same logic as above)
    keys.sort((a, b) => {
      const getNumericValue = (key) => {
        if (/^\d+$/.test(key)) return parseInt(key, 10);
        const numMatch = key.match(/^(\d+)/);
        if (numMatch) return parseInt(numMatch[1], 10);
        const endNumMatch = key.match(/(\d+)$/);
        if (endNumMatch) return parseInt(endNumMatch[1], 10);
        return Infinity;
      };
      
      const numA = getNumericValue(a);
      const numB = getNumericValue(b);
      
      if (numA !== Infinity && numB !== Infinity) {
        if (numA !== numB) return numA - numB;
        return a.localeCompare(b);
      }
      if (numA !== Infinity) return -1;
      if (numB !== Infinity) return 1;
      return a.localeCompare(b);
    });
  }
  
  // Recursively process nested objects
  keys.forEach(key => {
    sortedObj[key] = sortJsonKeysAtLevel(obj[key], targetLevel, currentLevel + 1);
  });
  
  return sortedObj;
}

// Function to find and display all numeric keys and their levels
function findNumericKeys(obj, path = '', level = 0, results = []) {
  if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) {
    return results;
  }
  
  Object.keys(obj).forEach(key => {
    const currentPath = path ? `${path}.${key}` : key;
    
    // Check if key is numeric or contains numbers
    if (/\d/.test(key)) {
      results.push({
        key: key,
        level: level,
        path: currentPath,
        isNumeric: /^\d+$/.test(key)
      });
    }
    
    // Recursively search nested objects
    findNumericKeys(obj[key], currentPath, level + 1, results);
  });
  
  return results;
}

// Example usage with your JSON data:

// Load your JSON data
const jsonData = {
  // ... your JSON data here
};

// 1. Sort all keys numerically throughout the entire JSON
console.log('=== Sorting all keys numerically ===');
const fullySorted = sortJsonKeysNumerically(jsonData);

// 2. Sort only keys at specific level (e.g., level 2 where "02", "04" appear)
console.log('=== Sorting keys only at level 2 ===');
const level2Sorted = sortJsonKeysAtLevel(jsonData, 2);

// 3. Find all numeric keys and their levels
console.log('=== Finding all numeric keys ===');
const numericKeys = findNumericKeys(jsonData);
console.log('Numeric keys found:');
numericKeys.forEach(item => {
  console.log(`Level ${item.level}: "${item.key}" at path "${item.path}" (Pure numeric: ${item.isNumeric})`);
});

// 4. Example: Sort specific object (like core.color.neutral)
if (jsonData.core && jsonData.core.color && jsonData.core.color.neutral) {
  console.log('=== Before sorting core.color.neutral ===');
  console.log(Object.keys(jsonData.core.color.neutral));
  
  const sortedNeutral = sortJsonKeysNumerically(jsonData.core.color.neutral);
  console.log('=== After sorting core.color.neutral ===');
  console.log(Object.keys(sortedNeutral));
}

// Export the sorted JSON
console.log('=== Exporting sorted JSON ===');
console.log(JSON.stringify(fullySorted, null, 2));