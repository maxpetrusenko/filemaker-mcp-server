#!/usr/bin/env node

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Test the MCP server with incorrect credentials
async function testMCPServerWithErrors() {
  console.log('🧪 Testing FileMaker MCP Server with Error Scenarios...\n');
  
  // Test 1: Wrong password
  console.log('🔴 Test 1: Wrong Password');
  await testWithCredentials(
    'https://secure.dreamsinfo.ca',
    'YYCDreamsTakeFlight.fmp12',
    'leramuradyan@gmail.com',
    'wrongpassword'
  );
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  // Test 2: Wrong username
  console.log('🔴 Test 2: Wrong Username');
  await testWithCredentials(
    'https://secure.dreamsinfo.ca',
    'YYCDreamsTakeFlight.fmp12',
    'wronguser@gmail.com',
    '123'
  );
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  // Test 3: Wrong hostname
  console.log('🔴 Test 3: Wrong Hostname');
  await testWithCredentials(
    'https://wrong-host.com',
    'YYCDreamsTakeFlight.fmp12',
    'leramuradyan@gmail.com',
    '123'
  );
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  // Test 4: Wrong database name
  console.log('🔴 Test 4: Wrong Database Name');
  await testWithCredentials(
    'https://secure.dreamsinfo.ca',
    'WrongDatabase.fmp12',
    'leramuradyan@gmail.com',
    '123'
  );
}

async function testWithCredentials(host, database, username, password) {
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

    server.stdin.write(JSON.stringify(testRequest) + '\n');
    
    // Wait a bit then close
    setTimeout(() => {
      server.kill();
    }, 5000);
  });
}

testMCPServerWithErrors().catch(console.error); 