import { FileMakerMCP } from '../src/filemaker-mcp';
import nock from 'nock';
describe('FileMakerMCP E2E', () => {
    const config = {
        host: 'https://test-server.com',
        database: 'TestDB',
        username: 'testuser',
        password: 'testpass',
    };
    let fmMCP;
    beforeEach(() => {
        fmMCP = new FileMakerMCP(config);
        nock.cleanAll();
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
        expect(result.content[0].text).toContain('foundCount');
        expect(result.content[0].text).toContain('John');
    });
    it('creates a record', async () => {
        nock(config.host)
            .post(`/fmi/data/v1/databases/${config.database}/sessions`)
            .reply(200, { response: { token: 'mock-token' }, messages: [{ code: '0', message: 'OK' }] });
        nock(config.host)
            .post(`/fmi/data/v1/databases/${config.database}/layouts/Contacts/records`)
            .reply(200, { response: { recordId: '123' }, messages: [{ code: '0', message: 'OK' }] });
        const result = await fmMCP.createRecord({ layout: 'Contacts', fieldData: { Name: 'Jane' } });
        expect(result.content[0].text).toContain('Record created successfully');
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
});
