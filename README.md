# FileMaker MCP Server v2.5.10

A comprehensive Model Context Protocol (MCP) server for FileMaker Data API integration, providing intelligent tools for database discovery, analysis, and management.

## 🚀 Features

### **Phase 1: Core Discovery Tools**
- **`fm_list_layouts`** - List all layouts in the database
- **`fm_list_scripts`** - List all scripts in the database  
- **`fm_discover_hidden_scripts`** - Discover hidden scripts not visible in standard list
- **`fm_get_record_count`** - Get total record count for any layout
- **`fm_list_value_lists`** - List value lists (requires script approach)

### **Phase 2: Advanced Analysis Tools**
- **`fm_analyze_portal_data`** - Analyze portal fields and relationships for performance insights
- **`fm_get_field_metadata`** - Get detailed metadata for all fields in a layout
- **`fm_search_across_fields`** - Search for specific text across multiple fields
- **`fm_analyze_performance`** - Analyze database performance and identify bottlenecks

### **Phase 3: Global Search & Advanced Discovery**
- **`fm_global_search_fields`** - Search for fields across all layouts in the database
- **`fm_global_search_data`** - Search for data across multiple layouts simultaneously
- **`fm_export_ddr`** - Export Database Design Report for comprehensive analysis
- **`fm_analyze_relationships`** - Analyze relationships between tables and identify foreign keys

### **Core Data Operations**
- **`fm_find_records`** - Find records using FileMaker Data API find syntax
- **`fm_create_record`** - Create new records
- **`fm_update_record`** - Update existing records
- **`fm_delete_record`** - Delete records
- **`fm_execute_script`** - Execute FileMaker scripts
- **`fm_get_layout_metadata`** - Get layout structure and field information

## 📦 Installation

### **Option 1: Direct Installation (Recommended)**

#### For Claude Desktop
1. Add to your MCP configuration:
```json
{
  "mcpServers": {
    "filemaker": {
      "command": "npx",
      "args": [
        "-y",
        "@maxpetrusenko/filemaker-mcp-server@latest"
      ],
      "env": {
        "FILEMAKER_HOST": "https://your-filemaker-server.com",
        "FILEMAKER_DATABASE": "your-database-name",
        "FILEMAKER_USERNAME": "your-username",
        "FILEMAKER_PASSWORD": "your-password"
      }
    }
  }
}
```

#### For Development
```bash
# Clone the repository
git clone https://github.com/maxpetrusenko/filemaker-mcp-server.git
cd filemaker-mcp-server

# Install dependencies
npm install

# Build the project
npm run build

# Run locally with environment variables
FILEMAKER_HOST="https://your-filemaker-server.com" \
FILEMAKER_DATABASE="your-database-name" \
FILEMAKER_USERNAME="your-username" \
FILEMAKER_PASSWORD="your-password" \
npm start
```

### **Option 2: Docker Installation**

#### Build and Run with Docker
```bash
# Build the Docker image
docker build -t filemaker-mcp-server .

# Run with environment variables
docker run -it --rm \
  -e FILEMAKER_HOST="https://your-filemaker-server.com" \
  -e FILEMAKER_DATABASE="your-database-name" \
  -e FILEMAKER_USERNAME="your-username" \
  -e FILEMAKER_PASSWORD="your-password" \
  filemaker-mcp-server
```

#### Docker Compose (Recommended for Production)
Create a `docker-compose.yml` file:
```yaml
version: '3.8'
services:
  filemaker-mcp:
    build: .
    environment:
      - FILEMAKER_HOST=https://your-filemaker-server.com
      - FILEMAKER_DATABASE=your-database-name
      - FILEMAKER_USERNAME=your-username
      - FILEMAKER_PASSWORD=your-password
    ports:
      - "3000:3000"
    restart: unless-stopped
    volumes:
      - ./logs:/app/logs
```

Run with:
```bash
docker-compose up -d
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `FILEMAKER_HOST` | FileMaker server URL | Yes | `https://your-server.com` |
| `FILEMAKER_DATABASE` | Database name | Yes | `my-database` |
| `FILEMAKER_USERNAME` | Username for authentication | Yes | `API` |
| `FILEMAKER_PASSWORD` | Password for authentication | Yes | `your-password` |

### Claude Desktop Configuration

Add this to your Claude Desktop MCP configuration file:

**macOS/Linux**: `~/.config/claude-desktop/mcp-servers.json`
**Windows**: `%APPDATA%\claude-desktop\mcp-servers.json`

```json
{
  "mcpServers": {
    "filemaker": {
      "command": "npx",
      "args": [
        "-y",
        "@maxpetrusenko/filemaker-mcp-server@latest"
      ],
      "env": {
        "FILEMAKER_HOST": "https://your-filemaker-server.com",
        "FILEMAKER_DATABASE": "your-database-name",
        "FILEMAKER_USERNAME": "your-username",
        "FILEMAKER_PASSWORD": "your-password"
      }
    }
  }
}
```

## 🛠️ Tool Reference

### Discovery Tools

#### `fm_list_layouts`
Lists all layouts in the FileMaker database.
```json
{
  "name": "fm_list_layouts",
  "description": "List all layouts in the FileMaker database",
  "inputSchema": {
    "type": "object",
    "properties": {},
    "required": []
  }
}
```

#### `fm_list_scripts`
Lists all scripts in the FileMaker database.
```json
{
  "name": "fm_list_scripts", 
  "description": "List all scripts in the FileMaker database",
  "inputSchema": {
    "type": "object",
    "properties": {},
    "required": []
  }
}
```

#### `fm_discover_hidden_scripts`
Discovers hidden scripts that exist but are not visible in the standard script list.
```json
{
  "name": "fm_discover_hidden_scripts",
  "description": "Discover hidden scripts that exist but are not visible in the standard script list",
  "inputSchema": {
    "type": "object",
    "properties": {},
    "required": []
  }
}
```

#### `fm_get_record_count`
Gets the total number of records in a specified layout.
```json
{
  "name": "fm_get_record_count",
  "description": "Get the total number of records in a specified layout",
  "inputSchema": {
    "type": "object",
    "properties": {
      "layout": { "type": "string", "description": "Layout name" }
    },
    "required": ["layout"]
  }
}
```

### Analysis Tools

#### `fm_analyze_portal_data`
Analyzes portal fields and their relationships for performance insights.
```json
{
  "name": "fm_analyze_portal_data",
  "description": "Analyze portal fields and their relationships for performance insights",
  "inputSchema": {
    "type": "object",
    "properties": {
      "layout": { "type": "string", "description": "Layout name to analyze" }
    },
    "required": ["layout"]
  }
}
```

#### `fm_get_field_metadata`
Gets detailed metadata for all fields in a layout.
```json
{
  "name": "fm_get_field_metadata",
  "description": "Get detailed metadata for all fields in a layout",
  "inputSchema": {
    "type": "object",
    "properties": {
      "layout": { "type": "string", "description": "Layout name" }
    },
    "required": ["layout"]
  }
}
```

#### `fm_search_across_fields`
Searches for specific text across multiple fields in a layout.
```json
{
  "name": "fm_search_across_fields",
  "description": "Search for specific text across multiple fields in a layout",
  "inputSchema": {
    "type": "object",
    "properties": {
      "layout": { "type": "string", "description": "Layout name" },
      "searchText": { "type": "string", "description": "Text to search for" },
      "fields": { "type": "array", "items": { "type": "string" }, "description": "Fields to search in" }
    },
    "required": ["layout", "searchText"]
  }
}
```

#### `fm_analyze_performance`
Analyzes database performance and identifies potential bottlenecks.
```json
{
  "name": "fm_analyze_performance",
  "description": "Analyze database performance and identify potential bottlenecks",
  "inputSchema": {
    "type": "object",
    "properties": {
      "layout": { "type": "string", "description": "Layout to analyze" },
      "operation": { "type": "string", "enum": ["find", "sort", "portal"], "description": "Operation type to analyze" }
    },
    "required": ["layout"]
  }
}
```

### Global Search & Discovery Tools

#### `fm_global_search_fields`
Search for fields across all layouts in the database.
```json
{
  "name": "fm_global_search_fields",
  "description": "Search for fields across all layouts in the database",
  "inputSchema": {
    "type": "object",
    "properties": {
      "searchText": { "type": "string", "description": "Text to search for in field names" },
      "fieldType": { "type": "string", "enum": ["text", "number", "date", "calculation", "summary", "portal", "all"], "description": "Filter by field type" }
    },
    "required": ["searchText"]
  }
}
```

#### `fm_global_search_data`
Search for data across multiple layouts simultaneously.
```json
{
  "name": "fm_global_search_data",
  "description": "Search for data across multiple layouts simultaneously",
  "inputSchema": {
    "type": "object",
    "properties": {
      "searchText": { "type": "string", "description": "Text to search for in data" },
      "layouts": { "type": "array", "items": { "type": "string" }, "description": "Specific layouts to search (empty for all)" },
      "limit": { "type": "number", "description": "Maximum results per layout" }
    },
    "required": ["searchText"]
  }
}
```

#### `fm_export_ddr`
Export Database Design Report for comprehensive analysis.
```json
{
  "name": "fm_export_ddr",
  "description": "Export Database Design Report for comprehensive analysis",
  "inputSchema": {
    "type": "object",
    "properties": {
      "format": { "type": "string", "enum": ["json", "xml", "html"], "description": "Export format" },
      "includeScripts": { "type": "boolean", "description": "Include script information" },
      "includeLayouts": { "type": "boolean", "description": "Include layout information" }
    },
    "required": []
  }
}
```

#### `fm_analyze_relationships`
Analyze relationships between tables and identify foreign keys.
```json
{
  "name": "fm_analyze_relationships",
  "description": "Analyze relationships between tables and identify foreign keys",
  "inputSchema": {
    "type": "object",
    "properties": {
      "layout": { "type": "string", "description": "Layout to analyze" },
      "includeDetails": { "type": "boolean", "description": "Include detailed relationship information" }
    },
    "required": ["layout"]
  }
}
```

### Data Operations

#### `fm_find_records`
Find records using FileMaker Data API find syntax.
```json
{
  "name": "fm_find_records",
  "description": "Find records using FileMaker Data API find syntax",
  "inputSchema": {
    "type": "object",
    "properties": {
      "layout": { "type": "string", "description": "Layout name" },
      "query": { "type": "array", "items": { "type": "object" }, "description": "Find query array" },
      "limit": { "type": "number", "description": "Maximum number of records to return" },
      "offset": { "type": "number", "description": "Number of records to skip" }
    },
    "required": ["layout", "query"]
  }
}
```

#### `fm_create_record`
Create a new record in the specified layout.
```json
{
  "name": "fm_create_record",
  "description": "Create a new record in the specified layout",
  "inputSchema": {
    "type": "object",
    "properties": {
      "layout": { "type": "string", "description": "Layout name" },
      "fieldData": { "type": "object", "description": "Field data to insert" }
    },
    "required": ["layout", "fieldData"]
  }
}
```

#### `fm_update_record`
Update an existing record.
```json
{
  "name": "fm_update_record",
  "description": "Update an existing record",
  "inputSchema": {
    "type": "object",
    "properties": {
      "layout": { "type": "string", "description": "Layout name" },
      "recordId": { "type": "number", "description": "Record ID to update" },
      "fieldData": { "type": "object", "description": "Field data to update" }
    },
    "required": ["layout", "recordId", "fieldData"]
  }
}
```

#### `fm_delete_record`
Delete a record from the database.
```json
{
  "name": "fm_delete_record",
  "description": "Delete a record from the database",
  "inputSchema": {
    "type": "object",
    "properties": {
      "layout": { "type": "string", "description": "Layout name" },
      "recordId": { "type": "number", "description": "Record ID to delete" }
    },
    "required": ["layout", "recordId"]
  }
}
```

#### `fm_execute_script`
Execute a FileMaker script.
```json
{
  "name": "fm_execute_script",
  "description": "Execute a FileMaker script",
  "inputSchema": {
    "type": "object",
    "properties": {
      "script": { "type": "string", "description": "Script name to execute" },
      "parameters": { "type": "string", "description": "Script parameters" }
    },
    "required": ["script"]
  }
}
```

#### `fm_get_layout_metadata`
Get layout structure and field information.
```json
{
  "name": "fm_get_layout_metadata",
  "description": "Get layout structure and field information",
  "inputSchema": {
    "type": "object",
    "properties": {
      "layout": { "type": "string", "description": "Layout name" }
    },
    "required": ["layout"]
  }
}
```

## 🧪 Testing

### Local Testing
```bash
# Test with environment variables
FILEMAKER_HOST="https://your-filemaker-server.com" \
FILEMAKER_DATABASE="your-database-name" \
FILEMAKER_USERNAME="your-username" \
FILEMAKER_PASSWORD="your-password" \
npm test
```

### Docker Testing
```bash
# Test Docker build
docker build -t filemaker-mcp-test .

# Test Docker run
docker run -it --rm \
  -e FILEMAKER_HOST="https://your-filemaker-server.com" \
  -e FILEMAKER_DATABASE="your-database-name" \
  -e FILEMAKER_USERNAME="your-username" \
  -e FILEMAKER_PASSWORD="your-password" \
  filemaker-mcp-test
```

## 🔍 Troubleshooting

### Common Issues

1. **"Server disconnected" error in Claude Desktop**
   - Ensure environment variables are correctly set
   - Check FileMaker server connectivity
   - Verify database name and credentials

2. **"Layout is missing" error**
   - Verify layout name exists in the database
   - Check case sensitivity of layout names

3. **"Circular JSON structure" error**
   - This has been fixed in v2.5.10
   - Update to the latest version

4. **Global search returns 0 matches**
   - Check field names for exact matches
   - Verify search text case sensitivity
   - Check debug logs in `/tmp/filemaker-global-search-debug.log`

### Log Files
The server creates log files in `/tmp/` directory:
- `/tmp/filemaker-mcp.log` - General server logs
- `/tmp/filemaker-global-search-debug.log` - Global search debugging
- `/tmp/filemaker-method-called.log` - Method call tracking

## 📝 Development

### Project Structure
```
filemaker-mcp-server/
├── src/
│   ├── filemaker-mcp.ts    # Main MCP server implementation
│   └── index.ts           # Entry point
├── dist/                  # Compiled JavaScript
├── Dockerfile            # Docker configuration
├── docker-compose.yml    # Docker Compose configuration
├── package.json          # Node.js dependencies
└── README.md            # This file
```

### Building
```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Run tests
npm test

# Start development server
npm start
```

### Contributing
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Support

For support and questions:
- Create an issue on GitHub
- Check the troubleshooting section above
- Review the log files for detailed error information

## 🔄 Version History

- **v2.5.10** - Fixed circular JSON structure, added hidden script discovery, improved error handling
- **v2.5.9** - Fixed read-only file system issues, improved logging
- **v2.5.8** - Fixed MCP SDK compatibility and package structure
- **v2.5.0** - Initial release with comprehensive FileMaker Data API integration
