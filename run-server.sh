#!/bin/bash

# FileMaker MCP Server Runner
# This script makes it easy to run the server locally

echo "🚀 Starting FileMaker MCP Server..."

# Check if environment variables are set
if [ -z "$FILEMAKER_HOST" ] || [ -z "$FILEMAKER_DATABASE" ] || [ -z "$FILEMAKER_USERNAME" ] || [ -z "$FILEMAKER_PASSWORD" ]; then
    echo "❌ Missing required environment variables!"
    echo ""
    echo "Please set the following environment variables:"
    echo "  export FILEMAKER_HOST=\"https://your-filemaker-server.com\""
    echo "  export FILEMAKER_DATABASE=\"YourDatabase\""
    echo "  export FILEMAKER_USERNAME=\"your-username\""
    echo "  export FILEMAKER_PASSWORD=\"your-password\""
    echo ""
    echo "Or run with command line arguments:"
    echo "  node dist/index.js --host \"https://your-server.com\" --database \"YourDB\" --username \"user\" --password \"pass\""
    exit 1
fi

# Build the project first
echo "📦 Building project..."
npm run build

# Run the server
echo "🎯 Starting server..."
node dist/index.js 