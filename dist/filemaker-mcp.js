import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema, } from '@modelcontextprotocol/sdk/types.js';
import axios from 'axios';
export class FileMakerMCP {
    server;
    client;
    token;
    config;
    constructor(config) {
        this.config = config;
        this.server = new Server({
            name: 'filemaker-mcp',
            version: '1.0.0',
        }, {
            capabilities: {
                tools: {},
            },
        });
        this.client = axios.create({
            baseURL: `${config.host}/fmi/data/v1/databases/${config.database}`,
            headers: {
                'Content-Type': 'application/json',
            },
        });
        this.setupHandlers();
    }
    async authenticate() {
        try {
            const response = await this.client.post('/sessions', {}, {
                auth: {
                    username: this.config.username,
                    password: this.config.password,
                },
            });
            this.token = response.data.response.token;
            this.client.defaults.headers['Authorization'] = `Bearer ${this.token}`;
            return this.token;
        }
        catch (error) {
            throw new Error(`FileMaker authentication failed: ${error}`);
        }
    }
    setupHandlers() {
        this.server.setRequestHandler(ListToolsRequestSchema, async () => {
            return {
                tools: [
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
                ],
            };
        });
        this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
            const { name, arguments: args } = request.params;
            try {
                if (!this.token) {
                    await this.authenticate();
                }
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
                    default:
                        throw new Error(`Unknown tool: ${name}`);
                }
            }
            catch (error) {
                if (error.response?.status === 401) {
                    await this.authenticate();
                    return this.server.requestHandler(CallToolRequestSchema)(request);
                }
                throw error;
            }
        });
    }
    async findRecords(args) {
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
                    text: JSON.stringify({
                        foundCount: response.data.response.dataInfo.foundCount,
                        returnedCount: response.data.response.dataInfo.returnedCount,
                        records: response.data.response.data,
                    }, null, 2),
                },
            ],
        };
    }
    async createRecord(args) {
        const { layout, fieldData } = args;
        const response = await this.client.post(`/layouts/${layout}/records`, { fieldData });
        return {
            content: [
                {
                    type: 'text',
                    text: `Record created successfully. Record ID: ${response.data.response.recordId}`,
                },
            ],
        };
    }
    async updateRecord(args) {
        const { layout, recordId, fieldData } = args;
        await this.client.patch(`/layouts/${layout}/records/${recordId}`, { fieldData });
        return {
            content: [
                {
                    type: 'text',
                    text: `Record ${recordId} updated successfully.`,
                },
            ],
        };
    }
    async deleteRecord(args) {
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
    async executeScript(args) {
        const { script, parameter } = args;
        const response = await this.client.patch(`/layouts/_script/${script}`, {
            script: {
                parameter: parameter || '',
            },
        });
        return {
            content: [
                {
                    type: 'text',
                    text: `Script executed. Result: ${response.data.response.scriptResult || 'No result'}`,
                },
            ],
        };
    }
    async getLayoutMetadata(args) {
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
    async run() {
        const transport = new StdioServerTransport();
        await this.server.connect(transport);
        console.error('FileMaker MCP server running on stdio');
    }
}
