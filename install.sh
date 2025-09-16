#!/bin/bash

# Install the Raycast extension for development
echo "Installing Clipaste Raycast extension for development..."

# Build the extension
npm run build

# Open in Raycast for development
echo "Opening in Raycast for development..."
echo "The extension should appear in Raycast's extension list."
echo ""
echo "If you encounter the 'read-only file system' error again, make sure to:"
echo "1. Set a 'Default Output Directory' in the extension preferences"
echo "2. Or use the 'Output Directory' field in the form when using paste mode"
echo ""
echo "The extension now defaults to ~/Desktop when no output directory is specified."