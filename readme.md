# Figma Export with Manual Shell Script

## 🎯 Simple Workflow

1. **Use Figma Plugin** → Click "Download JSON File" → Downloads to Downloads folder
2. **Run Shell Script** → `./figma-auto-move.sh --once` → Moves to your configured directory

That's it! Clean and simple.

## 📁 File Structure
```
your-plugin-folder/
├── config.json
├── code.js
├── ui.html
└── figma-auto-move.sh
```

## ⚙️ Configuration (config.json)
```json
{
  "outputPath": "/Users/pooya/Dropbox/WORK/Digikala/DK Assets",
  "autoSave": true,
  "filename": "figma-export.json"
}
```

## 🚀 One-Time Setup

### 1. Make script executable:
```bash
chmod +x figma-auto-move.sh
```

### 2. Create alias (recommended):
Add to `~/.zshrc` or `~/.bashrc`:
```bash
alias figma-move='cd /path/to/your/plugin && ./figma-auto-move.sh --once'
```

## 🔄 Daily Usage

1. **Figma Plugin**: Export data
2. **Terminal**: Run `figma-move` (or `./figma-auto-move.sh --once`)
3. **Done**: File automatically replaces existing file in your Dropbox folder

## 💡 Benefits

- **No background processes** - script runs only when needed
- **No notifications or prompts** - plugin stays clean and simple  
- **Automatic file replacement** - existing file gets overwritten
- **One command** - after initial setup, just one terminal command
- **Configurable** - change paths in config.json anytime