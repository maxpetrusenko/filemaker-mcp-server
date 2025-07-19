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
    private cache;
    private requestHistory;
    private rateLimits;
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
    debugAnalyzeScript(args: any): Promise<any>;
    debugSuggestFixes(args: any): Promise<any>;
    debugOptimizeScript(args: any): Promise<any>;
    debugValidateLayout(args: any): Promise<any>;
    debugErrorResolution(args: any): Promise<any>;
    debugPerformanceAnalysis(args: any): Promise<any>;
    debugScriptComplexity(args: any): Promise<any>;
    apiBatchOperations(args: any): Promise<any>;
    apiPaginatedQuery(args: any): Promise<any>;
    apiBulkImport(args: any): Promise<any>;
    apiBulkExport(args: any): Promise<any>;
    apiDataSync(args: any): Promise<any>;
    apiPerformanceMonitor(args: any): Promise<any>;
    apiCacheManagement(args: any): Promise<any>;
    apiRateLimitHandler(args: any): Promise<any>;
    private analyzeScriptContent;
    private generateDebugRecommendations;
    private calculateComplexityScore;
    private generateErrorFixes;
    private generatePreventionTips;
    private optimizeScriptContent;
    private calculateImprovements;
    private validateLayoutStructure;
    private resolveFileMakerError;
    private analyzeScriptPerformance;
    private analyzeScriptComplexity;
    private getLayoutData;
    private getScriptData;
    private saveToGit;
    run(): Promise<void>;
    private chunkArray;
    private delay;
    private batchCreateRecords;
    private batchUpdateRecords;
    private batchDeleteRecords;
    private mapFields;
    private findExistingRecord;
    private filterFields;
    private convertToCSV;
    private convertToXML;
    private getAllRecords;
    private findRecordByKey;
    private testConnection;
    private testQueryPerformance;
    private testBatchPerformance;
    private generatePerformanceRecommendations;
    listLayouts(): Promise<string[]>;
    listScripts(): Promise<string[]>;
    discoverHiddenScripts(): Promise<any>;
    getRecordCount(layout: string): Promise<number>;
    listValueLists(): Promise<Array<{
        name: string;
        items: string[];
    }>>;
    analyzePortalData(layout: string): Promise<any>;
    getFieldMetadata(layout: string): Promise<any>;
    searchAcrossFields(layout: string, searchText: string, fields?: string[]): Promise<any>;
    analyzePerformance(layout: string, operation?: string): Promise<any>;
    globalSearchFields(searchText: string, fieldType?: string): Promise<any>;
    globalSearchData(searchText: string, layouts?: string[], limit?: number): Promise<any>;
    exportDDR(format?: string, includeScripts?: boolean, includeLayouts?: boolean): Promise<any>;
    analyzeRelationships(layout: string, depth?: number): Promise<any>;
    private analyzeDDRRelationships;
    private cleanCircularReferences;
}
//# sourceMappingURL=filemaker-mcp.d.ts.map