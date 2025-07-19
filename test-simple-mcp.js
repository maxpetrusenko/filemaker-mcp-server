#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { ListToolsRequestSchema, CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js';

console.error('Simple test MCP server starting...');

const server = new Server({
  name: 'test-mcp',
  version: '1.0.0',
});

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'test_hello',
        description: 'A simple test tool',
        inputSchema: {
          type: 'object',
          properties: {
            name: { type: 'string', description: 'Name to greet' }
          },
          required: ['name']
        }
      }
    ]
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name === 'test_hello') {
    const name = request.params.arguments?.name || 'World';
    return {
      content: [
        {
          type: 'text',
          text: `Hello, ${name}! This is a test MCP server.`
        }
      ]
    };
  }
  throw new Error(`Unknown tool: ${request.params.name}`);
});

async function run() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Simple test MCP server running on stdio');
}

run().catch((err) => {
  console.error('Test MCP server error:', err);
  process.exit(1);
}); 