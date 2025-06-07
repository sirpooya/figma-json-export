# Figma JSON Export Plugin

A comprehensive Figma plugin that exports design tokens (variables, color styles, text styles, and effect styles) into a clean, structured JSON format compatible with design systems and development workflows.

## ✨ Features

- **🎨 Complete Export**: Variables, color styles, text styles, and effect styles
- **🌈 Gradient Support**: Full gradient export with color stops and angles
- **🔗 Variable References**: Automatic linking to JSON keys when styles reference variables
- **📱 Smart Organization**: Auto-groups tokens by mode, theme, device, and style
- **🧹 Clean Structure**: Removes unwanted keys and restructures data
- **⚡ Auto-Save**: Optional automatic file saving with shell script integration
- **📋 Copy to Clipboard**: Quick copying of exported JSON

## 🚀 Installation

1. **Download the plugin files**:
   - `code.js` - Main plugin logic
   - `ui.html` - User interface
   - `config.json` - Configuration file
   - `figma-auto-move.sh` - Shell script for auto file movement

2. **Setup in Figma**:
   - Open Figma Desktop
   - Go to Plugins → Development → Import plugin from manifest
   - Select the plugin folder

3. **Configure auto-save** (optional):
   ```bash
   chmod +x figma-auto-move.sh
   ```

## ⚙️ Configuration

Edit `config.json` to customize export behavior:

```json
{
  "outputPath": "/Users/username/Dropbox/Design/Tokens",
  "autoSave": true,
  "filename": "design-tokens.json"
}
```

### Configuration Options

| Option | Description | Example |
|--------|-------------|---------|
| `outputPath` | Directory for auto-save | `"/Users/username/Dropbox/Tokens"` |
| `autoSave` | Enable automatic file operations | `true` / `false` |
| `filename` | Export filename | `"design-tokens.json"` |

## 🎯 Usage

### Basic Export

1. **Run the plugin** in your Figma file
2. **View the export** in the plugin UI
3. **Copy to clipboard** or **download JSON file**

### Auto-Save Workflow

1. **Export from plugin** → Downloads to Downloads folder
2. **Run shell script**:
   ```bash
   ./figma-auto-move.sh --once
   ```
3. **File automatically moved** to configured directory

### Continuous Auto-Move (Optional)

```bash
# Run in background to auto-move files
./figma-auto-move.sh
```

## 📊 Exported Structure

The plugin exports a clean, organized JSON structure:

```json
{
  "core": {
    "gradients": {
      "primary": {
        "$type": "gradient",
        "$value": {
          "type": "linear",
          "angle": 90,
          "stops": [
            {
              "color": "{colors.blue.500}",
              "position": 0
            }
          ]
        }
      }
    }
  },
  "mode": {
    "light": {
      "ui": {
        "background": {
          "$type": "color",
          "$value": "#ffffff"
        }
      }
    },
    "dark": {
      "ui": {
        "background": {
          "$type": "color",
          "$value": "#000000"
        }
      }
    }
  },
  "theme": {
    "shop": { ... },
    "commercial": { ... }
  },
  "device": {
    "mobile": { ... },
    "desktop": { ... }
  },
  "style": {
    "product": { ... },
    "marketing": { ... }
  }
}
```

## 🎨 Supported Token Types

### Colors & Gradients
- **Solid colors**: `#ff0000`, `rgba(255, 0, 0, 0.5)`
- **Linear gradients**: With angle and color stops
- **Radial gradients**: With color stops
- **Variable references**: `{colors.primary.blue}`

### Typography
```json
{
  "$type": "typography",
  "$value": {
    "fontFamily": "Inter",
    "fontWeight": "600",
    "fontSize": "16px",
    "letterSpacing": "0",
    "lineHeight": "{core.font.lineheight.md}"
  }
}
```

#### Line Height Mapping
- `125%` → `{core.font.lineheight.sm}`
- `150%` → `{core.font.lineheight.md}`
- `180%` → `{core.font.lineheight.lg}`

### Effects
```json
{
  "$type": "shadow",
  "$value": {
    "type": "drop-shadow",
    "color": "{colors.shadow.primary}",
    "offsetX": "0px",
    "offsetY": "4px",
    "blur": "8px",
    "spread": "0px"
  }
}
```

## 🧹 Data Cleaning

The plugin automatically:

- **Removes unwanted keys**: `IRANYekan`, `Digikala`, `IRANYekanX`, `Kahroba`, `Theme 2-4`, `effects`, `content`
- **Groups by category**:
  - `Light`/`Dark` → `mode.light`/`mode.dark`
  - `Shop`/`Commercial`/etc. → `theme.*`
  - `Mobile`/`Desktop` → `device.*`
  - `Product`/`Marketing` → `style.*`
- **Flattens text styles**: Moves textStyles content to root level
- **Renames keys**: `effectStyles` → `effects`, `colorStyles` → `core.gradients`
- **Removes leading dots**: `.primary` → `primary`
- **Cleans typography names**: `"display-3 (32,48)"` → `"display-3"`

## 🔧 Shell Script Commands

```bash
# One-time file move
./figma-auto-move.sh --once

# Continuous watching
./figma-auto-move.sh

# Help
./figma-auto-move.sh --help
```

### Create Alias (Recommended)

Add to your `~/.zshrc` or `~/.bashrc`:

```bash
alias figma-move='cd /path/to/plugin && ./figma-auto-move.sh --once'
```

Then simply run:
```bash
figma-move
```

## 📁 File Structure

```
figma-plugin/
├── code.js              # Main plugin logic
├── ui.html              # User interface
├── config.json          # Configuration
├── figma-auto-move.sh   # Auto-move script
└── README.md            # This file
```

## 🛠️ Development

### Requirements
- Figma Desktop (for plugin development)
- macOS/Unix (for shell script)
- Python (for JSON parsing in shell script)

### Browser Security Note
Figma plugins run in a browser environment with security restrictions:
- Cannot execute shell commands directly
- Cannot write to arbitrary file paths
- Limited to downloads folder without user interaction

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test with various Figma files
5. Submit a pull request

## 📝 License

Licensed under GPLv3. See the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Pooya Kamel**
- GitHub: [@sirpooya](https://github.com/sirpooya)
- Repository: [figma-json-export](https://github.com/sirpooya/figma-json-export)

## 🆘 Support

If you encounter issues:

1. **Check the browser console** (F12) for error messages
2. **Verify your Figma file** has the expected variables/styles
3. **Ensure config.json** is properly formatted
4. **Make shell script executable**: `chmod +x figma-auto-move.sh`

For bugs and feature requests, please open an issue on GitHub.

---

*Made with ❤️ for design system workflows*