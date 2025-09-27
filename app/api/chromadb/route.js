import { NextResponse } from 'next/server';
import chromaDBService from '../../../lib/chromadb.js';

// Enable debug mode
const DEBUG_MODE = true;

export async function POST(request) {
  try {
    const { action, data } = await request.json();
    
    console.log('\n🌐 ===== CHROMADB API REQUEST =====');
    console.log('📝 Action:', action);
    console.log('📦 Data:', JSON.stringify(data, null, 2));
    
    switch (action) {
      case 'add_knowledge':
        const { id, title, content, category, tags, source } = data;
        
        if (!id || !title || !content) {
          return NextResponse.json(
            { error: 'ID, title, and content are required' },
            { status: 400 }
          );
        }
        
        const result = await chromaDBService.addKnowledgeEntry({
          id,
          title,
          content,
          category,
          tags,
          source
        });
        
        return NextResponse.json({
          success: result.success,
          message: result.success ? 'Knowledge entry added successfully' : result.error || 'Failed to add knowledge entry'
        });
        
      case 'search_knowledge':
        const { query, limit = 5 } = data;
        
        console.log('🔍 CHROMADB API: search_knowledge called');
        console.log(`📝 Query: "${query}"`);
        console.log(`🔢 Limit: ${limit}`);
        console.log('⏰ Timestamp:', new Date().toISOString());
        
        if (!query) {
          return NextResponse.json(
            { error: 'Query is required for search' },
            { status: 400 }
          );
        }
        
        // Initialize and debug
        await chromaDBService.initialize();
        if (DEBUG_MODE) {
          await chromaDBService.debugStatus();
        }
        
        const results = await chromaDBService.searchKnowledge(query, limit);
        
        if (DEBUG_MODE) {
          console.log(`🎯 Search results: ${results.length} items found`);
          results.forEach((result, i) => {
            console.log(`  ${i + 1}. "${result.title}" (similarity: ${result.similarity?.toFixed(3)})`);
            console.log(`      Content: ${result.content?.substring(0, 100)}...`);
          });
        }
        
        return NextResponse.json({
          success: true,
          query,
          results,
          count: results.length,
          debug: DEBUG_MODE ? {
            timestamp: new Date().toISOString(),
            queryLength: query.length,
            hasResults: results.length > 0
          } : undefined
        });
        
      case 'add_chat_message':
        console.log('💬 CHROMADB API: add_chat_message called');
        const { id: msgId, text, sender, chatId: messageChatId, userId, language, timestamp } = data;
        
        console.log('📝 Message Details:', {
          id: msgId,
          sender: sender,
          textLength: text?.length || 0,
          chatId: messageChatId,
          userId: userId,
          language: language
        });
        
        if (!msgId || !text || !sender) {
          console.log('❌ Missing required fields for chat message');
          return NextResponse.json(
            { error: 'Message ID, text, and sender are required' },
            { status: 400 }
          );
        }
        
        try {
          const success = await chromaDBService.addChatMessage({
            id: msgId,
            text,
            sender,
            chatId: messageChatId,
            userId: userId || 'anonymous',
            language: language || 'English',
            timestamp: timestamp || new Date().toISOString()
          });
          
          console.log(`✅ Chat message stored: ${success ? 'SUCCESS' : 'FAILED'}`);
          
          return NextResponse.json({
            success,
            message: success ? 'Chat message stored successfully' : 'Failed to store chat message'
          });
          
        } catch (error) {
          console.error('❌ Error storing chat message:', error);
          return NextResponse.json(
            { error: 'Failed to store chat message', details: error.message },
            { status: 500 }
          );
        }

      case 'get_chat_context':
        const { chatId, contextLimit = 10 } = data;
        
        if (!chatId) {
          return NextResponse.json(
            { error: 'Chat ID is required' },
            { status: 400 }
          );
        }
        
        const context = await chromaDBService.getChatContext(chatId, contextLimit);
        
        return NextResponse.json({
          success: true,
          chatId,
          context,
          count: context.length
        });
        
      default:
        console.log(`❌ Unknown action received: ${action}`);
        return NextResponse.json(
          { error: `Invalid action: ${action}. Supported actions: add_knowledge, search_knowledge, add_chat_message, get_chat_context` },
          { status: 400 }
        );
    }
    
  } catch (error) {
    console.error('ChromaDB API error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    // Initialize ChromaDB to ensure collections exist
    await chromaDBService.initialize();
    
    const stats = await chromaDBService.getStats();
    
    return NextResponse.json({
      success: true,
      message: 'ChromaDB is initialized and ready',
      stats,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('ChromaDB initialization error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to initialize ChromaDB',
        details: error.message 
      },
      { status: 500 }
    );
  }
}