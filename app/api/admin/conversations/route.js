import { NextResponse } from 'next/server';
import chromaDBService from '../../../../lib/chromadb.js';
import dbConnect from '../../../../lib/mongodb.js';
import Chat from '../../../../models/Chat.js';

// GET - Fetch conversation logs (Dual Source: ChromaDB + MongoDB)
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit')) || 100;
    const source = searchParams.get('source') || 'both'; // 'chromadb', 'mongodb', 'both'
    const page = parseInt(searchParams.get('page')) || 1;
    
    let allConversations = [];
    
    // Get from ChromaDB (existing working functionality)
    if (source === 'chromadb' || source === 'both') {
      try {
        await chromaDBService.initialize();
        const collection = chromaDBService.collections.chatHistory;
        const results = await collection.get({
          limit: limit,
          orderBy: 'timestamp'
        });
        
        // Transform ChromaDB results to conversation format
        const chromaConversations = results.ids.map((id, index) => ({
          id,
          source: 'chromadb',
          message: results.documents[index] || '',
          response: results.metadatas[index]?.response || 'No response recorded',
          timestamp: results.metadatas[index]?.timestamp || new Date().toISOString(),
          sender: results.metadatas[index]?.sender || 'user',
          chat_id: results.metadatas[index]?.chat_id || 'unknown',
          user_id: results.metadatas[index]?.user_id || 'anonymous',
          language: results.metadatas[index]?.language || 'English'
        }));
        
        allConversations.push(...chromaConversations);
        console.log(`📊 Retrieved ${chromaConversations.length} conversations from ChromaDB`);
      } catch (chromaError) {
        console.error('ChromaDB query failed:', chromaError.message);
      }
    }
    
    // ALSO get from MongoDB for persistent admin dashboard
    if (source === 'mongodb' || source === 'both') {
      try {
        await dbConnect();
        const skip = (page - 1) * limit;
        
        const mongoConversations = await Chat.find({})
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean();
        
        // Transform MongoDB results to match ChromaDB format
        const convertedMongoConversations = mongoConversations.map(conv => ({
          id: conv._id.toString(),
          source: 'mongodb',
          message: conv.message,
          response: conv.response,
          timestamp: conv.createdAt.toISOString(),
          sender: 'user',
          chat_id: conv.userId,
          user_id: conv.userId,
          language: conv.metadata?.language || 'English',
          metadata: conv.metadata
        }));
        
        allConversations.push(...convertedMongoConversations);
        console.log(`📊 Retrieved ${convertedMongoConversations.length} conversations from MongoDB`);
      } catch (mongoError) {
        console.error('MongoDB query failed:', mongoError.message);
      }
    }
    
    // Remove duplicates and sort by timestamp (most recent first)
    const uniqueConversations = allConversations.filter((conv, index, self) => 
      index === self.findIndex(c => c.message === conv.message && c.timestamp === conv.timestamp)
    );
    
    uniqueConversations.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    // Apply limit after combining sources
    const finalConversations = uniqueConversations.slice(0, limit);
    
    return NextResponse.json({
      success: true,
      conversations: finalConversations,
      count: finalConversations.length,
      total: uniqueConversations.length,
      sources: {
        chromadb: allConversations.filter(c => c.source === 'chromadb').length,
        mongodb: allConversations.filter(c => c.source === 'mongodb').length
      },
      pagination: {
        page,
        limit,
        total: uniqueConversations.length
      }
    });
    
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch conversations',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

// POST - Add conversation log (for manual logging)
export async function POST(request) {
  try {
    const data = await request.json();
    const { message, response, userId, chatId, language } = data;
    
    if (!message || !response) {
      return NextResponse.json(
        { error: 'Message and response are required' },
        { status: 400 }
      );
    }
    
    const conversationId = `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const success = await chromaDBService.addChatMessage({
      id: conversationId,
      text: message,
      sender: 'user',
      chatId: chatId || 'manual_log',
      userId: userId || 'admin',
      language: language || 'English',
      timestamp: new Date().toISOString(),
      response: response
    });
    
    return NextResponse.json({
      success,
      message: success ? 'Conversation logged successfully' : 'Failed to log conversation'
    });
    
  } catch (error) {
    console.error('Error logging conversation:', error);
    return NextResponse.json(
      { 
        error: 'Failed to log conversation',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

// DELETE - Clear conversation history
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const chatId = searchParams.get('chatId');
    const days = parseInt(searchParams.get('days')) || 0;
    
    await chromaDBService.initialize();
    
    if (chatId) {
      // Delete specific chat
      const collection = chromaDBService.collections.chatHistory;
      const results = await collection.get({
        where: { chat_id: chatId }
      });
      
      if (results.ids.length > 0) {
        await collection.delete({ ids: results.ids });
      }
      
      return NextResponse.json({
        success: true,
        message: `Deleted ${results.ids.length} messages from chat ${chatId}`
      });
    } else if (days > 0) {
      // Delete conversations older than specified days
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      
      const collection = chromaDBService.collections.chatHistory;
      const results = await collection.get({
        where: {
          timestamp: { $lt: cutoffDate.toISOString() }
        }
      });
      
      if (results.ids.length > 0) {
        await collection.delete({ ids: results.ids });
      }
      
      return NextResponse.json({
        success: true,
        message: `Deleted ${results.ids.length} conversations older than ${days} days`
      });
    } else {
      return NextResponse.json(
        { error: 'Either chatId or days parameter is required' },
        { status: 400 }
      );
    }
    
  } catch (error) {
    console.error('Error deleting conversations:', error);
    return NextResponse.json(
      { 
        error: 'Failed to delete conversations',
        details: error.message 
      },
      { status: 500 }
    );
  }
}