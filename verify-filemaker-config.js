#!/usr/bin/env node

import { spawn } from 'child_process';
import { existsSync } from 'fs';
import path from 'path';

// Configuration that Claude should use
const claudeConfig = {
  command: 'node',
  args: ['/Users/maxpetrusenko/Desktop/My Brand/filemaker-mcp-server/dist/index.js'],
  env: {
    FILEMAKER_HOST: 'https://terrace-fms-nyc.oditech.com',
    FILEMAKER_DATABASE: '22_0211',
    FILEMAKER_USERNAME: 'API',
    FILEMAKER_PASSWORD: 'terraceapi'
  }
};

console.log('🔍 Verifying FileMaker MCP Configuration...\n');

// Check if the file exists
const filePath = claudeConfig.args[0];
console.log('📁 Checking file path:', filePath);
console.log('✅ File exists:', existsSync(filePath));

// Check file permissions
try {
  const fs = await import('fs');
  const stats = fs.statSync(filePath);
  console.log('✅ File is executable:', (stats.mode & fs.constants.S_IXUSR) !== 0);
} catch (error) {
  console.log('❌ Error checking file permissions:', error.message);
}

// Check environment variables
console.log('\n🔧 Environment variables:');
Object.entries(claudeConfig.env).forEach(([key, value]) => {
  console.log(`  ${key}: ${value ? '✅ Set' : '❌ Not set'}`);
});

// Test the exact command Claude would run
console.log('\n🚀 Testing exact Claude command...');
console.log('Command:', claudeConfig.command);
console.log('Args:', claudeConfig.args);

const mcpServer = spawn(claudeConfig.command, claudeConfig.args, {
  env: { ...process.env, ...claudeConfig.env },
  stdio: ['pipe', 'pipe', 'pipe']
});

let serverStarted = false;
let serverError = false;

mcpServer.stdout.on('data', (data) => {
  console.log('📤 Server stdout:', data.toString().trim());
});

mcpServer.stderr.on('data', (data) => {
  const output = data.toString().trim();
  console.log('📝 Server stderr:', output);
  
  if (output.includes('FileMaker MCP server running on stdio')) {
    serverStarted = true;
    console.log('✅ Server started successfully!');
  }
  
  if (output.includes('Missing required config') || output.includes('error')) {
    serverError = true;
    console.log('❌ Server error detected');
  }
});

mcpServer.on('error', (error) => {
  console.error('❌ Spawn error:', error.message);
  serverError = true;
});

mcpServer.on('close', (code) => {
  console.log('Server closed with code:', code);
  if (code !== 0) {
    serverError = true;
  }
});

// Test MCP protocol
setTimeout(() => {
  if (serverStarted && !serverError) {
    console.log('\n🔗 Testing MCP protocol...');
    const initRequest = {
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: {
          name: 'Claude Desktop',
          version: '1.0.0'
        }
      }
    };
    
    mcpServer.stdin.write(JSON.stringify(initRequest) + '\n');
  } else {
    console.log('\n❌ Server failed to start properly');
  }
}, 2000);

// Cleanup
setTimeout(() => {
  console.log('\n🧹 Cleaning up...');
  mcpServer.kill();
  process.exit(0);
}, 8000); 