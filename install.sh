#!/bin/bash

# Install the Raycast extension for development
echo "Installing Clipaste Raycast extension for development..."

# Install dependencies
echo "Installing dependencies..."
npm install

# Run in development mode (this will register the extension with Raycast)
echo "Starting development mode..."
echo "This will register the extension with Raycast and watch for changes."
npm run dev
echo ""
echo "If you encounter the 'read-only file system' error again, make sure to:"
echo "1. Set a 'Default Output Directory' in the extension preferences"
echo "2. Or use the 'Output Directory' field in the form when using paste mode"
echo ""
echo "The extension now defaults to ~/Desktop when no output directory is specified."