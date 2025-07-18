#!/usr/bin/env node

import { FileMakerMCP, FileMakerConfig } from './filemaker-mcp.js';

function parseArgs(): Partial<FileMakerConfig> {
  const args = process.argv.slice(2);
  const config: Partial<FileMakerConfig> = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--host') config.host = args[++i];
    if (args[i] === '--database') config.database = args[++i];
    if (args[i] === '--username') config.username = args[++i];
    if (args[i] === '--password') config.password = args[++i];
  }
  return config;
}

const envConfig: Partial<FileMakerConfig> = {
  host: process.env.FILEMAKER_HOST,
  database: process.env.FILEMAKER_DATABASE,
  username: process.env.FILEMAKER_USERNAME,
  password: process.env.FILEMAKER_PASSWORD,
};

const argConfig = parseArgs();
const config: FileMakerConfig = {
  host: argConfig.host || envConfig.host || '',
  database: argConfig.database || envConfig.database || '',
  username: argConfig.username || envConfig.username || '',
  password: argConfig.password || envConfig.password || '',
};

if (!config.host || !config.database || !config.username || !config.password) {
  console.error('Missing required config. Provide via env or CLI args:');
  console.error('--host, --database, --username, --password');
  process.exit(1);
}

const server = new FileMakerMCP(config);
server.run().catch((err) => {
  console.error('FileMaker MCP server error:', err);
  process.exit(1);
}); 