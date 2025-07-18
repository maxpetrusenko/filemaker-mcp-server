# FileMaker MCP Server

A Model Context Protocol (MCP) server for FileMaker integration, enabling AI assistants to interact with FileMaker databases through natural language commands.

## Features

### Core FileMaker Operations
- **CRUD Operations**: Find, create, update, and delete records
- **Script Execution**: Run FileMaker scripts with parameters
- **Layout Metadata**: Retrieve layout information and field definitions
- **Authentication**: Secure token-based authentication with FileMaker Server

### 🆕 Git-based Version Control (v2.0)
- **Layout Export**: Export FileMaker layouts to XML/JSON and save to Git
- **Script Export**: Export FileMaker scripts to XML/JSON and save to Git
- **Git Operations**: Commit, push, pull, status, and diff operations
- **Bidirectional Sync**: Seamless integration between FileMaker and Git repositories
- **Collaborative Development**: Enable team collaboration with version control

### 🆕 Intelligent Debugging (v2.1)
- **Script Analysis**: Detect common debugging issues and performance bottlenecks
- **Error Resolution**: AI-powered error analysis with fix suggestions
- **Script Optimization**: Performance and readability optimization recommendations
- **Layout Validation**: Validate layout structure for common issues
- **Complexity Analysis**: Assess script complexity and risk levels
- **Performance Analysis**: Identify performance bottlenecks and optimization opportunities

### 🆕 API Enhancement & Scalability (v2.2)
- **Batch Operations**: Process multiple records in batches to overcome 50-record limits
- **Paginated Queries**: Retrieve large datasets efficiently with pagination
- **Bulk Import/Export**: Import and export large datasets with field mapping
- **Data Synchronization**: Sync data between layouts with conflict resolution
- **Performance Monitoring**: Monitor API performance and identify bottlenecks
- **Cache Management**: In-memory caching for improved response times
- **Rate Limit Handling**: Intelligent rate limiting to prevent API throttling

## Installation

```bash
npm install -g filemaker-mcp-server
```

Or run directly with npx:

```bash
npx filemaker-mcp-server
```

## Configuration

### Environment Variables
```bash
export FILEMAKER_HOST="https://your-filemaker-server.com"
export FILEMAKER_DATABASE="YourDatabase"
export FILEMAKER_USERNAME="your-username"
export FILEMAKER_PASSWORD="your-password"
export FILEMAKER_GIT_REPO_PATH="/path/to/your/git/repo"  # Optional for Git integration
```

### Command Line Arguments
```bash
filemaker-mcp-server \
  --host "https://your-filemaker-server.com" \
  --database "YourDatabase" \
  --username "your-username" \
  --password "your-password" \
  --git-repo-path "/path/to/your/git/repo"  # Optional for Git integration
```

## Usage

### Basic FileMaker Operations

#### Find Records
```json
{
  "name": "fm_find_records",
  "arguments": {
    "layout": "Contacts",
    "query": { "Name": "John Doe" },
    "limit": 10,
    "offset": 1
  }
}
```

#### Create Record
```json
{
  "name": "fm_create_record",
  "arguments": {
    "layout": "Contacts",
    "fieldData": {
      "Name": "Jane Smith",
      "Email": "jane@example.com",
      "Phone": "555-1234"
    }
  }
}
```

#### Execute Script
```json
{
  "name": "fm_execute_script",
  "arguments": {
    "script": "SendWelcomeEmail",
    "parameter": "user@example.com"
  }
}
```

### 🆕 Git Integration Operations

#### Export Layout to Git
```json
{
  "name": "fm_git_export_layout",
  "arguments": {
    "layout": "Contacts",
    "format": "xml",
    "gitMessage": "Export Contacts layout for version control"
  }
}
```

#### Export Script to Git
```json
{
  "name": "fm_git_export_script",
  "arguments": {
    "script": "SendWelcomeEmail",
    "format": "json",
    "gitMessage": "Export SendWelcomeEmail script"
  }
}
```

#### Commit Changes
```json
{
  "name": "fm_git_commit_changes",
  "arguments": {
    "message": "Update FileMaker components",
    "includeAll": true
  }
}
```

#### Push to Remote Repository
```json
{
  "name": "fm_git_push_changes",
  "arguments": {
    "remote": "origin",
    "branch": "main"
  }
}
```

#### Pull Latest Changes
```json
{
  "name": "fm_git_pull_changes",
  "arguments": {
    "remote": "origin",
    "branch": "main"
  }
}
```

#### Check Git Status
```json
{
  "name": "fm_git_status",
  "arguments": {
    "showStaged": true,
    "showUnstaged": true
  }
}
```

#### View Git Diff
```json
{
  "name": "fm_git_diff",
  "arguments": {
    "file": "Contacts.xml",
    "staged": false
  }
}
```

### 🆕 API Enhancement & Scalability Operations

#### Batch Operations
```json
{
  "name": "fm_api_batch_operations",
  "arguments": {
    "operation": "create",
    "records": [
      { "layout": "Contacts", "fieldData": { "Name": "John Doe", "Email": "john@example.com" } },
      { "layout": "Contacts", "fieldData": { "Name": "Jane Smith", "Email": "jane@example.com" } }
    ],
    "batchSize": 50
  }
}
```

#### Paginated Query
```json
{
  "name": "fm_api_paginated_query",
  "arguments": {
    "query": { "layout": "Contacts", "filters": {} },
    "pageSize": 100,
    "maxPages": 10,
    "sortField": "_modificationTimestamp",
    "sortOrder": "desc"
  }
}
```

#### Bulk Import
```json
{
  "name": "fm_api_bulk_import",
  "arguments": {
    "data": [
      { "Name": "John Doe", "Email": "john@example.com" },
      { "Name": "Jane Smith", "Email": "jane@example.com" }
    ],
    "layout": "Contacts",
    "importMode": "create",
    "fieldMapping": { "Name": "FullName", "Email": "EmailAddress" },
    "conflictResolution": "skip"
  }
}
```

#### Bulk Export
```json
{
  "name": "fm_api_bulk_export",
  "arguments": {
    "layout": "Contacts",
    "format": "json",
    "fields": ["Name", "Email", "Phone"],
    "includeMetadata": true
  }
}
```

#### Data Synchronization
```json
{
  "name": "fm_api_data_sync",
  "arguments": {
    "sourceLayout": "Contacts",
    "targetLayout": "ContactsBackup",
    "keyField": "Email",
    "syncMode": "incremental",
    "lastSyncTime": "2024-01-01T00:00:00Z"
  }
}
```

#### Performance Monitoring
```json
{
  "name": "fm_api_performance_monitor",
  "arguments": {
    "operation": "query_performance",
    "duration": 5000
  }
}
```

#### Cache Management
```json
{
  "name": "fm_api_cache_management",
  "arguments": {
    "action": "set",
    "key": "contacts_layout_metadata",
    "data": { "fields": ["Name", "Email", "Phone"] },
    "ttl": 3600
  }
}
```

#### Rate Limit Handling
```json
{
  "name": "fm_api_rate_limit_handler",
  "arguments": {
    "operation": "find_records",
    "requests": 10,
    "timeWindow": 60000
  }
}
```

### 🆕 Intelligent Debugging Operations

#### Analyze Script for Debugging Issues
```json
{
  "name": "fm_debug_analyze_script",
  "arguments": {
    "scriptName": "SendWelcomeEmail",
    "scriptContent": "Set Next Step\nGo to Field [\"Email\"]\nSet Field [\"Email\"; \"test@example.com\"]"
  }
}
```

#### Get Error Fix Suggestions
```json
{
  "name": "fm_debug_suggest_fixes",
  "arguments": {
    "scriptName": "SendWelcomeEmail",
    "errorMessage": "Field not found: Email",
    "scriptContent": "Set Field [\"Email\"; \"test@example.com\"]"
  }
}
```

#### Optimize Script for Performance
```json
{
  "name": "fm_debug_optimize_script",
  "arguments": {
    "scriptName": "ProcessRecords",
    "scriptContent": "Go to Field [\"Name\"]\nSet Field [\"Name\"; \"John\"]",
    "optimizationType": "performance"
  }
}
```

#### Validate Layout Structure
```json
{
  "name": "fm_debug_validate_layout",
  "arguments": {
    "layoutName": "Contacts",
    "layoutData": {
      "objects": [/* layout objects array */]
    }
  }
}
```

#### Resolve FileMaker Error Codes
```json
{
  "name": "fm_debug_error_resolution",
  "arguments": {
    "errorCode": "100",
    "scriptName": "FindRecord",
    "errorContext": {
      "layout": "Contacts",
      "operation": "find"
    }
  }
}
```

#### Analyze Script Performance
```json
{
  "name": "fm_debug_performance_analysis",
  "arguments": {
    "scriptName": "ProcessLargeDataset",
    "scriptContent": "Loop\n  Go to Field [\"Field1\"]\n  Set Field [\"Field1\"; Get(RecordNumber)]\nEnd Loop"
  }
}
```

#### Analyze Script Complexity
```json
{
  "name": "fm_debug_script_complexity",
  "arguments": {
    "scriptName": "ComplexWorkflow",
    "scriptContent": "If [condition1]\n  If [condition2]\n    Loop\n      Perform Script [\"SubScript\"]\n    End Loop\n  End If\nEnd If"
  }
}
```

## Claude Integration

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

## Docker Support

### Build and Run
```bash
# Build the image
docker build -t filemaker-mcp-server .

# Run with environment variables
docker run -e FILEMAKER_HOST="https://your-server.com" \
           -e FILEMAKER_DATABASE="YourDatabase" \
           -e FILEMAKER_USERNAME="your-username" \
           -e FILEMAKER_PASSWORD="your-password" \
           -e FILEMAKER_GIT_REPO_PATH="/path/to/repo" \
           filemaker-mcp-server
```

## Development

### Setup
```bash
git clone <repository-url>
cd filemaker-mcp-server
npm install
```

### Build
```bash
npm run build
```

### Test
```bash
npm test
```

### Run Locally
```bash
npm start
```

## Git Integration Workflow

### 1. Initial Setup
```bash
# Initialize Git repository for FileMaker components
mkdir filemaker-components
cd filemaker-components
git init
git remote add origin https://github.com/your-org/filemaker-components.git
```

### 2. Export and Version Control
```bash
# Export layouts and scripts
fm_git_export_layout --layout "Contacts" --format "xml"
fm_git_export_script --script "SendWelcomeEmail" --format "json"

# Commit changes
fm_git_commit_changes --message "Initial export of FileMaker components"

# Push to remote
fm_git_push_changes --remote "origin" --branch "main"
```

### 3. Collaborative Development
- Team members can pull latest changes: `fm_git_pull_changes`
- Review changes with: `fm_git_status` and `fm_git_diff`
- Export their modifications and commit: `fm_git_export_layout` + `fm_git_commit_changes`

## Intelligent Debugging Workflow

### 1. Script Analysis
```bash
# Analyze a script for common issues
fm_debug_analyze_script --scriptName "SendWelcomeEmail" --scriptContent "Set Next Step\nGo to Field [\"Email\"]"
```

### 2. Error Resolution
```bash
# Get fix suggestions for errors
fm_debug_suggest_fixes --scriptName "SendWelcomeEmail" --errorMessage "Field not found: Email"
```

### 3. Performance Optimization
```bash
# Optimize script for better performance
fm_debug_optimize_script --scriptName "ProcessRecords" --optimizationType "performance"
```

### 4. Complexity Assessment
```bash
# Analyze script complexity and risk
fm_debug_script_complexity --scriptName "ComplexWorkflow"
```

### 5. Layout Validation
```bash
# Validate layout structure
fm_debug_validate_layout --layoutName "Contacts" --layoutData "{...}"
```

## Security Considerations

- Store sensitive credentials in environment variables
- Use HTTPS for FileMaker Server connections
- Implement proper access controls for Git repositories
- Consider using Git LFS for large FileMaker exports

## Troubleshooting

### Common Issues

1. **Authentication Failed**
   - Verify FileMaker Server credentials
   - Check network connectivity
   - Ensure FileMaker Data API is enabled

2. **Git Operations Fail**
   - Verify Git repository path exists
   - Check Git credentials and permissions
   - Ensure Git is installed and configured

3. **Export Failures**
   - Verify layout/script names exist in FileMaker
   - Check file system permissions for Git repository
   - Ensure sufficient disk space

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Version History

### v2.2.0
- 🆕 Added API Enhancement & Scalability features
- 🆕 Batch operations to overcome 50-record API limitations
- 🆕 Paginated queries for large dataset retrieval
- 🆕 Bulk import/export with field mapping and conflict resolution
- 🆕 Data synchronization between layouts
- 🆕 Performance monitoring and bottleneck identification
- 🆕 In-memory cache management for improved response times
- 🆕 Intelligent rate limiting to prevent API throttling
- 🔧 Enhanced error handling and batch processing
- 📚 Updated documentation with comprehensive API examples

### v2.1.0
- 🆕 Added Intelligent Debugging features
- 🆕 Script analysis for debugging issues and performance bottlenecks
- 🆕 AI-powered error resolution with fix suggestions
- 🆕 Script optimization for performance and readability
- 🆕 Layout validation for common issues
- 🆕 Complexity analysis and risk assessment
- 🆕 Performance analysis with optimization recommendations
- 🔧 Enhanced error handling and validation
- 📚 Comprehensive debugging documentation and examples

### v2.0.0
- 🆕 Added Git-based version control integration
- 🆕 Export FileMaker layouts and scripts to Git
- 🆕 Git operations: commit, push, pull, status, diff
- 🆕 Bidirectional sync between FileMaker and Git
- 🔧 Improved error handling and authentication
- 📚 Enhanced documentation and examples

### v1.0.0
- Initial release with basic FileMaker CRUD operations
- Script execution support
- Layout metadata retrieval
- Docker support
- Claude integration examples

file maker mcp cursor claude code cline gemini cli claude desktop github
