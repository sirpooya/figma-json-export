// code.js - Plugin with shell script execution
figma.showUI(__html__, { width: 400, height: 420 });

async function exportCollections() {
  try {
    const exportData = {};
    let variableCount = 0;
    let colorStyleCount = 0;
    let textStyleCount = 0;
    let effectStyleCount = 0;

    // Check if variables API is available
    let collections = [];
    try {
      if (figma.variables && figma.variables.getLocalVariableCollectionsAsync) {
        collections = await figma.variables.getLocalVariableCollectionsAsync();
      }
    } catch (variableError) {
      console.error('Error getting variable collections:', variableError);
    }

    // Get styles (these should always be available)
    const colorStyles = figma.getLocalPaintStyles();
    const textStyles = figma.getLocalTextStyles();
    const effectStyles = figma.getLocalEffectStyles();
    
    colorStyleCount = colorStyles.length;
    textStyleCount = textStyles.length;
    effectStyleCount = effectStyles.length;
    
    // Process variables (if available)
    if (collections.length > 0) {
      try {
        const allVariables = await figma.variables.getLocalVariablesAsync();
        
        for (const collection of collections) {
          const collectionVariables = allVariables.filter(variable => 
            variable.variableCollectionId === collection.id
          );
          
          for (const variable of collectionVariables) {
            variableCount++;
            for (const mode of collection.modes) {
              const value = variable.valuesByMode[mode.modeId];
              if (value !== undefined) {
                const pathParts = variable.name.split('/');
                
                let current = mode.name === "Mode 1" ? exportData : (exportData[mode.name] = exportData[mode.name] || {});
                
                for (let i = 0; i < pathParts.length - 1; i++) {
                  current[pathParts[i]] = current[pathParts[i]] || {};
                  current = current[pathParts[i]];
                }
                
                const finalKey = pathParts[pathParts.length - 1];
                current[finalKey] = {
                  "$type": getVariableType(variable.resolvedType),
                  "$value": resolveVariableValue(value, variable.name)
                };
              }
            }
          }
        }
      } catch (variableProcessError) {
        console.error('Error processing variables:', variableProcessError);
      }
    }

    // Process color styles
    if (colorStyles.length > 0) {
      exportData.colorStyles = {};
      
      colorStyles.forEach(style => {
        const pathParts = style.name.split('/');
        let current = exportData.colorStyles;
        
        for (let i = 0; i < pathParts.length - 1; i++) {
          current[pathParts[i]] = current[pathParts[i]] || {};
          current = current[pathParts[i]];
        }
        
        const finalKey = pathParts[pathParts.length - 1];
        const paint = style.paints[0];
        
        if (paint && paint.type === 'SOLID') {
          const r = Math.round(paint.color.r * 255);
          const g = Math.round(paint.color.g * 255);
          const b = Math.round(paint.color.b * 255);
          const a = paint.opacity !== undefined ? paint.opacity : 1;
          
          current[finalKey] = {
            "$type": "color",
            "$value": a === 1 ? 
              `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}` :
              `rgba(${r}, ${g}, ${b}, ${Math.round(a * 100) / 100})`
          };
        }
      });
    }

    // Process text styles
    if (textStyles.length > 0) {
      exportData.textStyles = {};
      
      textStyles.forEach(style => {
        const pathParts = style.name.split('/');
        let current = exportData.textStyles;
        
        for (let i = 0; i < pathParts.length - 1; i++) {
          current[pathParts[i]] = current[pathParts[i]] || {};
          current = current[pathParts[i]];
        }
        
        const finalKey = pathParts[pathParts.length - 1];
        current[finalKey] = {
          "$type": "typography",
          "$value": {
            "fontFamily": style.fontName.family,
            "fontWeight": style.fontName.style,
            "fontSize": style.fontSize
          }
        };
      });
    }

    // Process effect styles
    if (effectStyles.length > 0) {
      exportData.effectStyles = {};
      
      effectStyles.forEach(style => {
        const pathParts = style.name.split('/');
        let current = exportData.effectStyles;
        
        for (let i = 0; i < pathParts.length - 1; i++) {
          current[pathParts[i]] = current[pathParts[i]] || {};
          current = current[pathParts[i]];
        }
        
        const finalKey = pathParts[pathParts.length - 1];
        
        // Process actual effects instead of placeholder
        const effects = style.effects;
        if (effects && effects.length > 0) {
          const effect = effects[0]; // Take first effect
          if (effect.type === 'DROP_SHADOW' || effect.type === 'INNER_SHADOW') {
            current[finalKey] = {
              "$type": "shadow",
              "$value": {
                "color": `rgba(${Math.round(effect.color.r * 255)}, ${Math.round(effect.color.g * 255)}, ${Math.round(effect.color.b * 255)}, ${effect.color.a})`,
                "offsetX": `${effect.offset.x}px`,
                "offsetY": `${effect.offset.y}px`,
                "blur": `${effect.radius}px`,
                "spread": `${effect.spread || 0}px`
              }
            };
          } else {
            current[finalKey] = {
              "$type": "shadow",
              "$value": "effect-placeholder"
            };
          }
        }
      });
    }

    // Send to UI
    const totalItems = variableCount + colorStyleCount + textStyleCount + effectStyleCount;
    
    if (totalItems === 0) {
      figma.notify('No variables or styles found to export');
      figma.ui.postMessage({ 
        type: 'no-collections',
        message: 'No variables or styles found in this file.' 
      });
      return;
    }

    figma.notify(`Export ready: ${totalItems} items found`);
    
    figma.ui.postMessage({
      type: 'export-ready',
      data: exportData,
      counts: {
        variables: variableCount,
        colorStyles: colorStyleCount,
        textStyles: textStyleCount,
        effectStyles: effectStyleCount
      }
    });

  } catch (error) {
    console.error('Export error:', error);
    figma.notify(`Export failed: ${error.message}`, { error: true });
    figma.ui.postMessage({
      type: 'error',
      message: `Export failed: ${error.message}`
    });
  }
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
      return `{${variableName}}`;
    }
    
    if (value.r !== undefined && value.g !== undefined && value.b !== undefined) {
      const r = Math.round(value.r * 255);
      const g = Math.round(value.g * 255);
      const b = Math.round(value.b * 255);
      const a = value.a !== undefined ? value.a : 1;
      
      if (a === 1) {
        const toHex = (n) => n.toString(16).padStart(2, '0');
        return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
      } else {
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