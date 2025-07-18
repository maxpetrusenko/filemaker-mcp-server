import { FileMakerMCP, FileMakerConfig } from '../src/filemaker-mcp';
import nock from 'nock';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';

// Mock child_process.exec and fs
jest.mock('child_process');
jest.mock('fs/promises');
const mockExec = exec as jest.MockedFunction<typeof exec>;
const mockFs = fs as jest.Mocked<typeof fs>;

describe('FileMakerMCP E2E', () => {
  const config: FileMakerConfig = {
    host: 'https://test-server.com',
    database: 'TestDB',
    username: 'testuser',
    password: 'testpass',
    gitRepoPath: '/tmp/test-repo',
  };
  let fmMCP: FileMakerMCP;

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
      mockExec.mockImplementation((command: string, callback: any) => {
        if (command.includes('git add')) {
          callback(null, { stdout: '', stderr: '' });
        } else if (command.includes('git commit')) {
          callback(null, { stdout: '[main abc1234] Test commit', stderr: '' });
        } else if (command.includes('git push')) {
          callback(null, { stdout: 'To origin/main', stderr: '' });
        } else if (command.includes('git pull')) {
          callback(null, { stdout: 'Already up to date', stderr: '' });
        } else if (command.includes('git status')) {
          callback(null, { stdout: 'M  Contacts.xml\nA  Script.xml', stderr: '' });
        } else if (command.includes('git diff')) {
          callback(null, { stdout: '@@ -1,1 +1,1 @@\n- old content\n+ new content', stderr: '' });
        }
        return {} as any;
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
}); 