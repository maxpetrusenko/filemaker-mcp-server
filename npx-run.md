# Running FileMaker MCP Server with npx

## From Local Directory

You can run the server directly from your local development directory using npx:

```bash
# Set environment variables
export FILEMAKER_HOST="https://your-filemaker-server.com"
export FILEMAKER_DATABASE="YourDatabase"
export FILEMAKER_USERNAME="your-username"
export FILEMAKER_PASSWORD="your-password"

# Run with npx from local directory
npx . --help
```

## From Git Repository

You can also run it directly from a Git repository:

```bash
# Run from GitHub (if you push to a public repo)
npx github:your-username/filemaker-mcp-server --help

# Or from any Git URL
npx git+https://github.com/your-username/filemaker-mcp-server.git --help
```

## Example Usage

```bash
# Set up environment
export FILEMAKER_HOST="https://your-server.com"
export FILEMAKER_DATABASE="Contacts"
export FILEMAKER_USERNAME="admin"
export FILEMAKER_PASSWORD="password123"

# Run the server
npx . --host "$FILEMAKER_HOST" --database "$FILEMAKER_DATABASE" --username "$FILEMAKER_USERNAME" --password "$FILEMAKER_PASSWORD"
```

## Integration with Claude Desktop

Add to your `mcp_servers.json`:

```json
{
  "mcpServers": {
    "filemaker": {
      "command": "npx",
      "args": ["/path/to/your/filemaker-mcp-server", "--host", "https://your-server.com", "--database", "YourDatabase", "--username", "your-username", "--password", "your-password"],
      "env": {}
    }
  }
}
``` 