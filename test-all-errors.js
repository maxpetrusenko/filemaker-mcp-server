#!/usr/bin/env node

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Test all types of authentication errors
async function testAllErrors() {
  console.log('🧪 Testing FileMaker MCP Server - All Error Scenarios...\n');
  
  const testCases = [
    {
      name: 'Wrong Password',
      host: 'https://secure.dreamsinfo.ca',
      database: 'YYCDreamsTakeFlight.fmp12',
      username: 'leramuradyan@gmail.com',
      password: 'wrongpassword'
    },
    {
      name: 'Wrong Username',
      host: 'https://secure.dreamsinfo.ca',
      database: 'YYCDreamsTakeFlight.fmp12',
      username: 'wronguser@gmail.com',
      password: '123'
    },
    {
      name: 'Wrong Hostname',
      host: 'https://wrong-host.com',
      database: 'YYCDreamsTakeFlight.fmp12',
      username: 'leramuradyan@gmail.com',
      password: '123'
    },
    {
      name: 'Wrong Database',
      host: 'https://secure.dreamsinfo.ca',
      database: 'WrongDatabase.fmp12',
      username: 'leramuradyan@gmail.com',
      password: '123'
    }
  ];

  for (const testCase of testCases) {
    console.log(`🔴 Test: ${testCase.name}`);
    console.log(`   Host: ${testCase.host}`);
    console.log(`   Database: ${testCase.database}`);
    console.log(`   Username: ${testCase.username}`);
    console.log(`   Password: ${testCase.password}`);
    
    await testFileMakerOperation(testCase);
    console.log('\n' + '='.repeat(60) + '\n');
  }
}

async function testFileMakerOperation(testCase) {
  return new Promise((resolve) => {
    const server = spawn('filemaker-mcp-server', [
      '--host', testCase.host,
      '--database', testCase.database,
      '--username', testCase.username,
      '--password', testCase.password
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

testAllErrors().catch(console.error); 