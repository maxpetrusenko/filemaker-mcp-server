# FileMaker MCP Server - Quick Start Guide

Get up and running with the FileMaker MCP server in minutes!

## 🚀 Quick Installation

```bash
# Install globally
npm install -g filemaker-mcp-server

# Or run directly with npx
npx filemaker-mcp-server
```

## ⚙️ Configuration

### Option 1: Environment Variables (Recommended)
```bash
export FILEMAKER_HOST="https://your-filemaker-server.com"
export FILEMAKER_DATABASE="YourDatabase"
export FILEMAKER_USERNAME="your-username"
export FILEMAKER_PASSWORD="your-password"
export FILEMAKER_GIT_REPO_PATH="/path/to/your/git/repo"  # Optional
```

### Option 2: Command Line Arguments
```bash
filemaker-mcp-server \
  --host "https://your-filemaker-server.com" \
  --database "YourDatabase" \
  --username "your-username" \
  --password "your-password" \
  --git-repo-path "/path/to/your/git/repo"
```

## 🔧 Claude Integration

Add this to your Claude configuration:

```json
{
  "mcpServers": {
    "filemaker": {
      "command": "npx",
      "args": ["filemaker-mcp-server"],
      "env": {
        "FILEMAKER_HOST": "https://your-filemaker-server.com",
        "FILEMAKER_DATABASE": "YourDatabase",
        "FILEMAKER_USERNAME": "your-username",
        "FILEMAKER_PASSWORD": "your-password",
        "FILEMAKER_GIT_REPO_PATH": "/path/to/your/git/repo"
      }
    }
  }
}
```

## 🎯 Quick Examples

### Basic Operations
```
"Find all contacts named John"
"Create a new contact with name Jane Smith and email jane@example.com"
"Update contact ID 123 with new phone number 555-9876"
"Delete contact ID 456"
```

### Git Integration
```
"Export the Contacts layout to Git"
"Commit all changes with message 'Update contact management'"
"Push changes to the main branch"
"Show me the Git status"
```

### Debugging
```
"Analyze this script for debugging issues: [paste script content]"
"Suggest fixes for error 'Field not found: Email'"
"Optimize this script for performance: [paste script content]"
"Validate the Contacts layout structure"
```

### Advanced Operations
```
"Import 1000 contacts from this CSV file"
"Export all contacts to JSON format"
"Sync data between Contacts and ContactsBackup layouts"
"Monitor API performance for the last 5 minutes"
```

## 🧪 Testing

Run the demo to see all features in action:

```bash
# Set up environment variables first
export FILEMAKER_HOST="https://your-filemaker-server.com"
export FILEMAKER_DATABASE="YourDatabase"
export FILEMAKER_USERNAME="your-username"
export FILEMAKER_PASSWORD="your-password"

# Run the demo
node examples/demo.js
```

## 📋 Prerequisites

1. **FileMaker Server** with Data API enabled
2. **Node.js** 18+ installed
3. **Git** (optional, for version control features)
4. **Valid FileMaker credentials** with appropriate permissions

## 🔍 Troubleshooting

### Common Issues

1. **Authentication Failed**
   - Verify FileMaker Server credentials
   - Check network connectivity
   - Ensure Data API is enabled on FileMaker Server

2. **Connection Timeout**
   - Verify FileMaker Server URL is correct
   - Check firewall settings
   - Ensure FileMaker Server is running

3. **Permission Denied**
   - Verify user has appropriate FileMaker permissions
   - Check layout access rights
   - Ensure script execution permissions

### Getting Help

- Check the full [README.md](README.md) for detailed documentation
- Review the [examples](examples/) directory for usage patterns
- Run `npm test` to verify your installation

## 🎉 What's Next?

Once you're up and running:

1. **Explore the features**: Try different operations and see what's possible
2. **Set up Git integration**: Enable version control for your FileMaker components
3. **Use debugging tools**: Analyze and optimize your FileMaker scripts
4. **Scale up**: Use batch operations and performance monitoring for large datasets

Happy FileMaking! 🚀 