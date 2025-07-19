# FileMaker MCP Server v2.5.0

A comprehensive Model Context Protocol (MCP) server for FileMaker Data API integration, providing intelligent tools for database discovery, analysis, and management.

## 🚀 Features

### **Phase 1: Core Discovery Tools**
- **`fm_list_layouts`** - List all layouts in the database
- **`fm_list_scripts`** - List all scripts in the database  
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

### **Advanced Features**
- **Git Integration** - Version control for FileMaker components
- **Intelligent Debugging** - Script analysis and optimization
- **API Enhancements** - Batch operations, caching, performance monitoring
- **Error Handling** - Comprehensive error resolution and prevention

## 📦 Installation

### For Claude Desktop
1. Install the package:
```bash
npm install -g filemaker-mcp-server-v2@2.5.0
```

2. Add to your MCP configuration:
```json
{
  "mcpServers": {
    "filemaker": {
      "command": "npx",
      "args": ["filemaker-mcp-server-v2@2.5.0"],
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

### For Development
```bash
git clone <repository>
cd filemaker-mcp-server
npm install
npm run build
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
      "layout": { "type": "string", "description": "Layout to analyze relationships for" },
      "depth": { "type": "number", "description": "Relationship depth to analyze (1-3)" }
    },
    "required": ["layout"]
  }
}
```

## 🔍 SQL vs FileMaker Data API

**FileMaker Data API does NOT support direct SQL execution**, but provides equivalent functionality:

### SQL to FileMaker Data API Mapping

| SQL | FileMaker Data API |
|-----|-------------------|
| `SELECT * FROM table` | `GET /layouts/{layout}/records` |
| `WHERE field = value` | `POST /layouts/{layout}/_find` with query |
| `ORDER BY field DESC` | `sort: [{fieldName: "field", sortOrder: "descend"}]` |
| `LIMIT 10 OFFSET 20` | `limit: 10, offset: 20` |
| `SELECT field1, field2` | `fields: ["field1", "field2"]` |

### Example Conversion
```sql
-- SQL Query
SELECT * FROM Price 
WHERE currentPrice > 1000000 
ORDER BY currentPrice DESC 
LIMIT 5;
```

```javascript
// FileMaker Data API equivalent
{
  query: [{ currentPrice: ">1000000" }],
  sort: [{ fieldName: "currentPrice", sortOrder: "descend" }],
  limit: 5
}
```

## 🐳 Docker Support

### Dockerfile
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

### Docker Compose
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
```

## 🔧 Development

### Prerequisites
- Node.js 18+
- TypeScript
- FileMaker Server with Data API enabled

### Setup
```bash
npm install
npm run build
npm test
```

### Testing
```bash
# Run all tests
npm test

# Run specific test
npm test -- test-files/test-phase1-tools.js

# Run E2E tests
npm run test:e2e
```

## 📊 Performance Optimization

### Best Practices
1. **Use Find Queries** instead of loading all records
2. **Implement Pagination** for large datasets
3. **Cache Frequently Used Data** using the built-in cache system
4. **Monitor Performance** using `fm_analyze_performance`
5. **Optimize Portal Loading** using `fm_analyze_portal_data`

### Performance Monitoring
```javascript
// Analyze find performance
await fm_analyze_performance({
  layout: "@Price",
  operation: "find"
});

// Analyze portal performance  
await fm_analyze_performance({
  layout: "@Unit",
  operation: "portal"
});
```

## 🔒 Security

### Authentication
- Uses FileMaker Data API token-based authentication
- Tokens are automatically refreshed
- Supports both username/password and OAuth

### Error Handling
- Comprehensive error messages
- Automatic retry mechanisms
- Rate limiting protection

## 📈 Roadmap

### Phase 3: Advanced Management (Planned)
- **`fm_export_ddr`** - Export Database Design Report
- **`fm_manage_users`** - User and permission management
- **`fm_backup_restore`** - Database backup and restore operations
- **`fm_sync_data`** - Data synchronization between databases

### Phase 4: AI Integration (Planned)
- **`fm_ai_analyze`** - AI-powered data analysis
- **`fm_ai_optimize`** - AI-driven performance optimization
- **`fm_ai_generate`** - AI-generated reports and insights

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

- **Documentation**: [README.md](README.md)
- **Issues**: [GitHub Issues](https://github.com/your-repo/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-repo/discussions)

## 🔄 Changelog

### v2.4.0 (Current)
- ✅ Added Phase 2 Advanced Analysis Tools
- ✅ Enhanced performance monitoring
- ✅ Improved error handling
- ✅ Updated documentation

### v2.3.0
- ✅ Added Phase 1 Core Discovery Tools
- ✅ Fixed script execution endpoint
- ✅ Improved authentication handling

### v2.2.x
- ✅ Core MCP server functionality
- ✅ Basic FileMaker Data API integration
- ✅ Git integration features
