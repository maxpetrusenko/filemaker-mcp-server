export interface FileMakerConfig {
    host: string;
    database: string;
    username: string;
    password: string;
}
export declare class FileMakerMCP {
    private server;
    private client;
    private token?;
    private config;
    constructor(config: FileMakerConfig);
    private authenticate;
    private setupHandlers;
    findRecords(args: any): Promise<{
        content: {
            type: string;
            text: string;
        }[];
    }>;
    createRecord(args: any): Promise<{
        content: {
            type: string;
            text: string;
        }[];
    }>;
    updateRecord(args: any): Promise<{
        content: {
            type: string;
            text: string;
        }[];
    }>;
    deleteRecord(args: any): Promise<{
        content: {
            type: string;
            text: string;
        }[];
    }>;
    executeScript(args: any): Promise<{
        content: {
            type: string;
            text: string;
        }[];
    }>;
    getLayoutMetadata(args: any): Promise<{
        content: {
            type: string;
            text: string;
        }[];
    }>;
    run(): Promise<void>;
}
