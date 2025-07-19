import { spawn } from 'child_process';

// Simulate Claude's connection to the MCP server
const env = {
  FILEMAKER_HOST: 'https://terrace-fms-nyc.oditech.com',
  FILEMAKER_DATABASE: '22_0211',
  FILEMAKER_USERNAME: 'API',
  FILEMAKER_PASSWORD: 'terraceapi'
};

console.log('Starting MCP server...');
const mcpServer = spawn('npx', ['@maxpetrusenko/filemaker-mcp-server@latest'], {
  env: { ...process.env, ...env },
  stdio: ['pipe', 'pipe', 'pipe']
});

// Listen for server output
mcpServer.stdout.on('data', (data) => {
  console.log('Server stdout:', data.toString());
});

mcpServer.stderr.on('data', (data) => {
  console.log('Server stderr:', data.toString());
});

mcpServer.on('error', (error) => {
  console.error('Server error:', error);
});

mcpServer.on('close', (code) => {
  console.log('Server closed with code:', code);
});

// Send a simple JSON-RPC request to test the connection
setTimeout(() => {
  console.log('Sending test request...');
  const testRequest = {
    jsonrpc: '2.0',
    id: 1,
    method: 'tools/list'
  };
  
  mcpServer.stdin.write(JSON.stringify(testRequest) + '\n');
}, 2000);

// Cleanup after 10 seconds
setTimeout(() => {
  console.log('Cleaning up...');
  mcpServer.kill();
  process.exit(0);
}, 10000); 