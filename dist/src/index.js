#!/usr/bin/env node
import { FileMakerMCP } from './filemaker-mcp.js';
function parseArgs() {
    const args = process.argv.slice(2);
    const config = {};
    for (let i = 0; i < args.length; i++) {
        if (args[i] === '--host')
            config.host = args[++i];
        if (args[i] === '--database')
            config.database = args[++i];
        if (args[i] === '--username')
            config.username = args[++i];
        if (args[i] === '--password')
            config.password = args[++i];
        if (args[i] === '--git-repo-path')
            config.gitRepoPath = args[++i];
    }
    return config;
}
const envConfig = {
    host: process.env.FILEMAKER_HOST,
    database: process.env.FILEMAKER_DATABASE,
    username: process.env.FILEMAKER_USERNAME,
    password: process.env.FILEMAKER_PASSWORD,
    gitRepoPath: process.env.FILEMAKER_GIT_REPO_PATH,
};
const argConfig = parseArgs();
const config = {
    host: argConfig.host || envConfig.host || '',
    database: argConfig.database || envConfig.database || '',
    username: argConfig.username || envConfig.username || '',
    password: argConfig.password || envConfig.password || '',
    gitRepoPath: argConfig.gitRepoPath || envConfig.gitRepoPath,
};
if (!config.host || !config.database || !config.username || !config.password) {
    console.error('Missing required config. Provide via env or CLI args:');
    console.error('--host, --database, --username, --password');
    console.error('Optional: --git-repo-path for Git integration');
    process.exit(1);
}
const server = new FileMakerMCP(config);
server.run().catch((err) => {
    console.error('FileMaker MCP server error:', err);
    process.exit(1);
});
