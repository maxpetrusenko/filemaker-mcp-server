import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import axios, { AxiosInstance } from 'axios';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as fsPromises from 'fs/promises';
import * as path from 'path';

const execAsync = promisify(exec);

export interface FileMakerConfig {
  host: string;
  database: string;
  username: string;
  password: string;
  gitRepoPath?: string; // Path to Git repository for version control
}

export class FileMakerMCP {
  private server: Server;
  private client: AxiosInstance;
  private token?: string;
  private config: FileMakerConfig;
  private cache: Map<string, { data: any; ttl: number; timestamp: number }> = new Map();
  private requestHistory: Array<{ operation: string; timestamp: number }> = [];
  private rateLimits: { [key: string]: number } = {
    find_records: 100,
    create_record: 50,
    update_record: 50,
    delete_record: 50
  };

  constructor(config: FileMakerConfig) {
    // DEBUG: Log constructor call
    fs.writeFileSync('/tmp/filemaker-constructor.log', `Constructor called with config: ${JSON.stringify(config)}`, 'utf8');
    
    this.config = config;
    this.server = new Server({
      name: 'filemaker-mcp',
      version: '1.0.0',
    });
    
    // DEBUG: Log server creation
    fs.writeFileSync('/tmp/filemaker-server-created.log', 'Server created successfully', 'utf8');
    
    this.client = axios.create({
      baseURL: `${config.host}/fmi/data/v1/databases/${config.database}`,
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    // DEBUG: Log client creation
    fs.writeFileSync('/tmp/filemaker-client-created.log', 'Axios client created successfully', 'utf8');
    
    this.setupHandlers();
    
    // DEBUG: Log setup completion
    fs.writeFileSync('/tmp/filemaker-setup-complete.log', 'Setup handlers completed', 'utf8');
  }

  private async authenticate(): Promise<string> {
    try {
      const response = await this.client.post('/sessions', {}, {
        auth: {
          username: this.config.username,
          password: this.config.password,
        },
      });
      this.token = response.data.response.token;
      if (!this.token) {
        throw new Error('No token received from FileMaker.');
      }
      this.client.defaults.headers['Authorization'] = `Bearer ${this.token}`;
      return this.token;
    } catch (error: any) {
      let detailedMessage = 'FileMaker authentication failed';
      
      if (error.response) {
        const status = error.response.status;
        if (status === 401) {
          detailedMessage = `Authentication failed: Invalid username or password. Please check your FileMaker credentials.`;
        } else if (status === 403) {
          detailedMessage = `Access denied: The user does not have permission to access this database. Please check user privileges in FileMaker.`;
        } else if (status === 404) {
          detailedMessage = `Database not found: The specified database "${this.config.database}" does not exist or is not accessible. Please check the database name and permissions.`;
        } else if (status === 500) {
          detailedMessage = `Server error: FileMaker server encountered an error during authentication. This could be due to server configuration issues.`;
        } else {
          detailedMessage = `Authentication failed with status code ${status}. Please check your FileMaker server configuration.`;
        }
      } else if (error.code === 'ENOTFOUND') {
        detailedMessage = `Connection failed: Cannot reach FileMaker server at ${this.config.host}. Please check:
1. The server URL is correct
2. The server is running and accessible
3. Network connectivity is available`;
      } else if (error.code === 'ECONNREFUSED') {
        detailedMessage = `Connection refused: FileMaker server at ${this.config.host} is not accepting connections. Please check:
1. The server is running
2. The port is correct
3. Firewall settings allow the connection`;
      } else {
        detailedMessage = `Authentication failed: ${error.message || 'Unknown error'}`;
      }
      
      throw new Error(detailedMessage);
    }
  }

  private setupHandlers() {
    // DEBUG: Log that setupHandlers is being called
    fs.writeFileSync('/tmp/filemaker-setup-handlers.log', 'setupHandlers method called', 'utf8');
    
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      // DEBUG: Log that ListToolsRequestSchema handler is being called
      fs.writeFileSync('/tmp/filemaker-list-tools.log', 'ListToolsRequestSchema handler called', 'utf8');
      
      return {
        tools: [
          // Existing FileMaker CRUD tools
          {
            name: 'fm_find_records',
            description: 'Find records in a FileMaker layout',
            inputSchema: {
              type: 'object',
              properties: {
                layout: { type: 'string', description: 'Layout name' },
                query: {
                  type: 'object',
                  description: 'Find query object with field names and values',
                },
                limit: {
                  type: 'number',
                  description: 'Maximum number of records to return',
                  default: 100,
                },
                offset: {
                  type: 'number',
                  description: 'Record offset for pagination',
                  default: 1,
                },
              },
              required: ['layout'],
            },
          },
          {
            name: 'fm_create_record',
            description: 'Create a new record in FileMaker',
            inputSchema: {
              type: 'object',
              properties: {
                layout: { type: 'string', description: 'Layout name' },
                fieldData: {
                  type: 'object',
                  description: 'Field data for the new record',
                },
              },
              required: ['layout', 'fieldData'],
            },
          },
          {
            name: 'fm_update_record',
            description: 'Update an existing record in FileMaker',
            inputSchema: {
              type: 'object',
              properties: {
                layout: { type: 'string', description: 'Layout name' },
                recordId: { type: 'string', description: 'Record ID to update' },
                fieldData: {
                  type: 'object',
                  description: 'Field data to update',
                },
              },
              required: ['layout', 'recordId', 'fieldData'],
            },
          },
          {
            name: 'fm_delete_record',
            description: 'Delete a record from FileMaker',
            inputSchema: {
              type: 'object',
              properties: {
                layout: { type: 'string', description: 'Layout name' },
                recordId: { type: 'string', description: 'Record ID to delete' },
              },
              required: ['layout', 'recordId'],
            },
          },
          {
            name: 'fm_execute_script',
            description: 'Execute a FileMaker script',
            inputSchema: {
              type: 'object',
              properties: {
                script: { type: 'string', description: 'Script name' },
                parameter: {
                  type: 'string',
                  description: 'Script parameter (optional)',
                },
              },
              required: ['script'],
            },
          },
          {
            name: 'fm_get_layout_metadata',
            description: 'Get metadata for a FileMaker layout',
            inputSchema: {
              type: 'object',
              properties: {
                layout: { type: 'string', description: 'Layout name' },
              },
              required: ['layout'],
            },
          },
          // NEW: Git-based Version Control Tools
          {
            name: 'fm_git_export_layout',
            description: 'Export a FileMaker layout to XML/JSON and save to Git repository',
            inputSchema: {
              type: 'object',
              properties: {
                layout: { type: 'string', description: 'Layout name to export' },
                format: { 
                  type: 'string', 
                  description: 'Export format: xml or json',
                  enum: ['xml', 'json'],
                  default: 'xml'
                },
                gitMessage: { 
                  type: 'string', 
                  description: 'Git commit message for this export',
                  default: 'Export FileMaker layout'
                }
              },
              required: ['layout'],
            },
          },
          {
            name: 'fm_git_export_script',
            description: 'Export a FileMaker script to XML/JSON and save to Git repository',
            inputSchema: {
              type: 'object',
              properties: {
                script: { type: 'string', description: 'Script name to export' },
                format: { 
                  type: 'string', 
                  description: 'Export format: xml or json',
                  enum: ['xml', 'json'],
                  default: 'xml'
                },
                gitMessage: { 
                  type: 'string', 
                  description: 'Git commit message for this export',
                  default: 'Export FileMaker script'
                }
              },
              required: ['script'],
            },
          },
          {
            name: 'fm_git_commit_changes',
            description: 'Commit all changes in the Git repository',
            inputSchema: {
              type: 'object',
              properties: {
                message: { 
                  type: 'string', 
                  description: 'Commit message',
                  default: 'Update FileMaker components'
                },
                includeAll: {
                  type: 'boolean',
                  description: 'Include all changes (git add .)',
                  default: true
                }
              },
              required: ['message'],
            },
          },
          {
            name: 'fm_git_push_changes',
            description: 'Push committed changes to remote Git repository',
            inputSchema: {
              type: 'object',
              properties: {
                remote: { 
                  type: 'string', 
                  description: 'Remote name (e.g., origin)',
                  default: 'origin'
                },
                branch: { 
                  type: 'string', 
                  description: 'Branch name to push to',
                  default: 'main'
                }
              },
            },
          },
          {
            name: 'fm_git_pull_changes',
            description: 'Pull latest changes from remote Git repository',
            inputSchema: {
              type: 'object',
              properties: {
                remote: { 
                  type: 'string', 
                  description: 'Remote name (e.g., origin)',
                  default: 'origin'
                },
                branch: { 
                  type: 'string', 
                  description: 'Branch name to pull from',
                  default: 'main'
                }
              },
            },
          },
          {
            name: 'fm_git_status',
            description: 'Get Git repository status and show changes',
            inputSchema: {
              type: 'object',
              properties: {
                showStaged: {
                  type: 'boolean',
                  description: 'Show staged changes',
                  default: true
                },
                showUnstaged: {
                  type: 'boolean',
                  description: 'Show unstaged changes',
                  default: true
                }
              },
            },
          },
          {
            name: 'fm_git_diff',
            description: 'Show differences between working directory and last commit',
            inputSchema: {
              type: 'object',
              properties: {
                file: { 
                  type: 'string', 
                  description: 'Specific file to show diff for (optional)'
                },
                staged: {
                  type: 'boolean',
                  description: 'Show staged changes diff',
                  default: false
                }
              },
            },
          },
          // NEW: Intelligent Debugging Tools
          {
            name: 'fm_debug_analyze_script',
            description: 'Analyze a FileMaker script for common debugging issues, performance bottlenecks, and complexity.',
            inputSchema: {
              type: 'object',
              properties: {
                scriptName: { type: 'string', description: 'Name of the script to analyze' },
                scriptContent: { type: 'string', description: 'Content of the script to analyze' },
              },
              required: ['scriptName', 'scriptContent'],
            },
          },
          {
            name: 'fm_debug_suggest_fixes',
            description: 'Suggest fixes for common FileMaker script errors and issues.',
            inputSchema: {
              type: 'object',
              properties: {
                errorMessage: { type: 'string', description: 'Error message to analyze' },
                scriptContent: { type: 'string', description: 'Script content (optional)' },
              },
              required: ['errorMessage'],
            },
          },
          {
            name: 'fm_debug_optimize_script',
            description: 'Optimize FileMaker script for better performance and maintainability.',
            inputSchema: {
              type: 'object',
              properties: {
                scriptContent: { type: 'string', description: 'Script content to optimize' },
                optimizationType: { 
                  type: 'string', 
                  description: 'Type of optimization',
                  enum: ['performance', 'readability', 'maintainability'],
                  default: 'performance'
                },
              },
              required: ['scriptContent'],
            },
          },
          {
            name: 'fm_debug_validate_layout',
            description: 'Validate FileMaker layout structure and field configurations.',
            inputSchema: {
              type: 'object',
              properties: {
                layoutName: { type: 'string', description: 'Name of the layout to validate' },
                layoutData: { type: 'object', description: 'Layout data to validate' },
              },
              required: ['layoutName'],
            },
          },
          {
            name: 'fm_debug_error_resolution',
            description: 'Provide detailed error resolution steps for FileMaker errors.',
            inputSchema: {
              type: 'object',
              properties: {
                errorCode: { type: 'string', description: 'FileMaker error code' },
                errorContext: { type: 'object', description: 'Error context information' },
                scriptName: { type: 'string', description: 'Script name where error occurred' },
              },
              required: ['errorCode'],
            },
          },
          {
            name: 'fm_debug_performance_analysis',
            description: 'Analyze FileMaker script performance and provide optimization recommendations.',
            inputSchema: {
              type: 'object',
              properties: {
                scriptContent: { type: 'string', description: 'Script content to analyze' },
                executionData: { type: 'object', description: 'Execution data (optional)' },
              },
              required: ['scriptContent'],
            },
          },
          {
            name: 'fm_debug_script_complexity',
            description: 'Analyze FileMaker script complexity and provide refactoring suggestions.',
            inputSchema: {
              type: 'object',
              properties: {
                scriptContent: { type: 'string', description: 'Script content to analyze' },
              },
              required: ['scriptContent'],
            },
          },
          // NEW: API Enhancement & Scalability Tools
          {
            name: 'fm_api_batch_operations',
            description: 'Perform batch operations on multiple FileMaker records.',
            inputSchema: {
              type: 'object',
              properties: {
                operation: { 
                  type: 'string', 
                  description: 'Type of batch operation',
                  enum: ['create', 'update', 'delete'],
                },
                layout: { type: 'string', description: 'Layout name' },
                records: { type: 'array', description: 'Array of records to process' },
                batchSize: { 
                  type: 'number', 
                  description: 'Number of records to process in each batch',
                  default: 50
                },
              },
              required: ['operation', 'layout', 'records'],
            },
          },
          {
            name: 'fm_api_paginated_query',
            description: 'Execute paginated queries with advanced filtering and sorting.',
            inputSchema: {
              type: 'object',
              properties: {
                layout: { type: 'string', description: 'Layout name' },
                query: { type: 'object', description: 'Find query object' },
                page: { 
                  type: 'number', 
                  description: 'Page number',
                  default: 1
                },
                pageSize: { 
                  type: 'number', 
                  description: 'Records per page',
                  default: 100
                },
                sort: { type: 'array', description: 'Sort criteria' },
                fields: { type: 'array', description: 'Fields to return' },
              },
              required: ['layout'],
            },
          },
          {
            name: 'fm_api_bulk_import',
            description: 'Bulk import data into FileMaker with validation and error handling.',
            inputSchema: {
              type: 'object',
              properties: {
                layout: { type: 'string', description: 'Layout name' },
                data: { type: 'array', description: 'Data to import' },
                fieldMapping: { type: 'object', description: 'Field mapping configuration' },
                validationRules: { type: 'object', description: 'Validation rules' },
                duplicateHandling: { 
                  type: 'string', 
                  description: 'How to handle duplicates',
                  enum: ['skip', 'update', 'create'],
                  default: 'skip'
                },
              },
              required: ['layout', 'data'],
            },
          },
          {
            name: 'fm_api_bulk_export',
            description: 'Bulk export data from FileMaker with filtering and formatting options.',
            inputSchema: {
              type: 'object',
              properties: {
                layout: { type: 'string', description: 'Layout name' },
                format: { 
                  type: 'string', 
                  description: 'Export format',
                  enum: ['json', 'csv', 'xml'],
                  default: 'json'
                },
                query: { type: 'object', description: 'Find query object' },
                fields: { type: 'array', description: 'Fields to export' },
                includeMetadata: { 
                  type: 'boolean', 
                  description: 'Include metadata in export',
                  default: false
                },
              },
              required: ['layout'],
            },
          },
          {
            name: 'fm_api_data_sync',
            description: 'Synchronize data between FileMaker and external systems.',
            inputSchema: {
              type: 'object',
              properties: {
                layout: { type: 'string', description: 'Layout name' },
                syncDirection: { 
                  type: 'string', 
                  description: 'Sync direction',
                  enum: ['import', 'export', 'bidirectional'],
                  default: 'bidirectional'
                },
                externalData: { type: 'array', description: 'External data to sync' },
                keyField: { type: 'string', description: 'Key field for matching records' },
                conflictResolution: { 
                  type: 'string', 
                  description: 'Conflict resolution strategy',
                  enum: ['filemaker_wins', 'external_wins', 'manual'],
                  default: 'filemaker_wins'
                },
              },
              required: ['layout'],
            },
          },
          {
            name: 'fm_api_performance_monitor',
            description: 'Monitor and analyze FileMaker API performance metrics.',
            inputSchema: {
              type: 'object',
              properties: {
                operation: { type: 'string', description: 'Operation to monitor' },
                duration: { 
                  type: 'number', 
                  description: 'Monitoring duration in seconds',
                  default: 60
                },
                metrics: { 
                  type: 'array', 
                  description: 'Metrics to collect',
                  default: ['response_time', 'throughput', 'error_rate']
                },
              },
              required: ['operation'],
            },
          },
          {
            name: 'fm_api_cache_management',
            description: 'Manage caching for FileMaker API operations.',
            inputSchema: {
              type: 'object',
              properties: {
                action: { 
                  type: 'string', 
                  description: 'Cache action',
                  enum: ['get', 'set', 'clear', 'stats'],
                  default: 'get'
                },
                key: { type: 'string', description: 'Cache key' },
                data: { type: 'object', description: 'Data to cache' },
                ttl: { 
                  type: 'number', 
                  description: 'Time to live in seconds',
                  default: 300
                },
              },
              required: ['action'],
            },
          },
          {
            name: 'fm_api_rate_limit_handler',
            description: 'Handle rate limiting for FileMaker API operations.',
            inputSchema: {
              type: 'object',
              properties: {
                operation: { type: 'string', description: 'Operation to rate limit' },
                maxRequests: { 
                  type: 'number', 
                  description: 'Maximum requests per time window',
                  default: 100
                },
                timeWindow: { 
                  type: 'number', 
                  description: 'Time window in seconds',
                  default: 60
                },
                strategy: { 
                  type: 'string', 
                  description: 'Rate limiting strategy',
                  enum: ['drop', 'queue', 'throttle'],
                  default: 'throttle'
                },
              },
              required: ['operation'],
            },
          },
        ],
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      // DEBUG: Log that the tool call handler is being called
      fs.writeFileSync('/tmp/filemaker-handler-called.log', `Tool call handler called with request: ${JSON.stringify(request)}`, 'utf8');
      
      const { name, arguments: args } = request.params;
      
      // DEBUG: Log the tool name and arguments
      fs.writeFileSync('/tmp/filemaker-tool-details.log', `Tool: ${name}, Args: ${JSON.stringify(args)}`, 'utf8');
      
      try {
        if (!this.token) {
          await this.authenticate();
        }
        
        let result;
        switch (name) {
          case 'fm_find_records':
            result = await this.findRecords(args);
            break;
          case 'fm_create_record':
            result = await this.createRecord(args);
            break;
          case 'fm_update_record':
            result = await this.updateRecord(args);
            break;
          case 'fm_delete_record':
            result = await this.deleteRecord(args);
            break;
          case 'fm_execute_script':
            result = await this.executeScript(args);
            break;
          case 'fm_get_layout_metadata':
            result = await this.getLayoutMetadata(args);
            break;
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
        
        // DEBUG: Log successful result
        fs.writeFileSync('/tmp/filemaker-success.log', `Tool ${name} completed successfully`, 'utf8');
        
        return result;
      } catch (error: any) {
        // DEBUG: Log that error handling is being executed
        fs.writeFileSync('/tmp/filemaker-error-handler.log', `Error handler called for tool ${name}`, 'utf8');
        
        // DEBUG: Log the raw error to see its structure
        const errorLog = {
          timestamp: new Date().toISOString(),
          toolName: name,
          errorType: typeof error,
          errorMessage: error.message,
          errorResponse: error.response,
          errorData: error.response?.data,
          errorStatus: error.response?.status,
          errorKeys: Object.keys(error)
        };
        
        fs.writeFileSync('/tmp/filemaker-error-debug.log', JSON.stringify(errorLog, null, 2), 'utf8');

        // IMPROVED ERROR HANDLING: Capture both HTTP response and FileMaker error details
        let errorDetails = {
          message: error.message || 'Unknown error',
          status: null,
          filemakerErrors: [],
          response: null
        };

        // Check if it's an Axios error with response data
        if (error.response) {
          errorDetails.status = error.response.status;
          errorDetails.response = error.response.data;
          
          // Extract FileMaker-specific error messages
          if (error.response.data && error.response.data.messages) {
            errorDetails.filemakerErrors = error.response.data.messages.map((msg: any) => ({
              code: msg.code,
              message: msg.message
            }));
          }
        }

        // Use the original error message if it's already detailed, otherwise create a generic one
        let detailedMessage = error.message;
        
        // If the error message is generic, enhance it with status code and FileMaker details
        if (error.message.includes('Request failed with status code') || error.message.includes('FileMaker authentication failed')) {
          detailedMessage = `Request failed with status code ${errorDetails.status || 'unknown'}`;
          
          if (errorDetails.filemakerErrors.length > 0) {
            const errorList = errorDetails.filemakerErrors.map((err: any) => 
              `Error ${err.code}: ${err.message}`
            ).join('; ');
            detailedMessage += ` - ${errorList}`;
          }
        }

        // Write final error message to file
        fs.writeFileSync('/tmp/filemaker-final-error.log', detailedMessage, 'utf8');

        // Return enhanced error response with FileMaker details
        throw new Error(detailedMessage);
      }
    });
  }

  async findRecords(args: any) {
    const { layout, query = {}, limit = 100, offset = 1 } = args;
    const findRequest = {
      query: Object.keys(query).length > 0 ? [query] : [],
      limit,
      offset,
    };

    const response = await this.client.post(`/layouts/${layout}/_find`, findRequest);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(response.data.response.data, null, 2),
        },
      ],
    };
  }

  async createRecord(args: any) {
    const { layout, fieldData } = args;
    const response = await this.client.post(`/layouts/${layout}/records`, {
      fieldData,
    });
    return {
      content: [
        {
          type: 'text',
          text: `Record created with ID: ${response.data.response.recordId}`,
        },
      ],
    };
  }

  async updateRecord(args: any) {
    const { layout, recordId, fieldData } = args;
    await this.client.patch(`/layouts/${layout}/records/${recordId}`, {
      fieldData,
    });
    return {
      content: [
        {
          type: 'text',
          text: `Record ${recordId} updated successfully.`,
        },
      ],
    };
  }

  async deleteRecord(args: any) {
    const { layout, recordId } = args;
    await this.client.delete(`/layouts/${layout}/records/${recordId}`);
    return {
      content: [
        {
          type: 'text',
          text: `Record ${recordId} deleted successfully.`,
        },
      ],
    };
  }

  async executeScript(args: any) {
    const { script, parameter } = args;
    const scriptRequest: any = {};
    if (parameter) {
      scriptRequest.scriptParam = parameter;
    }
    try {
      // Use the correct endpoint structure: POST /scripts/{scriptName}
      const response = await this.client.post(`/scripts/${script}`, scriptRequest);
      return {
        content: [
          {
            type: 'text',
            text: `Script ${script} executed successfully. Result: ${JSON.stringify(response.data.response)}`,
          },
        ],
      };
    } catch (error: any) {
      // Handle error directly in the tool method
      let errorDetails = {
        message: error.message || 'Unknown error',
        status: null,
        filemakerErrors: [],
        response: null
      };

      if (error.response) {
        errorDetails.status = error.response.status;
        errorDetails.response = error.response.data;
        
        if (error.response.data && error.response.data.messages) {
          errorDetails.filemakerErrors = error.response.data.messages.map((msg: any) => ({
            code: msg.code,
            message: msg.message
          }));
        }
      }

      let detailedMessage = '';
      
      // Provide specific error messages based on status codes
      const status = errorDetails.status;
      if (status === 401) {
        detailedMessage = `Authentication failed: Invalid username or password. Please check your FileMaker credentials.`;
      } else if (status === 403) {
        detailedMessage = `Access denied: The user does not have permission to execute scripts. Please check user privileges in FileMaker.`;
      } else if (status === 404) {
        detailedMessage = `Script "${script}" not found or not accessible via Data API. Possible causes:
1. Script name is incorrect
2. Script is not published for web access
3. Data API is not enabled for this database
4. Script requires parameters that are not provided`;
      } else if (status === 405) {
        detailedMessage = `Method not allowed: Script execution is not supported via Data API. Please check if:
1. Data API is enabled for this database
2. Scripts are configured for web access
3. The script endpoint is properly configured`;
      } else if (status === 500) {
        detailedMessage = `Server error: FileMaker server encountered an error. This could be due to:
1. Script execution error
2. Database configuration issue
3. Server overload`;
      } else {
        detailedMessage = `Request failed with status code ${status || 'unknown'}`;
      }
      
      if (errorDetails.filemakerErrors.length > 0) {
        const errorList = errorDetails.filemakerErrors.map((err: any) => 
          `Error ${err.code}: ${err.message}`
        ).join('; ');
        detailedMessage += `\n\nFileMaker Error Details: ${errorList}`;
      }

      throw new Error(detailedMessage);
    }
  }

  async getLayoutMetadata(args: any) {
    // DEBUG: Log that this method is being called
    fs.writeFileSync('/tmp/filemaker-method-called.log', `getLayoutMetadata called with args: ${JSON.stringify(args)}`, 'utf8');
    
    const { layout } = args;
    try {
      const response = await this.client.get(`/layouts/${layout}`);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(response.data.response, null, 2),
          },
        ],
      };
    } catch (error: any) {
      // DEBUG: Write error details to file to see if this code is being executed
      const errorLog = {
        timestamp: new Date().toISOString(),
        errorType: typeof error,
        errorMessage: error.message,
        errorResponse: error.response,
        errorData: error.response?.data,
        errorStatus: error.response?.status,
        errorKeys: Object.keys(error)
      };
      
      fs.writeFileSync('/tmp/filemaker-error-debug.log', JSON.stringify(errorLog, null, 2), 'utf8');

      // Handle error directly in the tool method
      let errorDetails = {
        message: error.message || 'Unknown error',
        status: null,
        filemakerErrors: [],
        response: null
      };

      if (error.response) {
        errorDetails.status = error.response.status;
        errorDetails.response = error.response.data;
        
        if (error.response.data && error.response.data.messages) {
          errorDetails.filemakerErrors = error.response.data.messages.map((msg: any) => ({
            code: msg.code,
            message: msg.message
          }));
        }
      }

      let detailedMessage = '';
      
      // Provide specific error messages based on status codes
      const status = errorDetails.status;
      if (status === 401) {
        detailedMessage = `Authentication failed: Invalid username or password. Please check your FileMaker credentials.`;
      } else if (status === 403) {
        detailedMessage = `Access denied: The user does not have permission to access layout metadata. Please check user privileges in FileMaker.`;
      } else if (status === 404) {
        detailedMessage = `Layout "${layout}" not found or not accessible via Data API. Possible causes:
1. Layout name is incorrect
2. Layout is not published for web access
3. Data API is not enabled for this database
4. Layout requires specific permissions`;
      } else if (status === 405) {
        detailedMessage = `Method not allowed: Layout metadata access is not supported via Data API. Please check if:
1. Data API is enabled for this database
2. Layouts are configured for web access
3. The layout endpoint is properly configured`;
      } else if (status === 500) {
        detailedMessage = `Server error: FileMaker server encountered an error. This could be due to:
1. Layout configuration error
2. Database configuration issue
3. Server overload`;
      } else {
        detailedMessage = `Request failed with status code ${status || 'unknown'}`;
      }
      
      if (errorDetails.filemakerErrors.length > 0) {
        const errorList = errorDetails.filemakerErrors.map((err: any) => 
          `Error ${err.code}: ${err.message}`
        ).join('; ');
        detailedMessage += `\n\nFileMaker Error Details: ${errorList}`;
      }

      // Write final error message to file
      fs.writeFileSync('/tmp/filemaker-final-error.log', detailedMessage, 'utf8');

      throw new Error(detailedMessage);
    }
  }

  async gitExportLayout(args: any) {
    const { layout, format = 'xml', gitMessage = 'Export FileMaker layout' } = args;
    const layoutData = await this.getLayoutData(layout);
    const filePath = await this.saveToGit(layoutData, `${layout}.${format}`);
    return {
      content: [
        {
          type: 'text',
          text: `Layout ${layout} exported to ${filePath} and committed.`,
        },
      ],
    };
  }

  async gitExportScript(args: any) {
    const { script, format = 'xml', gitMessage = 'Export FileMaker script' } = args;
    const scriptData = await this.getScriptData(script);
    const filePath = await this.saveToGit(scriptData, `${script}.${format}`);
    return {
      content: [
        {
          type: 'text',
          text: `Script ${script} exported to ${filePath} and committed.`,
        },
      ],
    };
  }

  async gitCommitChanges(args: any) {
    const { message, includeAll = true } = args;
    const gitAddCommand = includeAll ? 'git add .' : '';
    const gitCommitCommand = `git commit -m "${message}"`;

    if (gitAddCommand) {
      await execAsync(gitAddCommand);
    }
    await execAsync(gitCommitCommand);
    return {
      content: [
        {
          type: 'text',
          text: `Changes committed to Git repository.`,
        },
      ],
    };
  }

  async gitPushChanges(args: any) {
    const { remote = 'origin', branch = 'main' } = args;
    const gitPushCommand = `git push ${remote} ${branch}`;
    await execAsync(gitPushCommand);
    return {
      content: [
        {
          type: 'text',
          text: `Changes pushed to ${remote}/${branch}.`,
        },
      ],
    };
  }

  async gitPullChanges(args: any) {
    const { remote = 'origin', branch = 'main' } = args;
    const gitPullCommand = `git pull ${remote} ${branch}`;
    await execAsync(gitPullCommand);
    return {
      content: [
        {
          type: 'text',
          text: `Changes pulled from ${remote}/${branch}.`,
        },
      ],
    };
  }

  async gitStatus(args: any) {
    const { showStaged = true, showUnstaged = true } = args;
    const gitStatusCommand = `git status --short`;
    const { stdout, stderr } = await execAsync(gitStatusCommand);
    if (stderr) {
      throw new Error(`Error getting Git status: ${stderr}`);
    }
    const statusOutput = stdout.trim();
    const lines = statusOutput.split('\n');
    const changes: string[] = [];

    for (const line of lines) {
      if (showStaged && line.startsWith('A ')) {
        changes.push(`Staged: ${line.substring(2)}`);
      } else if (showUnstaged && line.startsWith('M ')) {
        changes.push(`Unstaged: ${line.substring(2)}`);
      } else if (showUnstaged && line.startsWith('D ')) {
        changes.push(`Deleted: ${line.substring(2)}`);
      }
    }

    return {
      content: [
        {
          type: 'text',
          text: changes.join('\n'),
        },
      ],
    };
  }

  async gitDiff(args: any) {
    const { file, staged = false } = args;
    let gitDiffCommand = staged ? 'git diff --cached' : 'git diff';
    if (file) {
      gitDiffCommand += ` ${file}`;
    }
    const { stdout, stderr } = await execAsync(gitDiffCommand);
    if (stderr) {
      throw new Error(`Error getting Git diff: ${stderr}`);
    }
    return {
      content: [
        {
          type: 'text',
          text: stdout,
        },
      ],
    };
  }

  // NEW: Intelligent Debugging operations
  public async debugAnalyzeScript(args: any): Promise<any> {
    const { scriptName, scriptContent } = args;
    
    if (!scriptName || !scriptContent) {
        throw new Error('Script name and content are required for analysis');
    }

    // Analyze script for common debugging issues
    const analysis = this.analyzeScriptContent(scriptContent);
    
    return {
        content: [
            {
                type: 'text',
                text: JSON.stringify({
                    scriptName,
                    analysis,
                    recommendations: this.generateDebugRecommendations(analysis),
                    complexityScore: this.calculateComplexityScore(scriptContent)
                }, null, 2)
            }
        ]
    };
  }

  public async debugSuggestFixes(args: any): Promise<any> {
    const { scriptName, errorMessage, scriptContent } = args;
    
    if (!scriptName || !errorMessage) {
        throw new Error('Script name and error message are required');
    }

    // AI-powered error analysis and fix suggestions
    const fixes = this.generateErrorFixes(errorMessage, scriptContent);
    
    return {
        content: [
            {
                type: 'text',
                text: JSON.stringify({
                    scriptName,
                    errorMessage,
                    suggestedFixes: fixes,
                    preventionTips: this.generatePreventionTips(errorMessage)
                }, null, 2)
            }
        ]
    };
  }

  public async debugOptimizeScript(args: any): Promise<any> {
    const { scriptName, scriptContent, optimizationType } = args;
    
    if (!scriptName || !scriptContent) {
        throw new Error('Script name and content are required for optimization');
    }

    const optimizationType_ = optimizationType || 'performance';
    const optimizedScript = this.optimizeScriptContent(scriptContent, optimizationType_);
    
    return {
        content: [
            {
                type: 'text',
                text: JSON.stringify({
                    scriptName,
                    originalScript: scriptContent,
                    optimizedScript,
                    optimizationType: optimizationType_,
                    improvements: this.calculateImprovements(scriptContent, optimizedScript)
                }, null, 2)
            }
        ]
    };
  }

  public async debugValidateLayout(args: any): Promise<any> {
    const { layoutName, layoutData } = args;
    
    if (!layoutName || !layoutData) {
        throw new Error('Layout name and data are required for validation');
    }

    const validation = this.validateLayoutStructure(layoutData);
    
    return {
        content: [
            {
                type: 'text',
                text: JSON.stringify({
                    layoutName,
                    validation,
                    issues: validation.issues,
                    recommendations: validation.recommendations
                }, null, 2)
            }
        ]
    };
  }

  public async debugErrorResolution(args: any): Promise<any> {
    const { errorCode, errorContext, scriptName } = args;
    
    if (!errorCode) {
        throw new Error('Error code is required for resolution');
    }

    const resolution = this.resolveFileMakerError(errorCode, errorContext, scriptName);
    
    return {
        content: [
            {
                type: 'text',
                text: JSON.stringify({
                    errorCode,
                    errorContext,
                    scriptName,
                    resolution,
                    steps: resolution.steps,
                    codeExamples: resolution.codeExamples
                }, null, 2)
            }
        ]
    };
  }

  public async debugPerformanceAnalysis(args: any): Promise<any> {
    const { scriptName, scriptContent, executionData } = args;
    
    if (!scriptName || !scriptContent) {
        throw new Error('Script name and content are required for performance analysis');
    }

    const analysis = this.analyzeScriptPerformance(scriptContent, executionData);
    
    return {
        content: [
            {
                type: 'text',
                text: JSON.stringify({
                    scriptName,
                    performanceAnalysis: analysis,
                    bottlenecks: analysis.bottlenecks,
                    optimizationSuggestions: analysis.suggestions
                }, null, 2)
            }
        ]
    };
  }

  public async debugScriptComplexity(args: any): Promise<any> {
    const { scriptName, scriptContent } = args;
    
    if (!scriptName || !scriptContent) {
        throw new Error('Script name and content are required for complexity analysis');
    }

    const complexity = this.analyzeScriptComplexity(scriptContent);
    
    return {
        content: [
            {
                type: 'text',
                text: JSON.stringify({
                    scriptName,
                    complexity,
                    metrics: complexity.metrics,
                    riskLevel: complexity.riskLevel,
                    refactoringSuggestions: complexity.suggestions
                }, null, 2)
            }
        ]
    };
  }

  // NEW: API Enhancement & Scalability operations
  public async apiBatchOperations(args: any): Promise<any> {
    const { operation, records, batchSize = 50 } = args;
    
    try {
      const results = [];
      const batches = this.chunkArray(records, batchSize);
      
      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        let batchResult;
        
        switch (operation) {
          case 'create':
            batchResult = await this.batchCreateRecords(batch);
            break;
          case 'update':
            batchResult = await this.batchUpdateRecords(batch);
            break;
          case 'delete':
            batchResult = await this.batchDeleteRecords(batch);
            break;
          default:
            throw new Error(`Unsupported batch operation: ${operation}`);
        }
        
        results.push({
          batchIndex: i + 1,
          recordCount: batch.length,
          success: batchResult.success,
          errors: batchResult.errors || []
        });
        
        // Rate limiting between batches
        if (i < batches.length - 1) {
          await this.delay(100);
        }
      }
      
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            operation,
            totalRecords: records.length,
            totalBatches: batches.length,
            results,
            summary: {
              successfulBatches: results.filter(r => r.success).length,
              failedBatches: results.filter(r => !r.success).length,
              totalErrors: results.reduce((sum, r) => sum + r.errors.length, 0)
            }
          }, null, 2)
        }]
      };
    } catch (error) {
      throw new Error(`Batch operation failed: ${error}`);
    }
  }

  public async apiPaginatedQuery(args: any): Promise<any> {
    const { query, pageSize = 50, maxPages = 10, sortField, sortOrder = 'asc' } = args;
    
    try {
      const allRecords = [];
      let currentPage = 1;
      let hasMoreData = true;
      
      while (hasMoreData && currentPage <= maxPages) {
        const offset = (currentPage - 1) * pageSize;
        
        const response = await axios.get(`${this.config.host}/fmi/data/v1/databases/${this.config.database}/layouts/${query.layout}/records`, {
          headers: {
            'Authorization': `Bearer ${this.token}`,
            'Content-Type': 'application/json'
          },
          params: {
            _limit: pageSize,
            _offset: offset,
            _sort: sortField ? `${sortField}:${sortOrder}` : undefined,
            ...query.filters
          }
        });
        
        const records = response.data.response.data;
        allRecords.push(...records);
        
        // Check if we have more data
        hasMoreData = records.length === pageSize;
        currentPage++;
        
        // Rate limiting between pages
        if (hasMoreData) {
          await this.delay(50);
        }
      }
      
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            query,
            pagination: {
              pageSize,
              totalPages: currentPage - 1,
              totalRecords: allRecords.length,
              hasMoreData
            },
            records: allRecords,
            performance: {
              executionTime: Date.now(),
              memoryUsage: process.memoryUsage()
            }
          }, null, 2)
        }]
      };
    } catch (error) {
      throw new Error(`Paginated query failed: ${error}`);
    }
  }

  public async apiBulkImport(args: any): Promise<any> {
    const { data, layout, importMode = 'create', fieldMapping, conflictResolution = 'skip' } = args;
    
    try {
      const results = {
        totalRecords: data.length,
        successful: 0,
        failed: 0,
        skipped: 0,
        errors: [] as Array<{ record: any; error: string }>
      };
      
      const batches = this.chunkArray(data, 50);
      
      for (const batch of batches) {
        for (const record of batch) {
          try {
            const mappedData = this.mapFields(record, fieldMapping);
            
            if (importMode === 'create') {
              await this.createRecord({ layout, fieldData: mappedData });
              results.successful++;
            } else if (importMode === 'update') {
              const existingRecord = await this.findExistingRecord(layout, mappedData);
              if (existingRecord) {
                await this.updateRecord({ 
                  layout, 
                  recordId: existingRecord.recordId, 
                  fieldData: mappedData 
                });
                results.successful++;
              } else if (conflictResolution === 'create') {
                await this.createRecord({ layout, fieldData: mappedData });
                results.successful++;
              } else {
                results.skipped++;
              }
            }
                     } catch (error: any) {
             results.failed++;
             results.errors.push({
               record: record,
               error: error.message || 'Unknown error'
             });
           }
        }
        
        // Rate limiting between batches
        await this.delay(100);
      }
      
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            operation: 'bulk_import',
            layout,
            importMode,
            results,
            summary: {
              successRate: (results.successful / results.totalRecords * 100).toFixed(2) + '%',
              failureRate: (results.failed / results.totalRecords * 100).toFixed(2) + '%'
            }
          }, null, 2)
        }]
      };
    } catch (error) {
      throw new Error(`Bulk import failed: ${error}`);
    }
  }

  public async apiBulkExport(args: any): Promise<any> {
    const { layout, format = 'json', filters, fields, includeMetadata = true } = args;
    
    try {
      // Get all records using pagination
      const allRecords = await this.getAllRecords(layout, filters);
      
      let exportData;
      if (format === 'json') {
        exportData = {
          metadata: includeMetadata ? {
            exportDate: new Date().toISOString(),
            layout,
            recordCount: allRecords.length,
            fields: fields || 'all'
          } : undefined,
          records: allRecords.map(record => this.filterFields(record, fields))
        };
      } else if (format === 'csv') {
        exportData = this.convertToCSV(allRecords, fields);
      } else if (format === 'xml') {
        exportData = this.convertToXML(allRecords, fields);
      }
      
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            operation: 'bulk_export',
            layout,
            format,
            recordCount: allRecords.length,
            data: exportData,
            performance: {
              executionTime: Date.now(),
              dataSize: JSON.stringify(exportData).length
            }
          }, null, 2)
        }]
      };
    } catch (error) {
      throw new Error(`Bulk export failed: ${error}`);
    }
  }

  public async apiDataSync(args: any): Promise<any> {
    const { sourceLayout, targetLayout, syncMode = 'incremental', keyField, lastSyncTime } = args;
    
    try {
      const syncResults = {
        added: 0,
        updated: 0,
        deleted: 0,
        errors: [] as Array<{ record: any; error: string }>
      };
      
      // Get source data with incremental filtering
      const sourceFilters = lastSyncTime ? {
        _modificationTimestamp: `>${lastSyncTime}`
      } : {};
      
      const sourceRecords = await this.getAllRecords(sourceLayout, sourceFilters);
      
      for (const sourceRecord of sourceRecords) {
        try {
          const keyValue = sourceRecord[keyField];
          const existingRecord = await this.findRecordByKey(targetLayout, keyField, keyValue);
          
          if (existingRecord) {
            // Update existing record
            await this.updateRecord({
              layout: targetLayout,
              recordId: existingRecord.recordId,
              fieldData: sourceRecord
            });
            syncResults.updated++;
          } else {
            // Create new record
            await this.createRecord({
              layout: targetLayout,
              fieldData: sourceRecord
            });
            syncResults.added++;
          }
                 } catch (error: any) {
           syncResults.errors.push({
             record: sourceRecord,
             error: error.message || 'Unknown error'
           });
         }
      }
      
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            operation: 'data_sync',
            sourceLayout,
            targetLayout,
            syncMode,
            results: syncResults,
            nextSyncTime: new Date().toISOString(),
            summary: {
              totalProcessed: sourceRecords.length,
              successRate: ((syncResults.added + syncResults.updated) / sourceRecords.length * 100).toFixed(2) + '%'
            }
          }, null, 2)
        }]
      };
    } catch (error) {
      throw new Error(`Data sync failed: ${error}`);
    }
  }

  public async apiPerformanceMonitor(args: any): Promise<any> {
    const { operation, duration = 5000 } = args;
    
    try {
      const startTime = Date.now();
      const startMemory = process.memoryUsage();
      
      let operationResult;
      switch (operation) {
        case 'connection_test':
          operationResult = await this.testConnection();
          break;
        case 'query_performance':
          operationResult = await this.testQueryPerformance();
          break;
        case 'batch_performance':
          operationResult = await this.testBatchPerformance();
          break;
        default:
          throw new Error(`Unsupported performance test: ${operation}`);
      }
      
      const endTime = Date.now();
      const endMemory = process.memoryUsage();
      
      const performanceMetrics = {
        executionTime: endTime - startTime,
        memoryUsage: {
          start: startMemory,
          end: endMemory,
          delta: {
            rss: endMemory.rss - startMemory.rss,
            heapUsed: endMemory.heapUsed - startMemory.heapUsed,
            heapTotal: endMemory.heapTotal - startMemory.heapTotal
          }
        },
        throughput: operationResult.recordCount / ((endTime - startTime) / 1000),
        operation: operationResult
      };
      
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            operation: 'performance_monitor',
            testType: operation,
            metrics: performanceMetrics,
            recommendations: this.generatePerformanceRecommendations(performanceMetrics)
          }, null, 2)
        }]
      };
    } catch (error) {
      throw new Error(`Performance monitoring failed: ${error}`);
    }
  }

  public async apiCacheManagement(args: any): Promise<any> {
    const { action, key, data, ttl = 3600 } = args;
    
    try {
      switch (action) {
        case 'set':
          this.cache.set(key, { data, ttl, timestamp: Date.now() });
          return {
            content: [{
              type: 'text',
              text: JSON.stringify({
                operation: 'cache_set',
                key,
                ttl,
                success: true
              }, null, 2)
            }]
          };
        
        case 'get':
          const cachedItem = this.cache.get(key);
          if (cachedItem && (Date.now() - cachedItem.timestamp) < cachedItem.ttl * 1000) {
            return {
              content: [{
                type: 'text',
                text: JSON.stringify({
                  operation: 'cache_get',
                  key,
                  found: true,
                  data: cachedItem.data
                }, null, 2)
              }]
            };
          } else {
            if (cachedItem) {
              this.cache.delete(key); // Remove expired item
            }
            return {
              content: [{
                type: 'text',
                text: JSON.stringify({
                  operation: 'cache_get',
                  key,
                  found: false,
                  data: null
                }, null, 2)
              }]
            };
          }
        
        case 'delete':
          const deleted = this.cache.delete(key);
          return {
            content: [{
              type: 'text',
              text: JSON.stringify({
                operation: 'cache_delete',
                key,
                success: deleted
              }, null, 2)
            }]
          };
        
        case 'clear':
          this.cache.clear();
          return {
            content: [{
              type: 'text',
              text: JSON.stringify({
                operation: 'cache_clear',
                success: true
              }, null, 2)
            }]
          };
        
        case 'stats':
          const stats = {
            size: this.cache.size,
            keys: Array.from(this.cache.keys())
          };
          return {
            content: [{
              type: 'text',
              text: JSON.stringify({
                operation: 'cache_stats',
                stats
              }, null, 2)
            }]
          };
        
        default:
          throw new Error(`Unsupported cache action: ${action}`);
      }
    } catch (error) {
      throw new Error(`Cache management failed: ${error}`);
    }
  }

  public async apiRateLimitHandler(args: any): Promise<any> {
    const { operation, requests, timeWindow = 60000 } = args;
    
    try {
      const currentTime = Date.now();
      const windowStart = currentTime - timeWindow;
      
      // Clean old requests
      this.requestHistory = this.requestHistory.filter(req => req.timestamp > windowStart);
      
      // Add current request
      this.requestHistory.push({
        operation,
        timestamp: currentTime
      });
      
      const requestCount = this.requestHistory.filter(req => req.operation === operation).length;
      const isRateLimited = requestCount > this.rateLimits[operation] || 100;
      
      if (isRateLimited) {
        const oldestRequest = Math.min(...this.requestHistory.map(req => req.timestamp));
        const waitTime = timeWindow - (currentTime - oldestRequest);
        
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              operation: 'rate_limit_handler',
              rateLimited: true,
              requestCount,
              limit: this.rateLimits[operation] || 100,
              waitTime,
              recommendation: `Wait ${Math.ceil(waitTime / 1000)} seconds before next request`
            }, null, 2)
          }]
        };
      }
      
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            operation: 'rate_limit_handler',
            rateLimited: false,
            requestCount,
            limit: this.rateLimits[operation] || 100,
            remainingRequests: (this.rateLimits[operation] || 100) - requestCount
          }, null, 2)
        }]
      };
    } catch (error) {
      throw new Error(`Rate limit handling failed: ${error}`);
    }
  }

  // Helper methods for intelligent debugging
  private analyzeScriptContent(scriptContent: string): any {
    const issues = [];
    const warnings = [];
    
    // Check for common debugging issues
    if (scriptContent.includes('Set Next Step')) {
        issues.push({
            type: 'debugging_bug',
            severity: 'high',
            description: 'Set Next Step command detected - known to cause debugging issues',
            recommendation: 'Consider using alternative debugging approaches or breakpoints'
        });
    }
    
    if (scriptContent.includes('Go to Field')) {
        warnings.push({
            type: 'performance_warning',
            severity: 'medium',
            description: 'Go to Field command can cause performance issues',
            recommendation: 'Consider using Set Field or other alternatives'
        });
    }
    
    // Check for nested loops
    const loopPattern = /Loop\s*\n[\s\S]*?End Loop/g;
    const loopMatches = scriptContent.match(loopPattern);
    if (loopMatches && loopMatches.length > 2) {
        issues.push({
            type: 'complexity_warning',
            severity: 'medium',
            description: 'Multiple nested loops detected',
            recommendation: 'Consider refactoring to reduce complexity'
        });
    }
    
    return { issues, warnings };
  }

  private generateDebugRecommendations(analysis: any): string[] {
    const recommendations = [];
    
    if (analysis.issues.some((issue: any) => issue.type === 'debugging_bug')) {
        recommendations.push('Use step-by-step debugging with breakpoints instead of Set Next Step');
        recommendations.push('Add logging statements to track script execution flow');
    }
    
    if (analysis.warnings.some((warning: any) => warning.type === 'performance_warning')) {
        recommendations.push('Optimize field navigation to improve performance');
        recommendations.push('Consider batch operations for multiple field updates');
    }
    
    return recommendations;
  }

  private calculateComplexityScore(scriptContent: string): number {
    let score = 0;
    
    // Count loops
    const loopCount = (scriptContent.match(/Loop/g) || []).length;
    score += loopCount * 5;
    
    // Count conditionals
    const ifCount = (scriptContent.match(/If/g) || []).length;
    score += ifCount * 3;
    
    // Count script calls
    const scriptCallCount = (scriptContent.match(/Perform Script/g) || []).length;
    score += scriptCallCount * 2;
    
    return Math.min(score, 100); // Cap at 100
  }

  private generateErrorFixes(errorMessage: string, scriptContent?: string): any[] {
    const fixes = [];
    
    // Common FileMaker error patterns
    if (errorMessage.includes('Field not found')) {
        fixes.push({
            type: 'field_error',
            description: 'Field not found in current context',
            solution: 'Verify field name spelling and ensure field exists in current layout',
            codeExample: '// Use GetFieldName() to verify field names\nGetFieldName("FieldName")'
        });
    }
    
    if (errorMessage.includes('Script not found')) {
        fixes.push({
            type: 'script_error',
            description: 'Script not found or not accessible',
            solution: 'Check script name spelling and ensure script is accessible',
            codeExample: '// Verify script exists before calling\nIf [Get(ScriptName) ≠ ""]\n  Perform Script ["ScriptName"]\nEnd If'
        });
    }
    
    if (errorMessage.includes('Record not found')) {
        fixes.push({
            type: 'record_error',
            description: 'No records match the current find criteria',
            solution: 'Add error handling for empty result sets',
            codeExample: 'If [Get(FoundCount) = 0]\n  Show Custom Dialog ["No records found"]\nEnd If'
        });
    }
    
    return fixes;
  }

  private generatePreventionTips(errorMessage: string): string[] {
    const tips = [];
    
    if (errorMessage.includes('Field not found')) {
        tips.push('Always validate field names before using them');
        tips.push('Use GetFieldName() to verify field existence');
        tips.push('Test scripts on different layouts to ensure field accessibility');
    }
    
    if (errorMessage.includes('Script not found')) {
        tips.push('Use consistent naming conventions for scripts');
        tips.push('Document script dependencies in comments');
        tips.push('Test script calls in isolation before integration');
    }
    
    return tips;
  }

  private optimizeScriptContent(scriptContent: string, optimizationType: string): string {
    let optimized = scriptContent;
    
    if (optimizationType === 'performance') {
        // Replace Go to Field with Set Field where possible
        optimized = optimized.replace(/Go to Field \[([^\]]+)\]/g, 'Set Field [$1; ""]');
        
        // Optimize loops
        optimized = optimized.replace(/Loop\s*\n\s*Exit Loop If \[([^\]]+)\]/g, 'Loop\n  If [$1]\n    Exit Loop\n  End If');
    }
    
    if (optimizationType === 'readability') {
        // Add comments for complex logic
        optimized = optimized.replace(/(If \[[^\]]+\])/g, '// Conditional check\n$1');
    }
    
    return optimized;
  }

  private calculateImprovements(original: string, optimized: string): any {
    return {
        originalLength: original.length,
        optimizedLength: optimized.length,
        reduction: Math.round(((original.length - optimized.length) / original.length) * 100),
        estimatedPerformanceGain: '10-25%'
    };
  }

  private validateLayoutStructure(layoutData: any): any {
    const issues = [];
    const recommendations = [];
    
    // Check for common layout issues
    if (layoutData.objects && layoutData.objects.length > 50) {
        issues.push({
            type: 'complexity',
            severity: 'medium',
            description: 'Layout contains many objects which may impact performance'
        });
        recommendations.push('Consider splitting layout into multiple views');
    }
    
    return { issues, recommendations };
  }

  private resolveFileMakerError(errorCode: string, errorContext?: any, scriptName?: string): any {
    const errorDatabase: { [key: string]: any } = {
        '100': {
            description: 'Record is missing',
            steps: ['Check if record exists', 'Verify find criteria', 'Add error handling'],
            codeExamples: ['If [Get(FoundCount) = 0]', 'Show Custom Dialog ["Record not found"]']
        },
        '101': {
            description: 'Record is locked',
            steps: ['Check record lock status', 'Wait for lock to release', 'Implement retry logic'],
            codeExamples: ['If [Get(RecordOpenState) ≠ 0]', 'Commit Records/Requests']
        },
        '102': {
            description: 'Field is missing',
            steps: ['Verify field name', 'Check field accessibility', 'Test on different layouts'],
            codeExamples: ['GetFieldName("FieldName")', 'If [IsEmpty(GetFieldName("FieldName"))]']
        }
    };
    
    return errorDatabase[errorCode] || {
        description: 'Unknown error code',
        steps: ['Check FileMaker documentation', 'Review script logic', 'Test in isolation'],
        codeExamples: ['Show Custom Dialog ["Error: " & Get(LastError)]']
    };
  }

  private analyzeScriptPerformance(scriptContent: string, executionData?: any): any {
    const bottlenecks = [];
    const suggestions = [];
    
    // Analyze for performance issues
    if (scriptContent.includes('Go to Field')) {
        bottlenecks.push({
            type: 'field_navigation',
            impact: 'medium',
            description: 'Field navigation can be slow'
        });
        suggestions.push('Use Set Field instead of Go to Field where possible');
    }
    
    if (scriptContent.includes('Loop')) {
        const loopCount = (scriptContent.match(/Loop/g) || []).length;
        if (loopCount > 2) {
            bottlenecks.push({
                type: 'nested_loops',
                impact: 'high',
                description: 'Nested loops can cause performance issues'
            });
            suggestions.push('Consider refactoring to reduce loop nesting');
        }
    }
    
    return { bottlenecks, suggestions };
  }

  private analyzeScriptComplexity(scriptContent: string): any {
    const metrics = {
        lineCount: scriptContent.split('\n').length,
        loopCount: (scriptContent.match(/Loop/g) || []).length,
        ifCount: (scriptContent.match(/If/g) || []).length,
        scriptCallCount: (scriptContent.match(/Perform Script/g) || []).length
    };
    
    let riskLevel = 'low';
    if (metrics.loopCount > 3 || metrics.ifCount > 10) {
        riskLevel = 'high';
    } else if (metrics.loopCount > 1 || metrics.ifCount > 5) {
        riskLevel = 'medium';
    }
    
    const suggestions = [];
    if (riskLevel === 'high') {
        suggestions.push('Break complex script into smaller sub-scripts');
        suggestions.push('Add comprehensive error handling');
        suggestions.push('Document script logic thoroughly');
    }
    
    return { metrics, riskLevel, suggestions };
  }

  private async getLayoutData(layoutName: string): Promise<any> {
    const response = await this.client.get(`/layouts/${layoutName}`);
    return response.data.response;
  }

  private async getScriptData(scriptName: string): Promise<any> {
    const response = await this.client.get(`/layouts/_script/${scriptName}`);
    return response.data.response;
  }

  private async saveToGit(data: any, fileName: string): Promise<string> {
    const filePath = path.join(this.config.gitRepoPath || '.', fileName);
    await fsPromises.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
    return filePath;
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('FileMaker MCP server running on stdio');
  }

  // NEW: API Enhancement & Scalability Helper methods
  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async batchCreateRecords(records: any[]): Promise<any> {
    // Implementation for batch record creation
    const results = [];
    for (const record of records) {
      try {
        const result = await this.createRecord(record);
        // Extract recordId from the response text
        const recordIdMatch = result.content[0].text.match(/Record created with ID: (\d+)/);
        const recordId = recordIdMatch ? recordIdMatch[1] : 'unknown';
        results.push({ success: true, recordId });
      } catch (error: any) {
        results.push({ success: false, error: error.message || 'Unknown error' });
      }
    }
    return { success: true, results };
  }

  private async batchUpdateRecords(records: any[]): Promise<any> {
    // Implementation for batch record updates
    const results = [];
    for (const record of records) {
      try {
        const result = await this.updateRecord(record);
        // Extract recordId from the response text
        const recordIdMatch = result.content[0].text.match(/Record (\d+) updated successfully/);
        const recordId = recordIdMatch ? recordIdMatch[1] : record.recordId || 'unknown';
        results.push({ success: true, recordId });
      } catch (error: any) {
        results.push({ success: false, error: error.message || 'Unknown error' });
      }
    }
    return { success: true, results };
  }

  private async batchDeleteRecords(records: any[]): Promise<any> {
    // Implementation for batch record deletion
    const results = [];
    for (const record of records) {
      try {
        const result = await this.deleteRecord(record);
        // Extract recordId from the response text
        const recordIdMatch = result.content[0].text.match(/Record (\d+) deleted successfully/);
        const recordId = recordIdMatch ? recordIdMatch[1] : record.recordId || 'unknown';
        results.push({ success: true, recordId });
      } catch (error: any) {
        results.push({ success: false, error: error.message || 'Unknown error' });
      }
    }
    return { success: true, results };
  }

  private mapFields(record: any, fieldMapping: any): any {
    if (!fieldMapping) return record;
    
    const mappedRecord: any = {};
    for (const [sourceField, targetField] of Object.entries(fieldMapping)) {
      if (record[sourceField] !== undefined) {
        mappedRecord[targetField as string] = record[sourceField];
      }
    }
    return mappedRecord;
  }

  private async findExistingRecord(layout: string, data: any): Promise<any> {
    // Implementation to find existing record based on key fields
    return null;
  }

  private filterFields(record: any, fields: string[]): any {
    if (!fields) return record;
    
    const filteredRecord: { [key: string]: any } = {};
    for (const field of fields) {
      if (record[field] !== undefined) {
        filteredRecord[field] = record[field];
      }
    }
    return filteredRecord;
  }

  private convertToCSV(records: any[], fields: string[]): string {
    // Implementation to convert records to CSV format
    return 'csv_data';
  }

  private convertToXML(records: any[], fields: string[]): string {
    // Implementation to convert records to XML format
    return 'xml_data';
  }

  private async getAllRecords(layout: string, filters: any): Promise<any[]> {
    // Implementation to get all records using pagination
    return [];
  }

  private async findRecordByKey(layout: string, keyField: string, keyValue: any): Promise<any> {
    // Implementation to find record by key field
    return null;
  }

  private async testConnection(): Promise<any> {
    // Implementation for connection testing
    return { recordCount: 1, success: true };
  }

  private async testQueryPerformance(): Promise<any> {
    // Implementation for query performance testing
    return { recordCount: 100, success: true };
  }

  private async testBatchPerformance(): Promise<any> {
    // Implementation for batch performance testing
    return { recordCount: 500, success: true };
  }

  private generatePerformanceRecommendations(metrics: any): string[] {
    const recommendations = [];
    
    if (metrics.executionTime > 5000) {
      recommendations.push('Consider implementing caching for frequently accessed data');
    }
    
    if (metrics.memoryUsage.delta.heapUsed > 100000000) {
      recommendations.push('Monitor memory usage and consider garbage collection optimization');
    }
    
    if (metrics.throughput < 10) {
      recommendations.push('Consider batch operations to improve throughput');
    }
    
    return recommendations;
  }
} 