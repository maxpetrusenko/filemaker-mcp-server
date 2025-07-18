#!/usr/bin/env node

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Test the MCP server with incorrect credentials and actual FileMaker operations
async function testFileMakerErrors() {
  console.log('🧪 Testing FileMaker MCP Server with Authentication Errors...\n');
  
  // Test with wrong password
  console.log('🔴 Test: Wrong Password - Trying to find records');
  await testFileMakerOperation(
    'https://secure.dreamsinfo.ca',
    'YYCDreamsTakeFlight.fmp12',
    'leramuradyan@gmail.com',
    'wrongpassword',
    'findRecords'
  );
}

async function testFileMakerOperation(host, database, username, password, operation) {
  return new Promise((resolve) => {
    const server = spawn('filemaker-mcp-server', [
      '--host', host,
      '--database', database,
      '--username', username,
      '--password', password
    ], {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let stdoutData = '';
    let stderrData = '';

    server.stdout.on('data', (data) => {
      stdoutData += data.toString();
      console.log('✅ Server Response:', data.toString());
    });

    server.stderr.on('data', (data) => {
      stderrData += data.toString();
      console.log('⚠️  Server Error:', data.toString());
    });

    server.on('close', (code) => {
      console.log(`🔚 Server exited with code ${code}`);
      console.log(`📊 Summary:`);
      console.log(`   - Exit code: ${code}`);
      console.log(`   - Stdout length: ${stdoutData.length}`);
      console.log(`   - Stderr length: ${stderrData.length}`);
      resolve();
    });

    // Step 1: Initialize MCP
    const initRequest = {
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

    // Step 2: Try to find records (this should trigger FileMaker authentication)
    const findRecordsRequest = {
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/call',
      params: {
        name: 'findRecords',
        arguments: {
          layout: 'Contacts',
          filters: {}
        }
      }
    };

    // Send initialization
    server.stdin.write(JSON.stringify(initRequest) + '\n');
    
    // Wait a bit then try to find records
    setTimeout(() => {
      server.stdin.write(JSON.stringify(findRecordsRequest) + '\n');
    }, 1000);
    
    // Wait a bit then close
    setTimeout(() => {
      server.kill();
    }, 8000);
  });
}

testFileMakerErrors().catch(console.error); 