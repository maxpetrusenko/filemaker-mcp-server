#!/usr/bin/env node

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Test the MCP server
async function testMCPServer() {
  console.log('🧪 Testing FileMaker MCP Server...\n');
  
  const server = spawn('filemaker-mcp-server', [
    '--host', 'https://secure.dreamsinfo.ca',
    '--database', 'YYCDreamsTakeFlight.fmp12',
    '--username', 'leramuradyan@gmail.com',
    '--password', '123'
  ], {
    stdio: ['pipe', 'pipe', 'pipe']
  });

  // Send a test MCP request
  const testRequest = {
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: {
      protocolVersion: '2024-11-05',
      capabilities: {
        tools: {}
      },
      clientInfo: {
        name: 'test-client',
        version: '1.0.0'
      }
    }
  };

  server.stdout.on('data', (data) => {
    console.log('✅ Server Response:', data.toString());
  });

  server.stderr.on('data', (data) => {
    console.log('⚠️  Server Error:', data.toString());
  });

  server.on('close', (code) => {
    console.log(`\n🔚 Server exited with code ${code}`);
  });

  // Send the test request
  server.stdin.write(JSON.stringify(testRequest) + '\n');
  
  // Wait a bit then close
  setTimeout(() => {
    server.kill();
  }, 3000);
}

testMCPServer().catch(console.error); 