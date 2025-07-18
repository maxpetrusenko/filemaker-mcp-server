import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import axios, { AxiosInstance } from 'axios';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';

const execAsync = promisify(exec);

export interface FileMakerConfig {
  host: string;
  database: string;
  username: string;
  password: string;
  gitRepoPath?: string; // Path to Git repository for version control
}

export class FileMakerMCP {
  private server: Server;
  private client: AxiosInstance;
  private token?: string;
  private config: FileMakerConfig;

  constructor(config: FileMakerConfig) {
    this.config = config;
    this.server = new Server(
      {
        name: 'filemaker-mcp',
        version: '2.0.0', // Updated version for v2
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.client = axios.create({
      baseURL: `${config.host}/fmi/data/v1/databases/${config.database}`,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupHandlers();
  }

  private async authenticate(): Promise<string> {
    try {
      const response = await this.client.post('/sessions', {}, {
        auth: {
          username: this.config.username,
          password: this.config.password,
        },
      });
      this.token = response.data.response.token;
      if (!this.token) {
        throw new Error('No token received from FileMaker.');
      }
      this.client.defaults.headers['Authorization'] = `Bearer ${this.token}`;
      return this.token;
    } catch (error: any) {
      throw new Error(`FileMaker authentication failed: ${error}`);
    }
  }

  private setupHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          // Existing FileMaker CRUD tools
          {
            name: 'fm_find_records',
            description: 'Find records in a FileMaker layout',
            inputSchema: {
              type: 'object',
              properties: {
                layout: { type: 'string', description: 'Layout name' },
                query: {
                  type: 'object',
                  description: 'Find query object with field names and values',
                },
                limit: {
                  type: 'number',
                  description: 'Maximum number of records to return',
                  default: 100,
                },
                offset: {
                  type: 'number',
                  description: 'Record offset for pagination',
                  default: 1,
                },
              },
              required: ['layout'],
            },
          },
          {
            name: 'fm_create_record',
            description: 'Create a new record in FileMaker',
            inputSchema: {
              type: 'object',
              properties: {
                layout: { type: 'string', description: 'Layout name' },
                fieldData: {
                  type: 'object',
                  description: 'Field data for the new record',
                },
              },
              required: ['layout', 'fieldData'],
            },
          },
          {
            name: 'fm_update_record',
            description: 'Update an existing record in FileMaker',
            inputSchema: {
              type: 'object',
              properties: {
                layout: { type: 'string', description: 'Layout name' },
                recordId: { type: 'string', description: 'Record ID to update' },
                fieldData: {
                  type: 'object',
                  description: 'Field data to update',
                },
              },
              required: ['layout', 'recordId', 'fieldData'],
            },
          },
          {
            name: 'fm_delete_record',
            description: 'Delete a record from FileMaker',
            inputSchema: {
              type: 'object',
              properties: {
                layout: { type: 'string', description: 'Layout name' },
                recordId: { type: 'string', description: 'Record ID to delete' },
              },
              required: ['layout', 'recordId'],
            },
          },
          {
            name: 'fm_execute_script',
            description: 'Execute a FileMaker script',
            inputSchema: {
              type: 'object',
              properties: {
                script: { type: 'string', description: 'Script name' },
                parameter: {
                  type: 'string',
                  description: 'Script parameter (optional)',
                },
              },
              required: ['script'],
            },
          },
          {
            name: 'fm_get_layout_metadata',
            description: 'Get metadata for a FileMaker layout',
            inputSchema: {
              type: 'object',
              properties: {
                layout: { type: 'string', description: 'Layout name' },
              },
              required: ['layout'],
            },
          },
          // NEW: Git-based Version Control Tools
          {
            name: 'fm_git_export_layout',
            description: 'Export a FileMaker layout to XML/JSON and save to Git repository',
            inputSchema: {
              type: 'object',
              properties: {
                layout: { type: 'string', description: 'Layout name to export' },
                format: { 
                  type: 'string', 
                  description: 'Export format: xml or json',
                  enum: ['xml', 'json'],
                  default: 'xml'
                },
                gitMessage: { 
                  type: 'string', 
                  description: 'Git commit message for this export',
                  default: 'Export FileMaker layout'
                }
              },
              required: ['layout'],
            },
          },
          {
            name: 'fm_git_export_script',
            description: 'Export a FileMaker script to XML/JSON and save to Git repository',
            inputSchema: {
              type: 'object',
              properties: {
                script: { type: 'string', description: 'Script name to export' },
                format: { 
                  type: 'string', 
                  description: 'Export format: xml or json',
                  enum: ['xml', 'json'],
                  default: 'xml'
                },
                gitMessage: { 
                  type: 'string', 
                  description: 'Git commit message for this export',
                  default: 'Export FileMaker script'
                }
              },
              required: ['script'],
            },
          },
          {
            name: 'fm_git_commit_changes',
            description: 'Commit all changes in the Git repository',
            inputSchema: {
              type: 'object',
              properties: {
                message: { 
                  type: 'string', 
                  description: 'Commit message',
                  default: 'Update FileMaker components'
                },
                includeAll: {
                  type: 'boolean',
                  description: 'Include all changes (git add .)',
                  default: true
                }
              },
              required: ['message'],
            },
          },
          {
            name: 'fm_git_push_changes',
            description: 'Push committed changes to remote Git repository',
            inputSchema: {
              type: 'object',
              properties: {
                remote: { 
                  type: 'string', 
                  description: 'Remote name (e.g., origin)',
                  default: 'origin'
                },
                branch: { 
                  type: 'string', 
                  description: 'Branch name to push to',
                  default: 'main'
                }
              },
            },
          },
          {
            name: 'fm_git_pull_changes',
            description: 'Pull latest changes from remote Git repository',
            inputSchema: {
              type: 'object',
              properties: {
                remote: { 
                  type: 'string', 
                  description: 'Remote name (e.g., origin)',
                  default: 'origin'
                },
                branch: { 
                  type: 'string', 
                  description: 'Branch name to pull from',
                  default: 'main'
                }
              },
            },
          },
          {
            name: 'fm_git_status',
            description: 'Get Git repository status and show changes',
            inputSchema: {
              type: 'object',
              properties: {
                showStaged: {
                  type: 'boolean',
                  description: 'Show staged changes',
                  default: true
                },
                showUnstaged: {
                  type: 'boolean',
                  description: 'Show unstaged changes',
                  default: true
                }
              },
            },
          },
          {
            name: 'fm_git_diff',
            description: 'Show differences between working directory and last commit',
            inputSchema: {
              type: 'object',
              properties: {
                file: { 
                  type: 'string', 
                  description: 'Specific file to show diff for (optional)'
                },
                staged: {
                  type: 'boolean',
                  description: 'Show staged changes diff',
                  default: false
                }
              },
            },
          },
        ],
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request: any) => {
      const { name, arguments: args } = request.params;
      try {
        if (!this.token) {
          await this.authenticate();
        }
        switch (name) {
          // Existing FileMaker CRUD operations
          case 'fm_find_records':
            return await this.findRecords(args);
          case 'fm_create_record':
            return await this.createRecord(args);
          case 'fm_update_record':
            return await this.updateRecord(args);
          case 'fm_delete_record':
            return await this.deleteRecord(args);
          case 'fm_execute_script':
            return await this.executeScript(args);
          case 'fm_get_layout_metadata':
            return await this.getLayoutMetadata(args);
          // NEW: Git-based Version Control operations
          case 'fm_git_export_layout':
            return await this.gitExportLayout(args);
          case 'fm_git_export_script':
            return await this.gitExportScript(args);
          case 'fm_git_commit_changes':
            return await this.gitCommitChanges(args);
          case 'fm_git_push_changes':
            return await this.gitPushChanges(args);
          case 'fm_git_pull_changes':
            return await this.gitPullChanges(args);
          case 'fm_git_status':
            return await this.gitStatus(args);
          case 'fm_git_diff':
            return await this.gitDiff(args);
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error: any) {
        if (error.response?.status === 401) {
          await this.authenticate();
          // Re-run the handler logic after re-authentication
          switch (name) {
            case 'fm_find_records':
              return await this.findRecords(args);
            case 'fm_create_record':
              return await this.createRecord(args);
            case 'fm_update_record':
              return await this.updateRecord(args);
            case 'fm_delete_record':
              return await this.deleteRecord(args);
            case 'fm_execute_script':
              return await this.executeScript(args);
            case 'fm_get_layout_metadata':
              return await this.getLayoutMetadata(args);
            case 'fm_git_export_layout':
              return await this.gitExportLayout(args);
            case 'fm_git_export_script':
              return await this.gitExportScript(args);
            case 'fm_git_commit_changes':
              return await this.gitCommitChanges(args);
            case 'fm_git_push_changes':
              return await this.gitPushChanges(args);
            case 'fm_git_pull_changes':
              return await this.gitPullChanges(args);
            case 'fm_git_status':
              return await this.gitStatus(args);
            case 'fm_git_diff':
              return await this.gitDiff(args);
            default:
              throw new Error(`Unknown tool: ${name}`);
          }
        }
        throw error;
      }
    });
  }

  async findRecords(args: any) {
    const { layout, query = {}, limit = 100, offset = 1 } = args;
    const findRequest = {
      query: Object.keys(query).length > 0 ? [query] : [],
      limit,
      offset,
    };

    const response = await this.client.post(`/layouts/${layout}/_find`, findRequest);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(response.data.response.data, null, 2),
        },
      ],
    };
  }

  async createRecord(args: any) {
    const { layout, fieldData } = args;
    const response = await this.client.post(`/layouts/${layout}/records`, {
      fieldData,
    });
    return {
      content: [
        {
          type: 'text',
          text: `Record created with ID: ${response.data.response.recordId}`,
        },
      ],
    };
  }

  async updateRecord(args: any) {
    const { layout, recordId, fieldData } = args;
    await this.client.patch(`/layouts/${layout}/records/${recordId}`, {
      fieldData,
    });
    return {
      content: [
        {
          type: 'text',
          text: `Record ${recordId} updated successfully.`,
        },
      ],
    };
  }

  async deleteRecord(args: any) {
    const { layout, recordId } = args;
    await this.client.delete(`/layouts/${layout}/records/${recordId}`);
    return {
      content: [
        {
          type: 'text',
          text: `Record ${recordId} deleted successfully.`,
        },
      ],
    };
  }

  async executeScript(args: any) {
    const { script, parameter } = args;
    const scriptRequest: any = { script };
    if (parameter) {
      scriptRequest.scriptParam = parameter;
    }
    const response = await this.client.post('/scripts', scriptRequest);
    return {
      content: [
        {
          type: 'text',
          text: `Script ${script} executed successfully. Result: ${JSON.stringify(response.data.response)}`,
        },
      ],
    };
  }

  async getLayoutMetadata(args: any) {
    const { layout } = args;
    const response = await this.client.get(`/layouts/${layout}`);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(response.data.response, null, 2),
        },
      ],
    };
  }

  async gitExportLayout(args: any) {
    const { layout, format = 'xml', gitMessage = 'Export FileMaker layout' } = args;
    const layoutData = await this.getLayoutData(layout);
    const filePath = await this.saveToGit(layoutData, `${layout}.${format}`);
    return {
      content: [
        {
          type: 'text',
          text: `Layout ${layout} exported to ${filePath} and committed.`,
        },
      ],
    };
  }

  async gitExportScript(args: any) {
    const { script, format = 'xml', gitMessage = 'Export FileMaker script' } = args;
    const scriptData = await this.getScriptData(script);
    const filePath = await this.saveToGit(scriptData, `${script}.${format}`);
    return {
      content: [
        {
          type: 'text',
          text: `Script ${script} exported to ${filePath} and committed.`,
        },
      ],
    };
  }

  async gitCommitChanges(args: any) {
    const { message, includeAll = true } = args;
    const gitAddCommand = includeAll ? 'git add .' : '';
    const gitCommitCommand = `git commit -m "${message}"`;

    if (gitAddCommand) {
      await execAsync(gitAddCommand);
    }
    await execAsync(gitCommitCommand);
    return {
      content: [
        {
          type: 'text',
          text: `Changes committed to Git repository.`,
        },
      ],
    };
  }

  async gitPushChanges(args: any) {
    const { remote = 'origin', branch = 'main' } = args;
    const gitPushCommand = `git push ${remote} ${branch}`;
    await execAsync(gitPushCommand);
    return {
      content: [
        {
          type: 'text',
          text: `Changes pushed to ${remote}/${branch}.`,
        },
      ],
    };
  }

  async gitPullChanges(args: any) {
    const { remote = 'origin', branch = 'main' } = args;
    const gitPullCommand = `git pull ${remote} ${branch}`;
    await execAsync(gitPullCommand);
    return {
      content: [
        {
          type: 'text',
          text: `Changes pulled from ${remote}/${branch}.`,
        },
      ],
    };
  }

  async gitStatus(args: any) {
    const { showStaged = true, showUnstaged = true } = args;
    const gitStatusCommand = `git status --short`;
    const { stdout, stderr } = await execAsync(gitStatusCommand);
    if (stderr) {
      throw new Error(`Error getting Git status: ${stderr}`);
    }
    const statusOutput = stdout.trim();
    const lines = statusOutput.split('\n');
    const changes: string[] = [];

    for (const line of lines) {
      if (showStaged && line.startsWith('A ')) {
        changes.push(`Staged: ${line.substring(2)}`);
      } else if (showUnstaged && line.startsWith('M ')) {
        changes.push(`Unstaged: ${line.substring(2)}`);
      } else if (showUnstaged && line.startsWith('D ')) {
        changes.push(`Deleted: ${line.substring(2)}`);
      }
    }

    return {
      content: [
        {
          type: 'text',
          text: changes.join('\n'),
        },
      ],
    };
  }

  async gitDiff(args: any) {
    const { file, staged = false } = args;
    let gitDiffCommand = staged ? 'git diff --cached' : 'git diff';
    if (file) {
      gitDiffCommand += ` ${file}`;
    }
    const { stdout, stderr } = await execAsync(gitDiffCommand);
    if (stderr) {
      throw new Error(`Error getting Git diff: ${stderr}`);
    }
    return {
      content: [
        {
          type: 'text',
          text: stdout,
        },
      ],
    };
  }

  private async getLayoutData(layoutName: string): Promise<any> {
    const response = await this.client.get(`/layouts/${layoutName}`);
    return response.data.response;
  }

  private async getScriptData(scriptName: string): Promise<any> {
    const response = await this.client.get(`/layouts/_script/${scriptName}`);
    return response.data.response;
  }

  private async saveToGit(data: any, fileName: string): Promise<string> {
    const filePath = path.join(this.config.gitRepoPath || '.', fileName);
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
    return filePath;
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('FileMaker MCP server running on stdio');
  }
} 