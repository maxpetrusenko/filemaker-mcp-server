import { spawn } from 'child_process';

const env = {
  FILEMAKER_HOST: 'https://terrace-fms-nyc.oditech.com',
  FILEMAKER_DATABASE: '22_0211',
  FILEMAKER_USERNAME: 'API',
  FILEMAKER_PASSWORD: 'terraceapi'
};

console.log('Starting MCP server and testing first tool call...');
const mcpServer = spawn('npx', ['@maxpetrusenko/filemaker-mcp-server@latest'], {
  env: { ...process.env, ...env },
  stdio: ['pipe', 'pipe', 'pipe']
});

mcpServer.stdout.on('data', (data) => {
  console.log('Server stdout:', data.toString());
});

mcpServer.stderr.on('data', (data) => {
  console.log('Server stderr:', data.toString());
});

// Wait for server to start, then call a tool
setTimeout(() => {
  console.log('Calling fm_list_layouts tool...');
  const toolCall = {
    jsonrpc: '2.0',
    id: 2,
    method: 'tools/call',
    params: {
      name: 'fm_list_layouts',
      arguments: {}
    }
  };
  
  mcpServer.stdin.write(JSON.stringify(toolCall) + '\n');
}, 1000);

setTimeout(() => {
  console.log('Cleaning up...');
  mcpServer.kill();
  process.exit(0);
}, 8000); 