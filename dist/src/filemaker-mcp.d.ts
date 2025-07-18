export interface FileMakerConfig {
    host: string;
    database: string;
    username: string;
    password: string;
    gitRepoPath?: string;
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
    gitExportLayout(args: any): Promise<{
        content: {
            type: string;
            text: string;
        }[];
    }>;
    gitExportScript(args: any): Promise<{
        content: {
            type: string;
            text: string;
        }[];
    }>;
    gitCommitChanges(args: any): Promise<{
        content: {
            type: string;
            text: string;
        }[];
    }>;
    gitPushChanges(args: any): Promise<{
        content: {
            type: string;
            text: string;
        }[];
    }>;
    gitPullChanges(args: any): Promise<{
        content: {
            type: string;
            text: string;
        }[];
    }>;
    gitStatus(args: any): Promise<{
        content: {
            type: string;
            text: string;
        }[];
    }>;
    gitDiff(args: any): Promise<{
        content: {
            type: string;
            text: string;
        }[];
    }>;
    private getLayoutData;
    private getScriptData;
    private saveToGit;
    run(): Promise<void>;
}
