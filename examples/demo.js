#!/usr/bin/env node

/**
 * FileMaker MCP Server Demo
 * 
 * This script demonstrates the various features of the FileMaker MCP server
 * including CRUD operations, Git integration, debugging tools, and API enhancements.
 */

import { FileMakerMCP } from '../dist/filemaker-mcp.js';

// Configuration - replace with your actual FileMaker server details
const config = {
  host: process.env.FILEMAKER_HOST || 'https://your-filemaker-server.com',
  database: process.env.FILEMAKER_DATABASE || 'YourDatabase',
  username: process.env.FILEMAKER_USERNAME || 'your-username',
  password: process.env.FILEMAKER_PASSWORD || 'your-password',
  gitRepoPath: process.env.FILEMAKER_GIT_REPO_PATH || './filemaker-components'
};

async function runDemo() {
  console.log('🚀 FileMaker MCP Server Demo\n');
  
  try {
    const fmMCP = new FileMakerMCP(config);
    
    // Demo 1: Basic CRUD Operations
    console.log('📋 Demo 1: Basic CRUD Operations');
    console.log('================================');
    
    // Find records
    console.log('\n1. Finding records...');
    const findResult = await fmMCP.findRecords({
      layout: 'Contacts',
      query: { Name: 'John Doe' },
      limit: 5
    });
    console.log('✅ Find result:', findResult.content[0].text.substring(0, 100) + '...');
    
    // Create a record
    console.log('\n2. Creating a record...');
    const createResult = await fmMCP.createRecord({
      layout: 'Contacts',
      fieldData: {
        Name: 'Demo Contact',
        Email: 'demo@example.com',
        Phone: '555-1234'
      }
    });
    console.log('✅ Create result:', createResult.content[0].text);
    
    // Demo 2: Git Integration
    console.log('\n\n🔄 Demo 2: Git Integration');
    console.log('==========================');
    
    // Export layout to Git
    console.log('\n1. Exporting layout to Git...');
    const exportResult = await fmMCP.gitExportLayout({
      layout: 'Contacts',
      format: 'xml',
      gitMessage: 'Demo: Export Contacts layout'
    });
    console.log('✅ Export result:', exportResult.content[0].text);
    
    // Check Git status
    console.log('\n2. Checking Git status...');
    const statusResult = await fmMCP.gitStatus({
      showStaged: true,
      showUnstaged: true
    });
    console.log('✅ Git status:', statusResult.content[0].text);
    
    // Demo 3: Intelligent Debugging
    console.log('\n\n🔧 Demo 3: Intelligent Debugging');
    console.log('===============================');
    
    // Analyze script
    console.log('\n1. Analyzing script for debugging issues...');
    const analyzeResult = await fmMCP.debugAnalyzeScript({
      scriptName: 'DemoScript',
      scriptContent: `
        Set Next Step
        Go to Field ["Email"]
        Loop
          If [Get(FoundCount) > 0]
            Exit Loop
          End If
        End Loop
      `
    });
    console.log('✅ Analysis result:', analyzeResult.content[0].text.substring(0, 200) + '...');
    
    // Suggest fixes
    console.log('\n2. Suggesting fixes for errors...');
    const fixResult = await fmMCP.debugSuggestFixes({
      scriptName: 'DemoScript',
      errorMessage: 'Field not found: Email',
      scriptContent: 'Set Field ["Email"; "test@example.com"]'
    });
    console.log('✅ Fix suggestions:', fixResult.content[0].text.substring(0, 200) + '...');
    
    // Demo 4: API Enhancement & Scalability
    console.log('\n\n⚡ Demo 4: API Enhancement & Scalability');
    console.log('========================================');
    
    // Batch operations
    console.log('\n1. Performing batch operations...');
    const batchResult = await fmMCP.apiBatchOperations({
      operation: 'create',
      records: [
        { layout: 'Contacts', fieldData: { Name: 'Batch Contact 1', Email: 'batch1@example.com' } },
        { layout: 'Contacts', fieldData: { Name: 'Batch Contact 2', Email: 'batch2@example.com' } }
      ],
      batchSize: 2
    });
    console.log('✅ Batch result:', batchResult.content[0].text.substring(0, 200) + '...');
    
    // Cache management
    console.log('\n2. Managing cache...');
    const cacheResult = await fmMCP.apiCacheManagement({
      action: 'set',
      key: 'demo_cache_key',
      data: { message: 'Hello from cache!' },
      ttl: 3600
    });
    console.log('✅ Cache result:', cacheResult.content[0].text);
    
    // Performance monitoring
    console.log('\n3. Monitoring performance...');
    const perfResult = await fmMCP.apiPerformanceMonitor({
      operation: 'connection_test',
      duration: 1000
    });
    console.log('✅ Performance result:', perfResult.content[0].text.substring(0, 200) + '...');
    
    console.log('\n\n🎉 Demo completed successfully!');
    console.log('\nTo use this MCP server with Claude:');
    console.log('1. Add the configuration to your Claude settings');
    console.log('2. Replace the placeholder values with your actual FileMaker server details');
    console.log('3. Start using natural language commands to interact with FileMaker!');
    
  } catch (error) {
    console.error('❌ Demo failed:', error.message);
    console.log('\n💡 Make sure to:');
    console.log('1. Set up your FileMaker server credentials in environment variables');
    console.log('2. Ensure your FileMaker server is accessible');
    console.log('3. Check that the Data API is enabled on your FileMaker server');
  }
}

// Run the demo if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runDemo();
}

export { runDemo }; 