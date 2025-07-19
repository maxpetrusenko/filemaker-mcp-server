#!/usr/bin/env node

import { spawn } from 'child_process';
import { writeFileSync, appendFileSync } from 'fs';

const logFile = '/tmp/filemaker-mcp-monitor.log';

// Clear previous log
writeFileSync(logFile, `=== FileMaker MCP Monitor Started: ${new Date().toISOString()} ===\n`);

const log = (message) => {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  console.log(logMessage.trim());
  appendFileSync(logFile, logMessage);
};

log('Starting FileMaker MCP server with detailed monitoring...');

const env = {
  FILEMAKER_HOST: 'https://terrace-fms-nyc.oditech.com',
  FILEMAKER_DATABASE: '22_0211',
  FILEMAKER_USERNAME: 'API',
  FILEMAKER_PASSWORD: 'terraceapi',
  DEBUG: 'true'
};

const mcpServer = spawn('node', ['dist/index.js'], {
  env: { ...process.env, ...env },
  stdio: ['pipe', 'pipe', 'pipe']
});

log('MCP server process started');

mcpServer.stdout.on('data', (data) => {
  const output = data.toString();
  log(`STDOUT: ${output.trim()}`);
});

mcpServer.stderr.on('data', (data) => {
  const output = data.toString();
  log(`STDERR: ${output.trim()}`);
});

mcpServer.on('error', (error) => {
  log(`ERROR: ${error.message}`);
});

mcpServer.on('close', (code) => {
  log(`MCP server closed with code: ${code}`);
});

mcpServer.on('exit', (code) => {
  log(`MCP server exited with code: ${code}`);
});

// Keep the script running
process.on('SIGINT', () => {
  log('Received SIGINT, shutting down...');
  mcpServer.kill();
  process.exit(0);
});

log('Monitor running. Press Ctrl+C to stop.');
log('Log file: ' + logFile); 