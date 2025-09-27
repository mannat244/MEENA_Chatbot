import { CloudClient } from 'chromadb';
import { GoogleGenAI } from '@google/genai';

// Initialize ChromaDB Cloud client
const client = new CloudClient({
  apiKey: process.env.CHROMADB_API_KEY,
  tenant: process.env.CHROMADB_TENANT,
  database: process.env.CHROMADB_DATABASE
});

console.log('🌐 ChromaDB Cloud Configuration:');
console.log('   API Key:', process.env.CHROMADB_API_KEY ? '***configured***' : '❌ MISSING');
console.log('   Tenant:', process.env.CHROMADB_TENANT || '❌ MISSING');
console.log('   Database:', process.env.CHROMADB_DATABASE || '❌ MISSING');

// Initialize Google GenAI for embeddings
const genAI = new GoogleGenAI({
  apiKey: process.env.GOOGLE_API_KEY
});

// Custom embedding function for ChromaDB
class GeminiEmbeddingFunction {
  async generate(texts) {
    // Debug: Check if API key is loaded
    if (!process.env.GOOGLE_API_KEY) {
      console.error('GOOGLE_API_KEY environment variable is not set!');
      throw new Error('Google API key is missing');
    }
    
    console.log(`Generating embeddings for ${texts.length} texts...`);
    
    try {
      // Truncate texts if too long (Gemini has limits)
      const truncatedTexts = texts.map(text => 
        text.length > 2000 ? text.substring(0, 2000) : text
      );
      
      const response = await genAI.models.embedContent({
        model: 'gemini-embedding-001',
        contents: truncatedTexts,
        taskType: 'RETRIEVAL_DOCUMENT',
        outputDimensionality: 768  // Using smaller dimension for efficiency
      });
      
      const embeddings = response.embeddings.map(e => e.values);
      console.log(`✅ Generated ${embeddings.length} embeddings successfully`);
      return embeddings;
      
    } catch (error) {
      console.error('❌ Error generating embeddings:', error.message);
      console.error('Full error:', error);
      throw error; // Re-throw to see the actual error
    }
  }
}

const geminiEmbedder = new GeminiEmbeddingFunction();

// Collection names
const COLLECTIONS = {
  CHAT_HISTORY: 'meena_chat_history',
  KNOWLEDGE_BASE: 'meena_knowledge_base',
  USER_QUERIES: 'meena_user_queries'
};

class ChromaDBService {
  constructor() {
    this.collections = {};
    this.isInitialized = false;
  }

  /**
   * Initialize ChromaDB collections
   */
  async initialize() {
    if (this.isInitialized) return;

    try {
      console.log('🌐 Initializing ChromaDB Cloud connection...');
      console.log('📡 Tenant:', 'f0cb9b93-29a4-4280-9a0a-9a59bd8801cd');
      console.log('🗄️  Database:', 'MeenaKnowledgeBase');
      
      // Test cloud connection
      try {
        const heartbeat = await client.heartbeat();
        console.log('✅ ChromaDB Cloud connection successful:', heartbeat);
      } catch (heartbeatError) {
        console.error('❌ ChromaDB Cloud connection failed:', heartbeatError);
        throw heartbeatError;
      }
      
      console.log('📚 Initializing ChromaDB collections...');
      
      // Initialize chat history collection
      console.log('📚 Getting or creating chat history collection...');
      this.collections.chatHistory = await client.getOrCreateCollection({
        name: COLLECTIONS.CHAT_HISTORY,
        embeddingFunction: geminiEmbedder,
        metadata: { 
          description: "Chat history and conversations with MEENA",
          created_at: new Date().toISOString()
        }
      });

      // Initialize knowledge base collection
      console.log('📚 Getting or creating knowledge base collection...');
      this.collections.knowledgeBase = await client.getOrCreateCollection({
        name: COLLECTIONS.KNOWLEDGE_BASE,
        embeddingFunction: geminiEmbedder,
        metadata: { 
          description: "MANIT knowledge base and institutional information",
          created_at: new Date().toISOString()
        }
      });

      // Initialize user queries collection
      console.log('📚 Getting or creating user queries collection...');
      this.collections.userQueries = await client.getOrCreateCollection({
        name: COLLECTIONS.USER_QUERIES,
        embeddingFunction: geminiEmbedder,
        metadata: { 
          description: "User queries and search patterns",
          created_at: new Date().toISOString()
        }
      });

      this.isInitialized = true;
      console.log('✅ ChromaDB Cloud collections initialized successfully');
      
      // Log collection stats
      try {
        const chatCount = await this.collections.chatHistory.count();
        const knowledgeCount = await this.collections.knowledgeBase.count();
        const queriesCount = await this.collections.userQueries.count();
        
        console.log('📊 ChromaDB Cloud Collection Stats:');
        console.log(`   💬 Chat History: ${chatCount} documents`);
        console.log(`   📚 Knowledge Base: ${knowledgeCount} documents`);
        console.log(`   🔍 User Queries: ${queriesCount} documents`);
      } catch (statsError) {
        console.log('📊 Could not retrieve collection stats:', statsError.message);
      }
      
      // Seed knowledge base with initial data if empty
      await this.seedKnowledgeBase();
      
    } catch (error) {
      console.error('Error initializing ChromaDB:', error);
      throw error;
    }
  }

  /**
   * Debug function to check ChromaDB status
   */
  async debugChromaDB() {
    try {
      console.log('🔍 ChromaDB Debug Information:');
      console.log('==================================');
      
      // Check if initialized
      console.log(`Initialized: ${this.isInitialized}`);
      
      // Check collections
      for (const [key, collection] of Object.entries(this.collections)) {
        if (collection) {
          try {
            const count = await collection.count();
            console.log(`${key}: ${count} entries`);
          } catch (error) {
            console.log(`${key}: ERROR - ${error.message}`);
          }
        } else {
          console.log(`${key}: NOT INITIALIZED`);
        }
      }
      
      // Test search
      if (this.collections.knowledgeBase) {
        console.log('\n🔎 Testing knowledge base search:');
        try {
          const testResults = await this.collections.knowledgeBase.query({
            queryTexts: ['exam dates'],
            nResults: 3,
            include: ['documents', 'metadatas', 'distances']
          });
          console.log(`Found ${testResults.documents[0].length} results for test query`);
          testResults.documents[0].forEach((doc, i) => {
            console.log(`  Result ${i + 1}: ${doc.substring(0, 100)}... (similarity: ${(1 - testResults.distances[0][i]).toFixed(3)})`);
          });
        } catch (error) {
          console.log(`Search test failed: ${error.message}`);
        }
      }
      
      console.log('==================================');
      
    } catch (error) {
      console.error('Debug failed:', error);
    }
  }

  /**
   * Generate text embeddings using Google Generative AI
   */
  async generateEmbedding(text) {
    try {
      const result = await embeddingModel.embedContent(text);
      return result.embedding.values;
    } catch (error) {
      console.error('Error generating embedding with Gemini:', error);
      // Fallback: return a random embedding for development
      return Array(768).fill(0).map(() => Math.random() - 0.5); // Gemini embeddings are 768-dimensional
    }
  }

  /**
   * Add chat message to ChromaDB
   */
  async addChatMessage(messageData) {
    console.log('\n💬 ===== CHROMADB SERVICE: ADD CHAT MESSAGE =====');
    console.log('📝 Message Data:', {
      id: messageData.id,
      sender: messageData.sender,
      textLength: messageData.text?.length || 0,
      chatId: messageData.chatId,
      userId: messageData.userId,
      language: messageData.language
    });
    
    await this.initialize();
    
    try {
      const { id, text, sender, chatId, userId, language, timestamp } = messageData;
      
      if (!this.collections.chatHistory) {
        console.error('❌ Chat history collection not initialized!');
        throw new Error('Chat history collection not available');
      }
      
      const documentId = `chat_${chatId}_${id}`;
      const metadata = {
        message_id: String(id),
        sender: sender,
        chat_id: chatId || 'unknown',
        user_id: userId || 'anonymous',
        language: language || 'English',
        timestamp: timestamp || new Date().toISOString(),
        text_length: text?.length || 0
      };
      
      console.log('📊 Adding to ChromaDB collection:', COLLECTIONS.CHAT_HISTORY);
      console.log('🆔 Document ID:', documentId);
      console.log('📋 Metadata:', metadata);
      
      await this.collections.chatHistory.add({
        documents: [text],
        metadatas: [metadata],
        ids: [documentId]
      });
      
      console.log(`✅ Successfully added chat message: ${id}`);
      return true;
      
    } catch (error) {
      console.error('❌ Error adding chat message to ChromaDB:', {
        message: error.message,
        stack: error.stack?.substring(0, 200)
      });
      return false;
    }
  }

  /**
   * Search for similar messages or content
   */
  async semanticSearch(query, options = {}) {
    await this.initialize();
    
    try {
      const {
        collection = 'chatHistory',
        limit = 5,
        minSimilarity = 0.7,
        filters = {}
      } = options;
      
      const collectionToSearch = this.collections[collection];
      if (!collectionToSearch) {
        throw new Error(`Collection ${collection} not found`);
      }
      
      // Perform similarity search using query text (ChromaDB will handle embedding)
      const results = await collectionToSearch.query({
        queryTexts: [query],
        nResults: limit,
        where: filters
      });
      
      // Format results
      const formattedResults = [];
      if (results.documents && results.documents[0]) {
        for (let i = 0; i < results.documents[0].length; i++) {
          const distance = results.distances[0][i];
          const similarity = 1 - distance; // Convert distance to similarity
          
          if (similarity >= minSimilarity) {
            formattedResults.push({
              document: results.documents[0][i],
              metadata: results.metadatas[0][i],
              similarity: similarity,
              id: results.ids[0][i]
            });
          }
        }
      }
      
      return formattedResults;
    } catch (error) {
      console.error('Error performing semantic search:', error);
      return [];
    }
  }

  /**
   * Get chat context for a conversation
   */
  async getChatContext(chatId, limit = 10) {
    await this.initialize();
    
    try {
      const results = await this.collections.chatHistory.get({
        where: { chat_id: chatId },
        limit: limit
      });
      
      return results.documents || [];
    } catch (error) {
      console.error('Error getting chat context:', error);
      return [];
    }
  }

  /**
   * Add knowledge base entry
   */
  async addKnowledgeEntry(data) {
    await this.initialize();
    
    try {
      const { id, title, content, category, tags, source, metadata } = data;
      
      // Validate required fields
      if (!id || !title || !content) {
        throw new Error('Missing required fields: id, title, or content');
      }
      
      // Combine title and content for better search
      const fullText = `${title}\n\n${content}`;
      
      // Merge provided metadata with standard metadata
      const finalMetadata = {
        title: title,
        content: content,
        category: category || 'general',
        tags: Array.isArray(tags) ? tags.join(', ') : (tags || ''),
        source: source || 'manual',
        created_at: new Date().toISOString(),
        content_length: content.length,
        ...(metadata || {}) // Spread any additional metadata
      };
      
      await this.collections.knowledgeBase.add({
        documents: [fullText],
        metadatas: [finalMetadata],
        ids: [id]
      });
      
      console.log(`✅ Added knowledge entry: ${title}`);
      return { success: true, id, title };
    } catch (error) {
      console.error('❌ Error adding knowledge entry:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Enhanced knowledge search with comprehensive debugging
   */
  async searchKnowledge(query, limit = 3) {
    console.log('\n🔍 ===== CHROMADB SERVICE SEARCH DEBUG =====');
    console.log('📝 Query:', query);
    console.log('🔢 Limit:', limit);
    console.log('⏰ Timestamp:', new Date().toISOString());
    console.log('🔧 Initialized:', this.isInitialized);
    
    try {
      await this.initialize();
      
      if (!this.collections.knowledgeBase) {
        console.log('❌ Knowledge base collection not found!');
        return [];
      }
      
      console.log('📊 Checking knowledge base collection count...');
      const count = await this.collections.knowledgeBase.count();
      console.log(`� Knowledge base has ${count} entries total`);
      
      if (count === 0) {
        console.log('❌ CRITICAL: Knowledge base is EMPTY!');
        console.log('💡 No context will be available for MEENA');
        console.log('🔧 Fix: Run populate script to add data');
        return [];
      } else {
        console.log(`✅ Knowledge base ready with ${count} entries`);
      }
      
      const results = await this.collections.knowledgeBase.query({
        queryTexts: [query],
        nResults: limit,
        include: ['documents', 'metadatas', 'distances']
      });
      
      console.log(`🎯 Search returned ${results.documents[0]?.length || 0} results`);
      
      const formattedResults = [];
      if (results.documents && results.documents[0]) {
        results.documents[0].forEach((doc, i) => {
          const similarity = 1 - results.distances[0][i];
          const metadata = results.metadatas[0][i] || {};
          
          console.log(`  Result ${i + 1}: similarity=${similarity.toFixed(3)}, title="${metadata.title || 'Untitled'}"`);
          console.log(`    Content preview: ${doc.substring(0, 150)}...`);
          
          formattedResults.push({
            text: doc,
            content: doc,
            metadata: metadata,
            similarity: similarity,
            title: metadata.title || 'Untitled',
            category: metadata.category || 'general'
          });
        });
      }
      
      console.log(`✅ Returning ${formattedResults.length} knowledge results`);
      return formattedResults;
      
    } catch (error) {
      console.error('❌ Knowledge search failed:', error);
      return [];
    }
  }

  /**
   * Debug ChromaDB status
   */
  async debugStatus() {
    console.log('\n🔍 CHROMADB DEBUG STATUS:');
    console.log('================================');
    
    try {
      console.log(`Initialized: ${this.isInitialized}`);
      console.log(`Collections: ${Object.keys(this.collections).join(', ')}`);
      
      for (const [name, collection] of Object.entries(this.collections)) {
        if (collection) {
          try {
            const count = await collection.count();
            console.log(`${name}: ${count} entries`);
            
            if (count > 0 && name === 'knowledgeBase') {
              // Sample a few entries
              const sample = await collection.get({ limit: 3 });
              console.log(`  Sample entries:`);
              sample.documents.forEach((doc, i) => {
                const metadata = sample.metadatas[i] || {};
                console.log(`    ${i + 1}. "${metadata.title || 'Untitled'}": ${doc.substring(0, 100)}...`);
              });
            }
          } catch (error) {
            console.log(`${name}: ERROR - ${error.message}`);
          }
        } else {
          console.log(`${name}: NOT INITIALIZED`);
        }
      }
      
      console.log('================================\n');
      
    } catch (error) {
      console.error('Debug failed:', error);
    }
  }

  /**
   * Seed knowledge base with MANIT information
   */
  async seedKnowledgeBase() {
    const seedData = [
      {
        id: 'manit_overview',
        title: 'MANIT Overview',
        content: 'Maulana Azad National Institute of Technology (MANIT) is located in Bhopal, Madhya Pradesh. It is one of the National Institutes of Technology (NITs) in India, established in 1960. MANIT offers undergraduate, postgraduate, and doctoral programs in engineering, technology, architecture, and management.',
        category: 'general',
        tags: ['overview', 'about', 'history'],
        source: 'institutional'
      },
      {
        id: 'academic_calendar_2025',
        title: 'Academic Calendar 2025-26',
        content: 'Mid-Semester Exams: September 28 - October 5, 2025. End-Semester Exams: December 15 - December 30, 2025. Fee Payment Deadline: October 15, 2025 (Late fee ₹500 after this date). Scholarship Application Deadline: October 20, 2025.',
        category: 'academics',
        tags: ['exams', 'fees', 'deadlines', 'calendar'],
        source: 'academic_office'
      },
      {
        id: 'library_information',
        title: 'Library Services',
        content: 'Central Library Hours: 8:00 AM - 10:00 PM (Monday-Saturday), 9:00 AM - 6:00 PM (Sunday). The library operates 24/7 during examination periods. Digital resources, e-books, and research databases are available for students and faculty.',
        category: 'facilities',
        tags: ['library', 'hours', 'resources', 'books'],
        source: 'library'
      },
      {
        id: 'hostel_information',
        title: 'Hostel Accommodation',
        content: 'MANIT provides separate hostels for boys and girls. Boys hostels include Homi Jehangir Bhabha Bhawan, Vikram Sarabhai Bhawan, and others. A.P.J. Abdul Kalam Chhatrawas offers triple sharing (₹5000/semester), dual sharing (₹7500/semester), and single rooms (₹10000/semester). Girls hostel is Kalpana Chawla Bhawan.',
        category: 'accommodation',
        tags: ['hostel', 'accommodation', 'fees', 'rooms'],
        source: 'hostel_office'
      },
      {
        id: 'departments',
        title: 'Academic Departments',
        content: 'MANIT offers programs in Computer Science & Engineering (CSE), Electronics & Communication (ECE), Mechanical Engineering (ME), Civil Engineering (CE), Electrical Engineering (EE), Chemical Engineering (ChE), Architecture & Planning. Postgraduate programs include MBA, MCA, M.Tech, and PhD.',
        category: 'academics',
        tags: ['departments', 'programs', 'courses', 'degrees'],
        source: 'academic_office'
      }
    ];

    for (const data of seedData) {
      try {
        // Check if entry already exists
        const existing = await this.collections.knowledgeBase.get({
          ids: [data.id]
        });
        
        if (!existing.ids.includes(data.id)) {
          await this.addKnowledgeEntry(data);
        }
      } catch (error) {
        console.log(`Seeding knowledge entry: ${data.title}`);
        await this.addKnowledgeEntry(data);
      }
    }
  }

  /**
   * Get collection statistics
   */
  async getStats() {
    await this.initialize();
    
    try {
      const stats = {};
      
      for (const [name, collection] of Object.entries(this.collections)) {
        const count = await collection.count();
        stats[name] = { count };
      }
      
      return stats;
    } catch (error) {
      console.error('Error getting stats:', error);
      return {};
    }
  }

  /**
   * Clear a collection
   */
  async clearCollection(collectionName) {
    await this.initialize();
    
    try {
      if (this.collections[collectionName]) {
        await client.deleteCollection({ name: COLLECTIONS[collectionName.toUpperCase()] });
        console.log(`Cleared collection: ${collectionName}`);
        return true;
      }
      return false;
    } catch (error) {
      console.error(`Error clearing collection ${collectionName}:`, error);
      return false;
    }
  }
}

// Export singleton instance
const chromaDBService = new ChromaDBService();
export default chromaDBService;

// Export the class for testing purposes
export { ChromaDBService };