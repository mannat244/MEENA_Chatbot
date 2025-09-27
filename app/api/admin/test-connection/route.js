import { NextResponse } from 'next/server';
import chromaDBService from '../../../../lib/chromadb.js';

// GET - Test ChromaDB connection and system health
export async function GET(request) {
  const testResults = {
    timestamp: new Date().toISOString(),
    tests: [],
    overall_status: 'unknown',
    details: {}
  };

  try {
    // Test 1: ChromaDB Connection
    testResults.tests.push({
      name: 'ChromaDB Connection',
      status: 'testing',
      message: 'Connecting to ChromaDB...'
    });

    try {
      await chromaDBService.initialize();
      testResults.tests[0].status = 'passed';
      testResults.tests[0].message = 'Successfully connected to ChromaDB';
      testResults.details.chromadb_connection = 'success';
    } catch (error) {
      testResults.tests[0].status = 'failed';
      testResults.tests[0].message = `ChromaDB connection failed: ${error.message}`;
      testResults.details.chromadb_connection = 'failed';
      testResults.details.chromadb_error = error.message;
    }

    // Test 2: Collections Availability
    testResults.tests.push({
      name: 'Collections Check',
      status: 'testing',
      message: 'Checking ChromaDB collections...'
    });

    try {
      const collections = chromaDBService.collections;
      const availableCollections = Object.keys(collections).filter(key => collections[key]);
      
      if (availableCollections.length > 0) {
        testResults.tests[1].status = 'passed';
        testResults.tests[1].message = `Found ${availableCollections.length} collections: ${availableCollections.join(', ')}`;
        testResults.details.collections = availableCollections;
      } else {
        testResults.tests[1].status = 'failed';
        testResults.tests[1].message = 'No collections found';
        testResults.details.collections = [];
      }
    } catch (error) {
      testResults.tests[1].status = 'failed';
      testResults.tests[1].message = `Collections check failed: ${error.message}`;
    }

    // Test 3: Knowledge Base Content
    testResults.tests.push({
      name: 'Knowledge Base Content',
      status: 'testing',
      message: 'Checking knowledge base entries...'
    });

    try {
      if (chromaDBService.collections.knowledgeBase) {
        const count = await chromaDBService.collections.knowledgeBase.count();
        testResults.tests[2].status = count > 0 ? 'passed' : 'warning';
        testResults.tests[2].message = `Knowledge base contains ${count} entries`;
        testResults.details.knowledge_entries = count;
      } else {
        testResults.tests[2].status = 'failed';
        testResults.tests[2].message = 'Knowledge base collection not found';
      }
    } catch (error) {
      testResults.tests[2].status = 'failed';
      testResults.tests[2].message = `Knowledge base check failed: ${error.message}`;
    }

    // Test 4: Embedding Generation
    testResults.tests.push({
      name: 'Embedding Generation',
      status: 'testing',
      message: 'Testing embedding generation...'
    });

    try {
      // Test embedding generation with a simple query
      const testQuery = "test connection query";
      const results = await chromaDBService.searchKnowledge(testQuery, 1);
      
      testResults.tests[3].status = 'passed';
      testResults.tests[3].message = `Embedding generation successful, returned ${results.length} results`;
      testResults.details.embedding_test = 'success';
    } catch (error) {
      testResults.tests[3].status = 'failed';
      testResults.tests[3].message = `Embedding generation failed: ${error.message}`;
      testResults.details.embedding_error = error.message;
    }

    // Test 5: Google API Key
    testResults.tests.push({
      name: 'Google API Configuration',
      status: 'testing',
      message: 'Checking Google API key...'
    });

    if (process.env.GOOGLE_API_KEY) {
      testResults.tests[4].status = 'passed';
      testResults.tests[4].message = 'Google API key is configured';
      testResults.details.google_api_key = 'configured';
    } else {
      testResults.tests[4].status = 'failed';
      testResults.tests[4].message = 'Google API key is missing';
      testResults.details.google_api_key = 'missing';
    }

    // Determine overall status
    const failedTests = testResults.tests.filter(test => test.status === 'failed').length;
    const warningTests = testResults.tests.filter(test => test.status === 'warning').length;
    
    if (failedTests === 0 && warningTests === 0) {
      testResults.overall_status = 'healthy';
    } else if (failedTests === 0) {
      testResults.overall_status = 'warning';
    } else {
      testResults.overall_status = 'unhealthy';
    }

    // Add system information
    testResults.details.system_info = {
      node_version: process.version,
      platform: process.platform,
      memory_usage: process.memoryUsage(),
      uptime: process.uptime()
    };

    return NextResponse.json({
      success: true,
      ...testResults
    });

  } catch (error) {
    console.error('Connection test error:', error);
    
    testResults.overall_status = 'error';
    testResults.error = error.message;
    
    return NextResponse.json({
      success: false,
      ...testResults
    }, { status: 500 });
  }
}