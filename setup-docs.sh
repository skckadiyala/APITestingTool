#!/bin/bash

# Simba Documentation Setup Script
# This script sets up the documentation environment

set -e  # Exit on error

echo "🚀 Setting up Simba Documentation..."
echo ""

# Check for Python
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.8 or later."
    echo "   Visit: https://www.python.org/downloads/"
    exit 1
fi

echo "✅ Python 3 found: $(python3 --version)"

# Check for pip
if ! command -v pip3 &> /dev/null; then
    echo "❌ pip3 is not installed. Installing pip..."
    python3 -m ensurepip --upgrade
fi

echo "✅ pip found: $(pip3 --version)"
echo ""

# Install MkDocs with pinned versions
echo "📦 Installing MkDocs Material (pinned to 1.x)..."
pip3 install -r docs-requirements.txt

echo ""
echo "✅ MkDocs Material installed successfully!"
echo "   (Using MkDocs 1.x to avoid 2.0 breaking changes)"
echo ""

# Create screenshots directory
mkdir -p docs/assets/screenshots
echo "✅ Created docs/assets/screenshots directory"
echo ""

# Verify installation
echo "🔍 Verifying installation..."
mkdocs --version
echo ""

# Ask user if they want to preview docs
read -p "🌐 Do you want to preview the documentation now? (y/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🌐 Starting MkDocs development server..."
    echo "📖 Documentation will be available at http://localhost:8000"
    echo "⏹️  Press Ctrl+C to stop the server"
    echo ""
    mkdocs serve
else
    echo ""
    echo "✅ Setup complete!"
    echo ""
    echo "📖 To preview documentation, run:"
    echo "   mkdocs serve"
    echo ""
    echo "🏗️  To build static site, run:"
    echo "   mkdocs build"
    echo ""
    echo "🚀 To deploy to GitHub Pages, run:"
    echo "   mkdocs gh-deploy"
    echo ""
fi
