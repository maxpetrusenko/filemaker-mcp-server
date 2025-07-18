import { FileMakerMCP } from '../src/filemaker-mcp';
import nock from 'nock';
import { exec } from 'child_process';
import * as fs from 'fs/promises';
// Mock child_process.exec and fs
jest.mock('child_process');
jest.mock('fs/promises');
const mockExec = exec;
const mockFs = fs;
describe('FileMakerMCP E2E', () => {
    const config = {
        host: 'https://test-server.com',
        database: 'TestDB',
        username: 'testuser',
        password: 'testpass',
        gitRepoPath: '/tmp/test-repo',
    };
    let fmMCP;
    beforeEach(() => {
        fmMCP = new FileMakerMCP(config);
        nock.cleanAll();
        jest.clearAllMocks();
        // Mock fs.writeFile to succeed
        mockFs.writeFile.mockResolvedValue(undefined);
    });
    afterEach(() => {
        nock.cleanAll();
    });
    it('authenticates and finds records', async () => {
        nock(config.host)
            .post(`/fmi/data/v1/databases/${config.database}/sessions`)
            .reply(200, { response: { token: 'mock-token' }, messages: [{ code: '0', message: 'OK' }] });
        nock(config.host)
            .post(`/fmi/data/v1/databases/${config.database}/layouts/Contacts/_find`)
            .reply(200, {
            response: {
                dataInfo: { foundCount: 1, returnedCount: 1 },
                data: [{ fieldData: { Name: 'John' }, recordId: '1' }],
            },
            messages: [{ code: '0', message: 'OK' }],
        });
        const result = await fmMCP.findRecords({ layout: 'Contacts', query: { Name: 'John' } });
        expect(result.content[0].text).toContain('John');
        expect(result.content[0].text).toContain('recordId');
    });
    it('creates a record', async () => {
        nock(config.host)
            .post(`/fmi/data/v1/databases/${config.database}/sessions`)
            .reply(200, { response: { token: 'mock-token' }, messages: [{ code: '0', message: 'OK' }] });
        nock(config.host)
            .post(`/fmi/data/v1/databases/${config.database}/layouts/Contacts/records`)
            .reply(200, { response: { recordId: '123' }, messages: [{ code: '0', message: 'OK' }] });
        const result = await fmMCP.createRecord({ layout: 'Contacts', fieldData: { Name: 'Jane' } });
        expect(result.content[0].text).toContain('Record created with ID');
        expect(result.content[0].text).toContain('123');
    });
    it('updates a record', async () => {
        nock(config.host)
            .post(`/fmi/data/v1/databases/${config.database}/sessions`)
            .reply(200, { response: { token: 'mock-token' }, messages: [{ code: '0', message: 'OK' }] });
        nock(config.host)
            .patch(`/fmi/data/v1/databases/${config.database}/layouts/Contacts/records/123`)
            .reply(200, { response: {}, messages: [{ code: '0', message: 'OK' }] });
        const result = await fmMCP.updateRecord({ layout: 'Contacts', recordId: '123', fieldData: { Name: 'Jane Updated' } });
        expect(result.content[0].text).toContain('updated successfully');
    });
    it('deletes a record', async () => {
        nock(config.host)
            .post(`/fmi/data/v1/databases/${config.database}/sessions`)
            .reply(200, { response: { token: 'mock-token' }, messages: [{ code: '0', message: 'OK' }] });
        nock(config.host)
            .delete(`/fmi/data/v1/databases/${config.database}/layouts/Contacts/records/123`)
            .reply(200, { response: {}, messages: [{ code: '0', message: 'OK' }] });
        const result = await fmMCP.deleteRecord({ layout: 'Contacts', recordId: '123' });
        expect(result.content[0].text).toContain('deleted successfully');
    });
    // NEW: Git Integration Tests
    describe('Git Integration', () => {
        beforeEach(() => {
            // Mock successful Git operations
            mockExec.mockImplementation((command, callback) => {
                if (command.includes('git add')) {
                    callback(null, { stdout: '', stderr: '' });
                }
                else if (command.includes('git commit')) {
                    callback(null, { stdout: '[main abc1234] Test commit', stderr: '' });
                }
                else if (command.includes('git push')) {
                    callback(null, { stdout: 'To origin/main', stderr: '' });
                }
                else if (command.includes('git pull')) {
                    callback(null, { stdout: 'Already up to date', stderr: '' });
                }
                else if (command.includes('git status')) {
                    callback(null, { stdout: 'M  Contacts.xml\nA  Script.xml', stderr: '' });
                }
                else if (command.includes('git diff')) {
                    callback(null, { stdout: '@@ -1,1 +1,1 @@\n- old content\n+ new content', stderr: '' });
                }
                return {};
            });
        });
        it('exports layout to Git repository', async () => {
            nock(config.host)
                .post(`/fmi/data/v1/databases/${config.database}/sessions`)
                .reply(200, { response: { token: 'mock-token' }, messages: [{ code: '0', message: 'OK' }] });
            nock(config.host)
                .get(`/fmi/data/v1/databases/${config.database}/layouts/Contacts`)
                .reply(200, { response: { layout: 'Contacts', fields: [] }, messages: [{ code: '0', message: 'OK' }] });
            const result = await fmMCP.gitExportLayout({ layout: 'Contacts', format: 'xml' });
            expect(result.content[0].text).toContain('Layout Contacts exported');
            expect(mockFs.writeFile).toHaveBeenCalled();
        });
        it('exports script to Git repository', async () => {
            nock(config.host)
                .post(`/fmi/data/v1/databases/${config.database}/sessions`)
                .reply(200, { response: { token: 'mock-token' }, messages: [{ code: '0', message: 'OK' }] });
            nock(config.host)
                .get(`/fmi/data/v1/databases/${config.database}/layouts/_script/TestScript`)
                .reply(200, { response: { script: 'TestScript', steps: [] }, messages: [{ code: '0', message: 'OK' }] });
            const result = await fmMCP.gitExportScript({ script: 'TestScript', format: 'json' });
            expect(result.content[0].text).toContain('Script TestScript exported');
            expect(mockFs.writeFile).toHaveBeenCalled();
        });
        it('commits changes to Git repository', async () => {
            const result = await fmMCP.gitCommitChanges({ message: 'Test commit', includeAll: true });
            expect(result.content[0].text).toContain('Changes committed');
            expect(mockExec).toHaveBeenCalledWith('git add .', expect.any(Function));
            expect(mockExec).toHaveBeenCalledWith('git commit -m "Test commit"', expect.any(Function));
        });
        it('pushes changes to remote repository', async () => {
            const result = await fmMCP.gitPushChanges({ remote: 'origin', branch: 'main' });
            expect(result.content[0].text).toContain('Changes pushed to origin/main');
            expect(mockExec).toHaveBeenCalledWith('git push origin main', expect.any(Function));
        });
        it('pulls changes from remote repository', async () => {
            const result = await fmMCP.gitPullChanges({ remote: 'origin', branch: 'main' });
            expect(result.content[0].text).toContain('Changes pulled from origin/main');
            expect(mockExec).toHaveBeenCalledWith('git pull origin main', expect.any(Function));
        });
        it('shows Git status', async () => {
            const result = await fmMCP.gitStatus({ showStaged: true, showUnstaged: true });
            expect(result.content[0].text).toContain('Unstaged:  Contacts.xml');
            expect(result.content[0].text).toContain('Staged:  Script.xml');
            expect(mockExec).toHaveBeenCalledWith('git status --short', expect.any(Function));
        });
        it('shows Git diff', async () => {
            const result = await fmMCP.gitDiff({ file: 'Contacts.xml', staged: false });
            expect(result.content[0].text).toContain('@@ -1,1 +1,1 @@');
            expect(mockExec).toHaveBeenCalledWith('git diff Contacts.xml', expect.any(Function));
        });
        it('shows staged Git diff', async () => {
            const result = await fmMCP.gitDiff({ staged: true });
            expect(result.content[0].text).toContain('@@ -1,1 +1,1 @@');
            expect(mockExec).toHaveBeenCalledWith('git diff --cached', expect.any(Function));
        });
    });
    describe('Intelligent Debugging', () => {
        it('analyzes script for debugging issues', async () => {
            const result = await fmMCP.debugAnalyzeScript({
                scriptName: 'TestScript',
                scriptContent: 'Set Next Step\nGo to Field ["TestField"]\nLoop\n  If [Get(FoundCount) > 0]\n    Exit Loop\n  End If\nEnd Loop'
            });
            expect(result.content[0].text).toContain('TestScript');
            expect(result.content[0].text).toContain('debugging_bug');
            expect(result.content[0].text).toContain('performance_warning');
        });
        it('suggests fixes for script errors', async () => {
            const result = await fmMCP.debugSuggestFixes({
                scriptName: 'TestScript',
                errorMessage: 'Field not found: TestField'
            });
            expect(result.content[0].text).toContain('TestScript');
            expect(result.content[0].text).toContain('Field not found');
            expect(result.content[0].text).toContain('field_error');
        });
        it('optimizes script for performance', async () => {
            const result = await fmMCP.debugOptimizeScript({
                scriptName: 'TestScript',
                scriptContent: 'Go to Field ["TestField"]\nSet Field ["TestField"; "Value"]',
                optimizationType: 'performance'
            });
            expect(result.content[0].text).toContain('TestScript');
            expect(result.content[0].text).toContain('optimizedScript');
            expect(result.content[0].text).toContain('performance');
        });
        it('validates layout structure', async () => {
            const result = await fmMCP.debugValidateLayout({
                layoutName: 'TestLayout',
                layoutData: { objects: Array(60).fill({}) } // 60 objects to trigger complexity warning
            });
            expect(result.content[0].text).toContain('TestLayout');
            expect(result.content[0].text).toContain('complexity');
        });
        it('resolves FileMaker error codes', async () => {
            const result = await fmMCP.debugErrorResolution({
                errorCode: '100',
                scriptName: 'TestScript'
            });
            expect(result.content[0].text).toContain('100');
            expect(result.content[0].text).toContain('Record is missing');
            expect(result.content[0].text).toContain('steps');
        });
        it('analyzes script performance', async () => {
            const result = await fmMCP.debugPerformanceAnalysis({
                scriptName: 'TestScript',
                scriptContent: 'Go to Field ["TestField"]\nLoop\n  Loop\n    Loop\n      Exit Loop\n    End Loop\n  End Loop\nEnd Loop'
            });
            expect(result.content[0].text).toContain('TestScript');
            expect(result.content[0].text).toContain('bottlenecks');
            expect(result.content[0].text).toContain('nested_loops');
        });
        it('analyzes script complexity', async () => {
            const result = await fmMCP.debugScriptComplexity({
                scriptName: 'TestScript',
                scriptContent: 'If [condition1]\n  If [condition2]\n    If [condition3]\n      Loop\n        If [condition4]\n          Perform Script ["SubScript"]\n        End If\n      End Loop\n    End If\n  End If\nEnd If'
            });
            expect(result.content[0].text).toContain('TestScript');
            expect(result.content[0].text).toContain('metrics');
            expect(result.content[0].text).toContain('riskLevel');
            expect(result.content[0].text).toContain('medium');
        });
    });
    describe('API Enhancement & Scalability', () => {
        it('performs batch operations on multiple records', async () => {
            const result = await fmMCP.apiBatchOperations({
                operation: 'create',
                records: [
                    { layout: 'Contacts', fieldData: { Name: 'John Doe', Email: 'john@example.com' } },
                    { layout: 'Contacts', fieldData: { Name: 'Jane Smith', Email: 'jane@example.com' } }
                ],
                batchSize: 2
            });
            expect(result.content[0].text).toContain('operation');
            expect(result.content[0].text).toContain('totalRecords');
            expect(result.content[0].text).toContain('totalBatches');
        });
        it('performs paginated queries for large datasets', async () => {
            // Mock authentication
            nock(config.host)
                .post(`/fmi/data/v1/databases/${config.database}/sessions`)
                .reply(200, { response: { token: 'mock-token' }, messages: [{ code: '0', message: 'OK' }] });
            // Mock paginated query responses
            nock(config.host)
                .get(`/fmi/data/v1/databases/${config.database}/layouts/Contacts/records`)
                .query(true)
                .reply(200, {
                response: {
                    data: Array(10).fill({ fieldData: { Name: 'Test Contact' }, recordId: '1' })
                },
                messages: [{ code: '0', message: 'OK' }]
            });
            nock(config.host)
                .get(`/fmi/data/v1/databases/${config.database}/layouts/Contacts/records`)
                .query(true)
                .reply(200, {
                response: {
                    data: Array(5).fill({ fieldData: { Name: 'Test Contact' }, recordId: '2' })
                },
                messages: [{ code: '0', message: 'OK' }]
            });
            const result = await fmMCP.apiPaginatedQuery({
                query: { layout: 'Contacts', filters: {} },
                pageSize: 10,
                maxPages: 2
            });
            expect(result.content[0].text).toContain('query');
            expect(result.content[0].text).toContain('pagination');
            expect(result.content[0].text).toContain('totalRecords');
        });
        it('performs bulk import operations', async () => {
            const result = await fmMCP.apiBulkImport({
                data: [
                    { Name: 'John Doe', Email: 'john@example.com' },
                    { Name: 'Jane Smith', Email: 'jane@example.com' }
                ],
                layout: 'Contacts',
                importMode: 'create'
            });
            expect(result.content[0].text).toContain('bulk_import');
            expect(result.content[0].text).toContain('totalRecords');
            expect(result.content[0].text).toContain('successful');
        });
        it('performs bulk export operations', async () => {
            const result = await fmMCP.apiBulkExport({
                layout: 'Contacts',
                format: 'json',
                includeMetadata: true
            });
            expect(result.content[0].text).toContain('bulk_export');
            expect(result.content[0].text).toContain('recordCount');
            expect(result.content[0].text).toContain('data');
        });
        it('performs data synchronization between layouts', async () => {
            const result = await fmMCP.apiDataSync({
                sourceLayout: 'Contacts',
                targetLayout: 'ContactsBackup',
                keyField: 'Email',
                syncMode: 'incremental'
            });
            expect(result.content[0].text).toContain('data_sync');
            expect(result.content[0].text).toContain('sourceLayout');
            expect(result.content[0].text).toContain('targetLayout');
        });
        it('monitors API performance', async () => {
            const result = await fmMCP.apiPerformanceMonitor({
                operation: 'connection_test',
                duration: 1000
            });
            expect(result.content[0].text).toContain('performance_monitor');
            expect(result.content[0].text).toContain('testType');
            expect(result.content[0].text).toContain('metrics');
        });
        it('manages cache operations', async () => {
            // Test cache set
            const setResult = await fmMCP.apiCacheManagement({
                action: 'set',
                key: 'test_key',
                data: { test: 'data' },
                ttl: 3600
            });
            expect(setResult.content[0].text).toContain('cache_set');
            expect(setResult.content[0].text).toContain('success');
            // Test cache get
            const getResult = await fmMCP.apiCacheManagement({
                action: 'get',
                key: 'test_key'
            });
            expect(getResult.content[0].text).toContain('cache_get');
            expect(getResult.content[0].text).toContain('found');
            // Test cache stats
            const statsResult = await fmMCP.apiCacheManagement({
                action: 'stats',
                key: 'test_key'
            });
            expect(statsResult.content[0].text).toContain('cache_stats');
            expect(statsResult.content[0].text).toContain('size');
        });
        it('handles rate limiting', async () => {
            const result = await fmMCP.apiRateLimitHandler({
                operation: 'find_records',
                requests: 5,
                timeWindow: 60000
            });
            expect(result.content[0].text).toContain('rate_limit_handler');
            expect(result.content[0].text).toContain('requestCount');
            expect(result.content[0].text).toContain('limit');
        });
    });
});
