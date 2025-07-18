# FileMaker MCP Server

Easily connect FileMaker databases to Claude, Cursor, and other AI tools via the Model Context Protocol (MCP).

## Installation

```bash
npm install -g filemaker-mcp-server
# or use npx (no install needed)
npx filemaker-mcp-server --host https://your-server --database MyDB --username user --password pass
```

## Usage

You can configure via environment variables or CLI args:

```bash
FILEMAKER_HOST=https://your-server FILEMAKER_DATABASE=MyDB FILEMAKER_USERNAME=user FILEMAKER_PASSWORD=pass npx filemaker-mcp-server
# or
npx filemaker-mcp-server --host https://your-server --database MyDB --username user --password pass
```

## Claude Code Example

Add to `.claude/mcp_servers.json`:

```json
{
  "filemaker": {
    "command": "npx",
    "args": [
      "filemaker-mcp-server",
      "--host", "https://your-server",
      "--database", "MyDB",
      "--username", "user",
      "--password", "pass"
    ]
  }
}
```

## Features
- Find, create, update, delete records
- Run FileMaker scripts
- Get layout metadata
- Secure authentication
- Easy CLI and MCP integration 