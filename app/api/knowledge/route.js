import { NextResponse } from 'next/server';
import { ChromaDBService } from '../../../lib/chromadb.js';

const chromaService = new ChromaDBService();

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'stats';
    
    await chromaService.initialize();
    
    switch (action) {
      case 'stats':
        // Get knowledge base statistics
        const stats = await chromaService.getCollectionStats('knowledgeBase');
        return NextResponse.json({
          success: true,
          stats: stats,
          message: 'Knowledge base statistics retrieved'
        });
        
      case 'list':
        // List all knowledge entries (limited)
        const limit = parseInt(searchParams.get('limit')) || 20;
        const results = await chromaService.semanticSearch('', {
          collection: 'knowledgeBase',
          limit: limit,
          minSimilarity: 0 // Get all entries
        });
        
        return NextResponse.json({
          success: true,
          entries: results,
          count: results.length,
          message: 'Knowledge base entries retrieved'
        });
        
      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action. Use: stats, list'
        }, { status: 400 });
    }
    
  } catch (error) {
    console.error('Knowledge base API error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to process knowledge base request'
    }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { action, data } = body;
    
    await chromaService.initialize();
    
    switch (action) {
      case 'add_entry':
        if (!data || !data.id || !data.title || !data.content) {
          return NextResponse.json({
            success: false,
            error: 'Missing required fields: id, title, content'
          }, { status: 400 });
        }
        
        const result = await chromaService.addKnowledgeEntry(data);
        
        return NextResponse.json({
          success: result.success,
          message: result.success ? 'Knowledge entry added successfully' : result.error || 'Failed to add knowledge entry'
        });
        
      case 'search':
        const { query, limit = 5, minSimilarity = 0.3 } = data;
        
        if (!query) {
          return NextResponse.json({
            success: false,
            error: 'Query is required for search'
          }, { status: 400 });
        }
        
        const searchResults = await chromaService.semanticSearch(query, {
          collection: 'knowledgeBase',
          limit: limit,
          minSimilarity: minSimilarity
        });
        
        return NextResponse.json({
          success: true,
          results: searchResults,
          query: query,
          count: searchResults.length,
          message: `Found ${searchResults.length} relevant entries`
        });
        
      case 'bulk_add':
        if (!Array.isArray(data)) {
          return NextResponse.json({
            success: false,
            error: 'Data must be an array for bulk_add'
          }, { status: 400 });
        }
        
        let successCount = 0;
        let errorCount = 0;
        const errors = [];
        
        for (const entry of data) {
          try {
            const result = await chromaService.addKnowledgeEntry(entry);
            if (result.success) {
              successCount++;
            } else {
              errorCount++;
              errors.push(`Failed to add: ${entry.title || entry.id} - ${result.error}`);
            }
          } catch (error) {
            errorCount++;
            errors.push(`Error adding ${entry.title || entry.id}: ${error.message}`);
          }
          
          // Small delay to prevent overwhelming the system
          await new Promise(resolve => setTimeout(resolve, 50));
        }
        
        return NextResponse.json({
          success: successCount > 0,
          message: `Bulk operation completed: ${successCount} added, ${errorCount} failed`,
          statistics: {
            total: data.length,
            successful: successCount,
            failed: errorCount
          },
          errors: errors.slice(0, 10) // Limit error details
        });
        
      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action. Use: add_entry, search, bulk_add'
        }, { status: 400 });
    }
    
  } catch (error) {
    console.error('Knowledge base POST API error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to process knowledge base request'
    }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const entryId = searchParams.get('id');
    
    if (!entryId) {
      return NextResponse.json({
        success: false,
        error: 'Entry ID is required for deletion'
      }, { status: 400 });
    }
    
    await chromaService.initialize();
    
    // Delete from knowledge base collection
    try {
      await chromaService.collections.knowledgeBase.delete({
        ids: [entryId]
      });
      
      return NextResponse.json({
        success: true,
        message: `Knowledge entry ${entryId} deleted successfully`
      });
      
    } catch (error) {
      return NextResponse.json({
        success: false,
        error: `Failed to delete entry: ${error.message}`
      }, { status: 404 });
    }
    
  } catch (error) {
    console.error('Knowledge base DELETE API error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to delete knowledge base entry'
    }, { status: 500 });
  }
}