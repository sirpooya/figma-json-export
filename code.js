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
    
    // Get all variables once for all style processing
    let allVariables = [];
    try {
      if (figma.variables && figma.variables.getLocalVariablesAsync) {
        allVariables = await figma.variables.getLocalVariablesAsync();
        console.log(`Loaded ${allVariables.length} variables for style processing`);
      }
    } catch (error) {
      console.log('Could not load variables for style processing:', error);
    }
    
    // Debug: Log what we found
    console.log('=== STYLE DEBUGGING ===');
    console.log('Color styles found:', colorStyleCount);
    console.log('Text styles found:', textStyleCount);
    console.log('Effect styles found:', effectStyleCount);
    
    if (colorStyleCount > 0) {
      console.log('First color style:', colorStyles[0]);
      console.log('First color style name:', colorStyles[0].name);
      console.log('First color style paints:', colorStyles[0].paints);
    }
    
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
                  "$value": resolveVariableValue(value, variable.name, allVariables)
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
      console.log('Processing color styles...');
      exportData.colorStyles = {};
      
      colorStyles.forEach((style, index) => {
        console.log(`Processing color style ${index + 1}:`, style.name);
        
        const pathParts = style.name.split('/');
        let current = exportData.colorStyles;
        
        for (let i = 0; i < pathParts.length - 1; i++) {
          current[pathParts[i]] = current[pathParts[i]] || {};
          current = current[pathParts[i]];
        }
        
        const finalKey = pathParts[pathParts.length - 1];
        const paint = style.paints[0];
        
        console.log(`Paint for ${style.name}:`, paint);
        
        if (paint) {
          if (paint.type === 'SOLID') {
            // Handle solid colors
            let colorValue;
            
            // Check if color is bound to a variable
            if (paint.boundVariables && paint.boundVariables.color) {
              // Color is bound to a variable - create reference
              const variableId = paint.boundVariables.color.id;
              const boundVariable = allVariables.find(v => v.id === variableId);
              
              if (boundVariable) {
                // Create JSON path reference (convert variable name to JSON key path)
                const variablePath = boundVariable.name.replace(/\//g, '.');
                colorValue = `{${variablePath}}`;
              } else {
                // Fallback if variable not found
                colorValue = `{variable:${variableId}}`;
              }
            } else {
              // Regular color value
              const r = Math.round(paint.color.r * 255);
              const g = Math.round(paint.color.g * 255);
              const b = Math.round(paint.color.b * 255);
              const a = paint.opacity !== undefined ? paint.opacity : 1;
              
              colorValue = a === 1 ? 
                `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}` :
                `rgba(${r}, ${g}, ${b}, ${Math.round(a * 100) / 100})`;
            }
            
            current[finalKey] = {
              "$type": "color",
              "$value": colorValue
            };
            
            console.log(`Added solid color ${style.name}:`, colorValue);
            
          } else if (paint.type === 'GRADIENT_LINEAR' || paint.type === 'GRADIENT_RADIAL' || paint.type === 'GRADIENT_ANGULAR' || paint.type === 'GRADIENT_DIAMOND') {
            // Handle gradients
            const gradientStops = paint.gradientStops.map(stop => {
              const r = Math.round(stop.color.r * 255);
              const g = Math.round(stop.color.g * 255);
              const b = Math.round(stop.color.b * 255);
              const a = stop.color.a !== undefined ? stop.color.a : 1;
              
              // Check if color is bound to a variable
              let colorValue;
              if (stop.boundVariables && stop.boundVariables.color) {
                // Color is bound to a variable - create reference
                const variableId = stop.boundVariables.color.id;
                const boundVariable = allVariables.find(v => v.id === variableId);
                
                if (boundVariable) {
                  // Create JSON path reference (convert variable name to JSON key path)
                  const variablePath = boundVariable.name.replace(/\//g, '.');
                  colorValue = `{${variablePath}}`;
                } else {
                  // Fallback if variable not found
                  colorValue = `{variable:${variableId}}`;
                }
              } else {
                // Regular color value
                colorValue = a === 1 ? 
                  `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}` :
                  `rgba(${r}, ${g}, ${b}, ${Math.round(a * 100) / 100})`;
              }
              
              return {
                color: colorValue,
                position: Math.round(stop.position * 100) / 100 // Round to 2 decimal places
              };
            });
            
            // Calculate gradient angle from transform matrix (for linear gradients)
            let angle = 0;
            if (paint.type === 'GRADIENT_LINEAR' && paint.gradientTransform) {
              const transform = paint.gradientTransform;
              // Calculate angle from transform matrix
              angle = Math.round(Math.atan2(transform[0][1], transform[0][0]) * 180 / Math.PI);
              if (angle < 0) angle += 360;
            }
            
            const gradientValue = {
              type: paint.type.toLowerCase().replace('gradient_', ''),
              stops: gradientStops
            };
            
            // Add angle for linear gradients
            if (paint.type === 'GRADIENT_LINEAR') {
              gradientValue.angle = angle;
            }
            
            current[finalKey] = {
              "$type": "gradient",
              "$value": gradientValue
            };
            
            console.log(`Added gradient ${style.name}:`, gradientValue);
            
          } else if (paint.type === 'IMAGE') {
            // Handle image fills
            current[finalKey] = {
              "$type": "image",
              "$value": {
                type: "image",
                scaleMode: paint.scaleMode || "FILL"
              }
            };
            
            console.log(`Added image fill ${style.name}`);
            
          } else {
            // Handle other paint types
            current[finalKey] = {
              "$type": "paint",
              "$value": {
                type: paint.type.toLowerCase(),
                description: `Unsupported paint type: ${paint.type}`
              }
            };
            
            console.log(`Added unsupported paint type ${style.name}: ${paint.type}`);
          }
        } else {
          console.log(`Skipped ${style.name} - no paint found`);
        }
      });
      console.log('Final colorStyles object:', exportData.colorStyles);
    } else {
      console.log('No color styles found to process');
    }

    // Process text styles
    if (textStyles.length > 0) {
      console.log('Processing text styles...');
      exportData.textStyles = {};
      
      textStyles.forEach((style, index) => {
        console.log(`Processing text style ${index + 1}:`, style.name);
        
        const pathParts = style.name.split('/');
        let current = exportData.textStyles;
        
        for (let i = 0; i < pathParts.length - 1; i++) {
          current[pathParts[i]] = current[pathParts[i]] || {};
          current = current[pathParts[i]];
        }
        
        const finalKey = pathParts[pathParts.length - 1];
        
        // Handle font family
        let fontFamily = style.fontName.family;
        if (style.boundVariables && style.boundVariables.fontFamily) {
          const variableId = style.boundVariables.fontFamily.id;
          const boundVariable = allVariables.find(v => v.id === variableId);
          if (boundVariable) {
            const variablePath = boundVariable.name.replace(/\//g, '.');
            fontFamily = `{${variablePath}}`;
          } else {
            fontFamily = `{variable:${variableId}}`;
          }
        }
        
        // Handle font weight
        let fontWeight = style.fontName.style;
        if (style.boundVariables && style.boundVariables.fontWeight) {
          const variableId = style.boundVariables.fontWeight.id;
          const boundVariable = allVariables.find(v => v.id === variableId);
          if (boundVariable) {
            const variablePath = boundVariable.name.replace(/\//g, '.');
            fontWeight = `{${variablePath}}`;
          } else {
            fontWeight = `{variable:${variableId}}`;
          }
        }
        
        // Handle font size
        let fontSize = style.fontSize;
        if (style.boundVariables && style.boundVariables.fontSize) {
          const variableId = style.boundVariables.fontSize.id;
          const boundVariable = allVariables.find(v => v.id === variableId);
          if (boundVariable) {
            const variablePath = boundVariable.name.replace(/\//g, '.');
            fontSize = `{${variablePath}}`;
          } else {
            fontSize = `{variable:${variableId}}`;
          }
        }
        
        // Handle letter spacing
        let letterSpacing = "0";
        if (style.boundVariables && style.boundVariables.letterSpacing) {
          const variableId = style.boundVariables.letterSpacing.id;
          const boundVariable = allVariables.find(v => v.id === variableId);
          if (boundVariable) {
            const variablePath = boundVariable.name.replace(/\//g, '.');
            letterSpacing = `{${variablePath}}`;
          } else {
            letterSpacing = `{variable:${variableId}}`;
          }
        } else if (style.letterSpacing && style.letterSpacing !== figma.mixed) {
          if (style.letterSpacing.unit === "PERCENT") {
            letterSpacing = style.letterSpacing.value.toString();
          } else if (style.letterSpacing.unit === "PIXELS") {
            letterSpacing = `${style.letterSpacing.value}px`;
          } else {
            letterSpacing = style.letterSpacing.value.toString();
          }
        }
        
        // Handle line height with core.font.lineheight matching
        let lineHeight = "normal";
        if (style.boundVariables && style.boundVariables.lineHeight) {
          const variableId = style.boundVariables.lineHeight.id;
          const boundVariable = allVariables.find(v => v.id === variableId);
          if (boundVariable) {
            const variablePath = boundVariable.name.replace(/\//g, '.');
            lineHeight = `{${variablePath}}`;
          } else {
            lineHeight = `{variable:${variableId}}`;
          }
        } else if (style.lineHeight && style.lineHeight !== figma.mixed && typeof style.lineHeight === 'object') {
          if (style.lineHeight.unit === "PERCENT") {
            const percentValue = Math.round(style.lineHeight.value); // Round to nearest integer
            
            // Try to match with core.font.lineheight values
            const coreLineHeightMap = {
              125: "{core.font.lineheight.sm}",
              150: "{core.font.lineheight.md}",
              180: "{core.font.lineheight.lg}"
            };
            
            // Check if the rounded value matches a core lineheight
            if (coreLineHeightMap[percentValue]) {
              lineHeight = coreLineHeightMap[percentValue];
              console.log(`Mapped lineHeight ${style.lineHeight.value}% → ${percentValue}% → ${coreLineHeightMap[percentValue]}`);
            } else {
              // Use percentage format if no match
              lineHeight = `${percentValue}%`;
              console.log(`No mapping found for lineHeight ${style.lineHeight.value}% → ${percentValue}%`);
            }
          } else if (style.lineHeight.unit === "PIXELS") {
            lineHeight = `${style.lineHeight.value}px`;
          } else {
            lineHeight = style.lineHeight.value.toString();
          }
        } else if (typeof style.lineHeight === "number") {
          // Handle unitless line-height values
          lineHeight = style.lineHeight.toString();
        }
        
        const textStyleValue = {
          "fontFamily": fontFamily,
          "fontWeight": fontWeight,
          "fontSize": fontSize,
          "letterSpacing": letterSpacing,
          "lineHeight": lineHeight
        };
        
        current[finalKey] = {
          "$type": "typography",
          "$value": textStyleValue
        };
        
        console.log(`Added text style ${style.name}:`, textStyleValue);
      });
      console.log('Final textStyles object:', exportData.textStyles);
    } else {
      console.log('No text styles found to process');
    }

    // Process effect styles
    if (effectStyles.length > 0) {
      console.log('Processing effect styles...');
      exportData.effectStyles = {};
      
      effectStyles.forEach((style, index) => {
        console.log(`Processing effect style ${index + 1}:`, style.name);
        
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
            // Handle shadow color with variable binding
            let shadowColor;
            if (effect.boundVariables && effect.boundVariables.color) {
              const variableId = effect.boundVariables.color.id;
              const boundVariable = allVariables.find(v => v.id === variableId);
              if (boundVariable) {
                const variablePath = boundVariable.name.replace(/\//g, '.');
                shadowColor = `{${variablePath}}`;
              } else {
                shadowColor = `{variable:${variableId}}`;
              }
            } else {
              // Regular color value
              const r = Math.round(effect.color.r * 255);
              const g = Math.round(effect.color.g * 255);
              const b = Math.round(effect.color.b * 255);
              const a = effect.color.a !== undefined ? effect.color.a : 1;
              shadowColor = a === 1 ? 
                `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}` :
                `rgba(${r}, ${g}, ${b}, ${Math.round(a * 100) / 100})`;
            }
            
            // Handle other shadow properties with potential variable bindings
            let offsetX = `${effect.offset.x}px`;
            if (effect.boundVariables && effect.boundVariables.offsetX) {
              const variableId = effect.boundVariables.offsetX.id;
              const boundVariable = allVariables.find(v => v.id === variableId);
              if (boundVariable) {
                const variablePath = boundVariable.name.replace(/\//g, '.');
                offsetX = `{${variablePath}}`;
              }
            }
            
            let offsetY = `${effect.offset.y}px`;
            if (effect.boundVariables && effect.boundVariables.offsetY) {
              const variableId = effect.boundVariables.offsetY.id;
              const boundVariable = allVariables.find(v => v.id === variableId);
              if (boundVariable) {
                const variablePath = boundVariable.name.replace(/\//g, '.');
                offsetY = `{${variablePath}}`;
              }
            }
            
            let blur = `${effect.radius}px`;
            if (effect.boundVariables && effect.boundVariables.radius) {
              const variableId = effect.boundVariables.radius.id;
              const boundVariable = allVariables.find(v => v.id === variableId);
              if (boundVariable) {
                const variablePath = boundVariable.name.replace(/\//g, '.');
                blur = `{${variablePath}}`;
              }
            }
            
            let spread = `${effect.spread || 0}px`;
            if (effect.boundVariables && effect.boundVariables.spread) {
              const variableId = effect.boundVariables.spread.id;
              const boundVariable = allVariables.find(v => v.id === variableId);
              if (boundVariable) {
                const variablePath = boundVariable.name.replace(/\//g, '.');
                spread = `{${variablePath}}`;
              }
            }
            
            current[finalKey] = {
              "$type": "shadow",
              "$value": {
                "type": effect.type.toLowerCase().replace('_', '-'),
                "color": shadowColor,
                "offsetX": offsetX,
                "offsetY": offsetY,
                "blur": blur,
                "spread": spread
              }
            };
            
            console.log(`Added shadow effect ${style.name}`);
            
          } else if (effect.type === 'LAYER_BLUR' || effect.type === 'BACKGROUND_BLUR') {
            // Handle blur effects
            let blurRadius = `${effect.radius}px`;
            if (effect.boundVariables && effect.boundVariables.radius) {
              const variableId = effect.boundVariables.radius.id;
              const boundVariable = allVariables.find(v => v.id === variableId);
              if (boundVariable) {
                const variablePath = boundVariable.name.replace(/\//g, '.');
                blurRadius = `{${variablePath}}`;
              }
            }
            
            current[finalKey] = {
              "$type": "blur",
              "$value": {
                "type": effect.type.toLowerCase().replace('_', '-'),
                "radius": blurRadius
              }
            };
            
            console.log(`Added blur effect ${style.name}`);
            
          } else {
            // Handle other effect types
            current[finalKey] = {
              "$type": "effect",
              "$value": {
                "type": effect.type.toLowerCase(),
                "description": `Effect type: ${effect.type}`
              }
            };
            
            console.log(`Added generic effect ${style.name}: ${effect.type}`);
          }
        } else {
          // Fallback for effects without proper data
          current[finalKey] = {
            "$type": "effect",
            "$value": "effect-placeholder"
          };
          
          console.log(`Added placeholder effect ${style.name}`);
        }
      });
      console.log('Final effectStyles object:', exportData.effectStyles);
    } else {
      console.log('No effect styles found to process');
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
    
    // Clean and restructure the data before sending to UI
    const cleanedData = cleanExportData(exportData);
    
    figma.ui.postMessage({
      type: 'export-ready',
      data: cleanedData,
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

// Helper function to clean and restructure exported data
function cleanExportData(data) {
  const cleaned = {};
  
  // Keys to remove at root level
  const keysToRemove = ['IRANYekan', 'Digikala', 'IRANYekanX', 'Kahroba', 'Theme 2', 'Theme 3', 'Theme 4', 'effects', 'content'];
  
  // Keys to group into new objects
  const modeKeys = ['Light', 'Dark'];
  const themeKeys = ['Shop', 'Commercial', 'Plus', 'AI', 'Gold', 'Fresh', 'Pharmacy', 'Jet', 'Fidibo', 'Digipay', 'Mehr', 'Magnet', 'Shop New'];
  const deviceKeys = ['Mobile', 'Desktop'];
  const styleKeys = ['Product', 'Marketing'];
  
  // Function to clean keys in nested objects (remove leading dots)
  function cleanKeys(obj) {
    if (!obj || typeof obj !== 'object') return obj;
    
    const cleanedObj = {};
    for (const [key, value] of Object.entries(obj)) {
      // Remove leading dot from key name
      let cleanKey = key.startsWith('.') ? key.substring(1) : key;
      
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        // If it's a design token (has $type and $value), keep as is
        if (value.$type && value.$value !== undefined) {
          // Special handling for typography tokens - clean the key name
          if (value.$type === 'typography') {
            cleanKey = cleanTypographyKeyName(cleanKey);
          }
          cleanedObj[cleanKey] = value;
        } else {
          // Recursively clean nested objects
          cleanedObj[cleanKey] = cleanKeys(value);
        }
      } else {
        cleanedObj[cleanKey] = value;
      }
    }
    return cleanedObj;
  }
  
  // Function to clean typography key names - remove content in parentheses after space
  function cleanTypographyKeyName(keyName) {
    // Remove anything after space that's in parentheses like "display-3 (32,48)" -> "display-3"
    const cleaned = keyName.replace(/\s+\([^)]*\)/g, '');
    if (cleaned !== keyName) {
      console.log(`Cleaned typography key: "${keyName}" -> "${cleaned}"`);
    }
    return cleaned;
  }
  
  // Function to shift left specific third-level objects
  function shiftLeftSpecificObjects(obj, objectsToShift) {
    const result = {};
    
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        const processedValue = {};
        
        // Check each property in this object
        for (const [childKey, childValue] of Object.entries(value)) {
          if (objectsToShift.includes(childKey) && typeof childValue === 'object' && childValue !== null) {
            // If this is an object we want to shift left, merge its contents directly
            console.log(`Shifting left: ${key}.${childKey} content directly to ${key} level`);
            Object.assign(processedValue, childValue);
          } else {
            // Keep other properties as they are
            processedValue[childKey] = childValue;
          }
        }
        
        result[key] = processedValue;
      } else {
        result[key] = value;
      }
    }
    
    return result;
  }
  
  // Initialize grouped objects
  const mode = {};
  const theme = {};
  const device = {};
  const style = {};
  const core = {};
  
  // Process each root key
  for (const [rootKey, value] of Object.entries(data)) {
    // Skip keys that should be removed
    if (keysToRemove.includes(rootKey)) {
      console.log(`Removing root key: ${rootKey}`);
      continue;
    }
    
    // Group mode keys (Light, Dark)
    if (modeKeys.includes(rootKey)) {
      console.log(`Grouping ${rootKey} into mode.${rootKey.toLowerCase()}`);
      mode[rootKey.toLowerCase()] = cleanKeys(value);
      continue;
    }
    
    // Group theme keys
    if (themeKeys.includes(rootKey)) {
      console.log(`Grouping ${rootKey} into theme.${rootKey.toLowerCase().replace(' ', '-')}`);
      const themeKey = rootKey.toLowerCase().replace(' ', '-').replace(' ', '');
      theme[themeKey] = cleanKeys(value);
      continue;
    }
    
    // Group device keys
    if (deviceKeys.includes(rootKey)) {
      console.log(`Grouping ${rootKey} into device.${rootKey.toLowerCase()}`);
      device[rootKey.toLowerCase()] = cleanKeys(value);
      continue;
    }
    
    // Group style keys
    if (styleKeys.includes(rootKey)) {
      console.log(`Grouping ${rootKey} into style.${rootKey.toLowerCase()}`);
      style[rootKey.toLowerCase()] = cleanKeys(value);
      continue;
    }
    
    // Handle colorStyles - move to root as gradients
    if (rootKey === 'colorStyles') {
      console.log('Moving colorStyles to root as gradients');
      cleaned.gradients = cleanKeys(value);
      continue;
    }
    
    // Handle existing core key - preserve it
    if (rootKey === 'core') {
      console.log('Preserving existing core object');
      Object.assign(core, cleanKeys(value));
      continue;
    }
    
    // Rename effectStyles to effects
    if (rootKey === 'effectStyles') {
      console.log('Renaming effectStyles to effects');
      cleaned.effects = cleanKeys(value);
      continue;
    }
    
    // Handle textStyles - shift left (flatten one level)
    if (rootKey === 'textStyles') {
      console.log('Shifting textStyles left');
      const cleanedTextStyles = cleanKeys(value);
      // Add all textStyles properties directly to root
      Object.assign(cleaned, cleanedTextStyles);
      continue;
    }
    
    // Handle other keys normally
    if (typeof value === 'object' && value !== null) {
      cleaned[rootKey] = cleanKeys(value);
    } else {
      cleaned[rootKey] = value;
    }
  }
  
  // Add grouped objects to cleaned data (only if they have content)
  if (Object.keys(mode).length > 0) {
    // Shift left third-level "mode" objects under mode.dark and mode.light
    const processedMode = shiftLeftSpecificObjects(mode, ['mode']);
    cleaned.mode = processedMode;
  }

  if (Object.keys(theme).length > 0) {
    cleaned.theme = theme;
  }

  if (Object.keys(device).length > 0) {
    cleaned.device = device;
  }

  if (Object.keys(style).length > 0) {
    // Shift left third-level "style" objects under style.product and style.marketing
    const processedStyle = shiftLeftSpecificObjects(style, ['style']);
    cleaned.style = processedStyle;
  }

  if (Object.keys(core).length > 0) {
    cleaned.core = core;
  }

  // Reorder root keys as specified
  const orderedCleaned = {};
  const order = ['core', 'typography', 'theme', 'device', 'mode', 'style', 'gradients'];
  for (const key of order) {
    if (cleaned[key]) {
      orderedCleaned[key] = cleaned[key];
      delete cleaned[key];
    }
  }
  Object.assign(orderedCleaned, cleaned);
  console.log('Data cleaning completed');
  return orderedCleaned;
}
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
function resolveVariableValue(value, currentVariableName, allVariables = []) {
  if (typeof value === 'object' && value !== null) {
    if (value.type === 'VARIABLE_ALIAS') {
      // Find the actual variable being referenced
      const referencedVariable = allVariables.find(v => v.id === value.id);
      if (referencedVariable) {
        return `{${referencedVariable.name.replace(/\//g, '.')}}`;
      } else {
        // Fallback to the alias ID if variable not found
        return `{variable:${value.id}}`;
      }
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