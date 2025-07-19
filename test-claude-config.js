import { spawn } from 'child_process';

// Exact configuration that Claude should use
const claudeConfig = {
  command: 'npx',
  args: ['@maxpetrusenko/filemaker-mcp-server@latest'],
  env: {
    FILEMAKER_HOST: 'https://terrace-fms-nyc.oditech.com',
    FILEMAKER_DATABASE: '22_0211',
    FILEMAKER_USERNAME: 'API',
    FILEMAKER_PASSWORD: 'terraceapi'
  }
};

console.log('Testing Claude-style MCP connection...');
console.log('Command:', claudeConfig.command);
console.log('Args:', claudeConfig.args);
console.log('Environment variables:', Object.keys(claudeConfig.env));

const mcpServer = spawn(claudeConfig.command, claudeConfig.args, {
  env: { ...process.env, ...claudeConfig.env },
  stdio: ['pipe', 'pipe', 'pipe']
});

let serverReady = false;

mcpServer.stdout.on('data', (data) => {
  const output = data.toString();
  console.log('✅ Server stdout:', output);
  
  // Check if server is responding to MCP protocol
  if (output.includes('"jsonrpc"')) {
    serverReady = true;
    console.log('✅ MCP server is responding correctly!');
  }
});

mcpServer.stderr.on('data', (data) => {
  const output = data.toString();
  console.log('📝 Server stderr:', output);
  
  if (output.includes('FileMaker MCP server running on stdio')) {
    console.log('✅ Server started successfully!');
  }
});

mcpServer.on('error', (error) => {
  console.error('❌ Server error:', error);
});

mcpServer.on('close', (code) => {
  console.log('Server closed with code:', code);
});

// Test MCP protocol handshake
setTimeout(() => {
  if (!serverReady) {
    console.log('⚠️ Server not responding to MCP protocol');
  }
  
  console.log('Sending MCP initialization request...');
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
}, 2000);

// Cleanup
setTimeout(() => {
  console.log('Cleaning up...');
  mcpServer.kill();
  process.exit(0);
}, 10000); 