#!/usr/bin/env node
import { FileMakerMCP } from './filemaker-mcp.js';
import * as fs from 'fs';
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
// DEBUG: Log the config
try {
    fs.writeFileSync('/tmp/filemaker-index-config.log', `Config: ${JSON.stringify(config)}`, 'utf8');
}
catch (e) {
    // Ignore log write errors
}
if (!config.host || !config.database || !config.username || !config.password) {
    console.error('Missing required config. Provide via env or CLI args:');
    console.error('--host, --database, --username, --password');
    console.error('Optional: --git-repo-path for Git integration');
    process.exit(1);
}
// DEBUG: Log that we're creating the server
try {
    fs.writeFileSync('/tmp/filemaker-index-server-creation.log', 'Creating FileMakerMCP server', 'utf8');
}
catch (e) {
    // Ignore log write errors
}
const server = new FileMakerMCP(config);
// DEBUG: Log that we're running the server
try {
    fs.writeFileSync('/tmp/filemaker-index-server-run.log', 'Running FileMakerMCP server', 'utf8');
}
catch (e) {
    // Ignore log write errors
}
server.run().catch((err) => {
    // DEBUG: Log any errors
    try {
        fs.writeFileSync('/tmp/filemaker-index-error.log', `Server error: ${err.message}`, 'utf8');
    }
    catch (e) {
        // Ignore log write errors
    }
    console.error('FileMaker MCP server error:', err);
    process.exit(1);
});
//# sourceMappingURL=index.js.map