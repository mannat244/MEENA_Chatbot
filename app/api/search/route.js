import { NextResponse } from 'next/server';
import chromaDBService from '../../../lib/chromadb.js';

export async function POST(request) {
  try {
    const { query, collection = 'knowledgeBase', limit = 5, filters = {} } = await request.json();
    
    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Query parameter is required and must be a string' },
        { status: 400 }
      );
    }

    // Perform semantic search
    const results = await chromaDBService.semanticSearch(query, {
      collection,
      limit,
      filters
    });

    return NextResponse.json({
      success: true,
      query,
      results,
      count: results.length
    });
    
  } catch (error) {
    console.error('Semantic search API error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error during semantic search',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    // Get ChromaDB statistics
    const stats = await chromaDBService.getStats();
    
    return NextResponse.json({
      success: true,
      stats,
      collections: Object.keys(stats),
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Stats API error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error getting stats',
        details: error.message 
      },
      { status: 500 }
    );
  }
}