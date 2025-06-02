// code.ts - Main plugin code
figma.showUI(__html__, { width: 400, height: 420 });

async function exportCollections() {
  try {
    // Get all local variable collections
    const collections = await figma.variables.getLocalVariableCollectionsAsync();
    
    // Notify user about number of collections found
    figma.notify(`Found ${collections.length} local collection(s)`);
    
    if (collections.length === 0) {
      figma.ui.postMessage({ 
        type: 'no-collections',
        message: 'No local collections found in this file.' 
      });
      return;
    }

    const exportData = {};
    const orderedData = {};

    // Process each collection in order
    for (const collection of collections) {
      // Get variables for this collection
      const allVariables = await figma.variables.getLocalVariablesAsync();
      const collectionVariables = allVariables.filter(variable => 
        variable.variableCollectionId === collection.id
      );

      // Process each variable
      for (const variable of collectionVariables) {
        // Process modes in their original order
        for (const mode of collection.modes) {
          const value = variable.valuesByMode[mode.modeId];
          if (value !== undefined) {
            // Parse variable name path
            const pathParts = variable.name.split('/');
            
            let current;
            
            // If mode is "Mode 1", shift everything up one level
            if (mode.name === "Mode 1") {
              current = exportData;
            } else {
              // For other modes, keep the mode wrapper
              if (!exportData[mode.name]) {
                exportData[mode.name] = {};
              }
              current = exportData[mode.name];
            }
            
            // Create nested structure
            for (let i = 0; i < pathParts.length - 1; i++) {
              if (!current[pathParts[i]]) {
                current[pathParts[i]] = {};
              }
              current = current[pathParts[i]];
            }
            
            // Set the final variable with $type and $value
            const finalKey = pathParts[pathParts.length - 1];
            current[finalKey] = {
              "$type": getVariableType(variable.resolvedType),
              "$value": resolveVariableValue(value, variable.name)
            };
          }
        }
      }
    }

    // Sort all keys with second digit priority before sending
    const sortedData = sortObjectKeysRecursively(exportData);
    
    // Send data to UI for display and download
    figma.ui.postMessage({
      type: 'export-ready',
      data: sortedData
    });

  } catch (error) {
    figma.notify(`Error: ${error.message}`, { error: true });
    console.error('Export error:', error);
  }
}

// Helper function to sort object keys recursively with second digit priority
function sortObjectKeysRecursively(obj) {
  if (Array.isArray(obj)) {
    return obj.map(sortObjectKeysRecursively);
  } else if (obj !== null && typeof obj === 'object') {
    // Get all keys and sort them with second digit priority
    const keys = Object.keys(obj).sort((a, b) => {
      // Check if both keys are purely numeric strings
      const aIsNumeric = /^\d+$/.test(a);
      const bIsNumeric = /^\d+$/.test(b);
      
      if (aIsNumeric && bIsNumeric) {
        // Get second digit (or 0 if string has only 1 digit)
        const aSecondDigit = a.length > 1 ? parseInt(a[1], 10) : 0;
        const bSecondDigit = b.length > 1 ? parseInt(b[1], 10) : 0;
        
        // First priority: second digit (0 comes before 1, etc.)
        if (aSecondDigit !== bSecondDigit) {
          return aSecondDigit - bSecondDigit;
        }
        
        // If second digits are same, sort by full numeric value
        const aNum = parseInt(a, 10);
        const bNum = parseInt(b, 10);
        return aNum - bNum;
      }
      
      // For non-numeric keys, use standard alphabetical sort
      return a.localeCompare(b, undefined, {
        numeric: true,
        sensitivity: 'base'
      });
    });
    
    // Use Object.fromEntries to maintain key order
    return Object.fromEntries(
      keys.map(key => [key, sortObjectKeysRecursively(obj[key])])
    );
  }
  
  return obj;
}

// Helper function to sort JSON object keys with leading zeros FIRST
// ONLY sorts pure numeric keys like "02", "04", "12"
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

// Helper function to convert Figma variable types to design token types
function getVariableType(figmaType) {
  switch (figmaType) {
    case 'COLOR':
      return 'color';
    case 'FLOAT':
      return 'number';
    case 'STRING':
      return 'string';
    case 'BOOLEAN':
      return 'boolean';
    default:
      return 'string';
  }
}

// Helper function to resolve variable values and format colors
function resolveVariableValue(value, variableName) {
  if (typeof value === 'object' && value !== null) {
    if (value.type === 'VARIABLE_ALIAS') {
      // Convert variable ID reference to token reference format
      return `{${variableName}}`;
    }
    
    // Handle color values
    if (value.r !== undefined && value.g !== undefined && value.b !== undefined) {
      const r = Math.round(value.r * 255);
      const g = Math.round(value.g * 255);
      const b = Math.round(value.b * 255);
      const a = value.a !== undefined ? value.a : 1;
      
      // If alpha is 1 (fully opaque), return hex format
      if (a === 1) {
        const toHex = (n) => n.toString(16).padStart(2, '0');
        return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
      } else {
        // If alpha is not 1, return rgba format with 2 decimal places
        const roundedAlpha = Math.round(a * 100) / 100;
        return `rgba(${r},${g},${b},${roundedAlpha})`;
      }
    }
    
    return value;
  }
  return value;
}

// Handle UI messages
figma.ui.onmessage = (msg) => {
  switch (msg.type) {
    case 'export-collections':
      exportCollections();
      break;
    case 'close-plugin':
      figma.closePlugin();
      break;
  }
};

// Auto-start export
exportCollections();