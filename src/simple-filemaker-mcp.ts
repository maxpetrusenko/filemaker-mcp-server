#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import axios, { AxiosInstance } from 'axios';

interface FileMakerConfig {
  host: string;
  database: string;
  username: string;
  password: string;
}

class SimpleFileMakerMCP {
  private server: Server;
  private client: AxiosInstance;
  private token?: string;
  private config: FileMakerConfig;

  constructor(config: FileMakerConfig) {
    this.config = config;
    
    this.server = new Server({
      name: 'filemaker-mcp',
      version: '1.0.0',
      capabilities: {
        tools: {},
      },
    });
    
    this.client = axios.create({
      baseURL: `${config.host}/fmi/data/v1/databases/${config.database}`,
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    this.setupHandlers();
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
      throw new Error(`Authentication failed: ${error.message}`);
    }
  }

  private setupHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
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
        ],
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      
      try {
        if (!this.token) {
          await this.authenticate();
        }
        
        let result;
        switch (name) {
          case 'fm_find_records':
            result = await this.findRecords(args);
            break;
          case 'fm_api_paginated_query':
            result = await this.paginatedQuery(args);
            break;
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
        
        return result;
      } catch (error: any) {
        throw new Error(`Tool execution failed: ${error.message}`);
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

  async paginatedQuery(args: any) {
    const { layout, query = {}, page = 1, pageSize = 100, sort = [], fields = [] } = args;
    const offset = (page - 1) * pageSize;
    
    const findRequest = {
      query: Object.keys(query).length > 0 ? [query] : [],
      limit: pageSize,
      offset,
    };

    const response = await this.client.post(`/layouts/${layout}/_find`, findRequest);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            page,
            pageSize,
            totalRecords: response.data.response.dataInfo.foundCount,
            records: response.data.response.data,
          }, null, 2),
        },
      ],
    };
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Simple FileMaker MCP server running on stdio');
  }
}

// Parse command line arguments
function parseArgs(): Partial<FileMakerConfig> {
  const args = process.argv.slice(2);
  const config: Partial<FileMakerConfig> = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--host') config.host = args[++i];
    if (args[i] === '--database') config.database = args[++i];
    if (args[i] === '--username') config.username = args[++i];
    if (args[i] === '--password') config.password = args[++i];
  }
  return config;
}

const config: FileMakerConfig = {
  host: process.env.FILEMAKER_HOST || '',
  database: process.env.FILEMAKER_DATABASE || '',
  username: process.env.FILEMAKER_USERNAME || '',
  password: process.env.FILEMAKER_PASSWORD || '',
  ...parseArgs(),
};

if (!config.host || !config.database || !config.username || !config.password) {
  console.error('Missing required config. Provide via env or CLI args:');
  console.error('--host, --database, --username, --password');
  process.exit(1);
}

const server = new SimpleFileMakerMCP(config);

server.run().catch((err) => {
  console.error('Simple FileMaker MCP server error:', err);
  process.exit(1);
}); 