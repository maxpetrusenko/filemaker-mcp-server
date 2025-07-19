#!/usr/bin/env node

import { spawn } from 'child_process';

console.log('Testing Notion-style FileMaker MCP connection...');

// Using the same pattern as Notion MCP server
const mcpServer = spawn('npx', [
  '-y',
  '@maxpetrusenko/filemaker-mcp-server@latest'
], {
  env: {
    ...process.env,
    FILEMAKER_HOST: 'https://terrace-fms-nyc.oditech.com',
    FILEMAKER_DATABASE: '22_0211',
    FILEMAKER_USERNAME: 'API',
    FILEMAKER_PASSWORD: 'terraceapi'
  },
  stdio: ['pipe', 'pipe', 'pipe']
});

mcpServer.stdout.on('data', (data) => {
  console.log('STDOUT:', data.toString());
});

mcpServer.stderr.on('data', (data) => {
  console.log('STDERR:', data.toString());
});

mcpServer.on('error', (error) => {
  console.error('ERROR:', error);
});

mcpServer.on('close', (code) => {
  console.log('Server closed with code:', code);
});

// Test MCP initialization
setTimeout(() => {
  console.log('Sending MCP initialization...');
  const initRequest = {
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: {
        name: 'test-client',
        version: '1.0.0'
      }
    }
  };
  
  mcpServer.stdin.write(JSON.stringify(initRequest) + '\n');
}, 1000); 