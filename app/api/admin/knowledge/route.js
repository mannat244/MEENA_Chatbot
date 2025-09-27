import { NextResponse } from 'next/server';
import chromaDBService from '../../../../lib/chromadb.js';

// GET - Fetch all knowledge entries
export async function GET(request) {
  try {
    await chromaDBService.initialize();
    
    // Get all entries from ChromaDB knowledge base collection (quota-safe)
    const collection = chromaDBService.collections.knowledgeBase;
    const results = await collection.get({
      limit: 300 // ChromaDB Cloud quota limit
    });
    
    // Transform ChromaDB results to our format
    const entries = results.ids.map((id, index) => ({
      id,
      title: results.metadatas[index]?.title || 'Untitled',
      content: results.documents[index] || '',
      category: results.metadatas[index]?.category || 'general',
      subcategory: results.metadatas[index]?.subcategory || '',
      tags: results.metadatas[index]?.tags || '',
      source: results.metadatas[index]?.source || 'unknown',
      priority: results.metadatas[index]?.priority || 'medium',
      created_at: results.metadatas[index]?.created_at || new Date().toISOString(),
      updated_at: results.metadatas[index]?.updated_at || new Date().toISOString(),
      status: results.metadatas[index]?.status || 'active'
    }));
    
    return NextResponse.json({
      success: true,
      entries,
      count: entries.length
    });
    
  } catch (error) {
    console.error('Error fetching knowledge entries:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch knowledge entries',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

// POST - Add new knowledge entry
export async function POST(request) {
  try {
    const data = await request.json();
    const { id, title, content, category, subcategory, tags, source, priority } = data;
    
    if (!id || !title || !content || !category) {
      return NextResponse.json(
        { error: 'ID, title, content, and category are required' },
        { status: 400 }
      );
    }
    
    const result = await chromaDBService.addKnowledgeEntry({
      id,
      title,
      content,
      category,
      subcategory: subcategory || '',
      tags: Array.isArray(tags) ? tags : (tags ? tags.split(',').map(t => t.trim()) : []),
      source: source || 'manual',
      priority: priority || 'medium',
      status: 'active'
    });
    
    return NextResponse.json({
      success: result.success,
      message: result.success ? 'Knowledge entry added successfully' : result.error || 'Failed to add knowledge entry'
    });
    
  } catch (error) {
    console.error('Error adding knowledge entry:', error);
    return NextResponse.json(
      { 
        error: 'Failed to add knowledge entry',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

// PUT - Update existing knowledge entry
export async function PUT(request) {
  try {
    const data = await request.json();
    const { id, title, content, category, subcategory, tags, source, priority } = data;
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID is required for updates' },
        { status: 400 }
      );
    }
    
    // Delete the existing entry and add updated one
    await chromaDBService.collections.knowledgeBase.delete({ ids: [id] });
    
    const result = await chromaDBService.addKnowledgeEntry({
      id,
      title,
      content,
      category,
      subcategory: subcategory || '',
      tags: Array.isArray(tags) ? tags : (tags ? tags.split(',').map(t => t.trim()) : []),
      source: source || 'manual',
      priority: priority || 'medium',
      status: 'active'
    });
    
    return NextResponse.json({
      success: result.success,
      message: result.success ? 'Knowledge entry updated successfully' : result.error || 'Failed to update knowledge entry'
    });
    
  } catch (error) {
    console.error('Error updating knowledge entry:', error);
    return NextResponse.json(
      { 
        error: 'Failed to update knowledge entry',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

// DELETE - Delete knowledge entry
export async function DELETE(request) {
  try {
    console.log('\n🗑️ ===== ADMIN API: DELETE KNOWLEDGE ENTRY =====');
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    console.log('📝 Entry ID to delete:', id);
    
    if (!id) {
      console.log('❌ No ID provided for deletion');
      return NextResponse.json(
        { error: 'ID is required for deletion' },
        { status: 400 }
      );
    }
    
    // Initialize ChromaDB service
    await chromaDBService.initialize();
    
    // Check if entry exists before deleting
    try {
      const existing = await chromaDBService.collections.knowledgeBase.get({
        ids: [id],
        include: ['metadatas']
      });
      
      if (!existing.ids || existing.ids.length === 0) {
        console.log('❌ Entry not found for deletion:', id);
        return NextResponse.json(
          { error: 'Knowledge entry not found' },
          { status: 404 }
        );
      }
      
      console.log('✅ Entry found, proceeding with deletion');
      
    } catch (error) {
      console.log('⚠️ Could not verify entry existence:', error.message);
    }
    
    // Delete the entry
    await chromaDBService.collections.knowledgeBase.delete({ ids: [id] });
    console.log('✅ Entry deleted successfully:', id);
    
    return NextResponse.json({
      success: true,
      message: 'Knowledge entry deleted successfully',
      deletedId: id
    });
    
  } catch (error) {
    console.error('❌ Error deleting knowledge entry:', error);
    return NextResponse.json(
      { 
        error: 'Failed to delete knowledge entry',
        details: error.message 
      },
      { status: 500 }
    );
  }
}