#!/bin/bash

# Simple one-time move script for Figma exports
# Reads configuration from config.json dynamically

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONFIG_FILE="$SCRIPT_DIR/config.json"

echo "🔍 Reading configuration from: $CONFIG_FILE"

# Check if config.json exists
if [ ! -f "$CONFIG_FILE" ]; then
    echo "❌ Error: config.json not found in script directory"
    echo "   Expected location: $CONFIG_FILE"
    exit 1
fi

# Parse config.json using Python
if command -v python3 &> /dev/null; then
    PYTHON_CMD="python3"
elif command -v python &> /dev/null; then
    PYTHON_CMD="python"
else
    echo "❌ Error: Python not found. Please install Python to parse config.json"
    exit 1
fi

# Extract values from config.json
TARGET_DIR=$($PYTHON_CMD -c "
import json
import sys
try:
    with open('$CONFIG_FILE', 'r') as f:
        config = json.load(f)
    print(config.get('outputPath', ''))
except Exception as e:
    print('', file=sys.stderr)
    sys.exit(1)
")

FILENAME=$($PYTHON_CMD -c "
import json
import sys
try:
    with open('$CONFIG_FILE', 'r') as f:
        config = json.load(f)
    print(config.get('filename', 'figma-export.json'))
except Exception as e:
    print('figma-export.json', file=sys.stderr)
")

# Validate configuration
if [ -z "$TARGET_DIR" ]; then
    echo "❌ Error: outputPath not found or empty in config.json"
    exit 1
fi

# Configuration
DOWNLOADS_DIR="$HOME/Downloads"
SOURCE="$DOWNLOADS_DIR/$FILENAME"
TARGET="$TARGET_DIR/$FILENAME"

echo "📁 Target directory: $TARGET_DIR"
echo "📄 Looking for: $FILENAME"
echo ""

if [ -f "$SOURCE" ]; then
    echo "📥 Found $FILENAME in Downloads"
    
    # Create target directory if it doesn't exist
    mkdir -p "$TARGET_DIR"
    
    echo "📤 Moving to: $TARGET"
    
    # Move the file (replaces existing)
    mv "$SOURCE" "$TARGET"
    
    if [ $? -eq 0 ]; then
        echo "✅ Successfully moved!"
        echo "⏰ $(date '+%Y-%m-%d %H:%M:%S')"
        
        # Optional: Show notification on macOS
        if command -v osascript &> /dev/null; then
            osascript -e "display notification \"Figma export moved to $TARGET_DIR\" with title \"File Moved\""
        fi
    else
        echo "❌ Failed to move file"
        exit 1
    fi
else
    echo "❌ $FILENAME not found in Downloads folder"
    echo "   Make sure you've downloaded the file from the plugin first"
    exit 1
fi