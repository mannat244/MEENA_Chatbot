import { ChromaClient } from 'chromadb';
import { GoogleGenAI } from '@google/genai';
import { manitKnowledgeBase } from '../data/comprehensive-knowledge-base.js';
import 'dotenv/config';

// Initialize clients
const client = new ChromaClient({
  host: "localhost",
  port: 8000
});

const genAI = new GoogleGenAI({
  apiKey: process.env.GOOGLE_API_KEY
});

// Custom embedding function
class GeminiEmbeddingFunction {
  async generate(texts) {
    console.log(`Generating embeddings for ${texts.length} texts...`);
    
    try {
      const truncatedTexts = texts.map(text => 
        text.length > 2000 ? text.substring(0, 2000) : text
      );
      
      const response = await genAI.models.embedContent({
        model: 'gemini-embedding-001',
        contents: truncatedTexts,
        taskType: 'RETRIEVAL_DOCUMENT',
        outputDimensionality: 768
      });
      
      const embeddings = response.embeddings.map(e => e.values);
      console.log(`✅ Generated ${embeddings.length} embeddings`);
      return embeddings;
      
    } catch (error) {
      console.error('❌ Error generating embeddings:', error);
      throw error;
    }
  }
}

const geminiEmbedder = new GeminiEmbeddingFunction();

async function populateKnowledgeBase() {
  try {
    console.log('🚀 Starting Knowledge Base Population');
    console.log('====================================');
    
    // Get or create collection
    let collection;
    try {
      collection = await client.getCollection({
        name: "meena_knowledge_base",
        embeddingFunction: geminiEmbedder
      });
      console.log('✅ Found existing collection');
    } catch (error) {
      console.log('📁 Creating new collection...');
      collection = await client.createCollection({
        name: "meena_knowledge_base",
        embeddingFunction: geminiEmbedder,
        metadata: { 
          description: "MANIT knowledge base and institutional information",
          created_at: new Date().toISOString()
        }
      });
      console.log('✅ Collection created');
    }
    
    // Check current count
    const currentCount = await collection.count();
    console.log(`📊 Current entries in collection: ${currentCount}`);
    
    // Clear existing data if needed
    if (currentCount > 0) {
      console.log('🧹 Clearing existing data...');
      await client.deleteCollection({ name: "meena_knowledge_base" });
      collection = await client.createCollection({
        name: "meena_knowledge_base",
        embeddingFunction: geminiEmbedder,
        metadata: { 
          description: "MANIT knowledge base and institutional information",
          created_at: new Date().toISOString()
        }
      });
    }
    
    // Prepare data for batch insertion
    console.log(`📚 Preparing ${manitKnowledgeBase.length} knowledge entries...`);
    
    const documents = [];
    const metadatas = [];
    const ids = [];
    
    for (const entry of manitKnowledgeBase) {
      // Combine title and content for better search
      const fullText = `${entry.title}\n\n${entry.content}`;
      
      documents.push(fullText);
      metadatas.push({
        title: entry.title,
        category: entry.category,
        subcategory: entry.subcategory || 'general',
        tags: Array.isArray(entry.tags) ? entry.tags.join(', ') : entry.tags,
        source: entry.source || 'official',
        priority: entry.priority || 'medium',
        status: entry.status || 'active',
        last_updated: entry.last_updated || new Date().toISOString(),
        created_at: new Date().toISOString(),
        content_length: entry.content.length
      });
      ids.push(entry.id);
    }
    
    // Batch insert (process in chunks to avoid memory issues)
    const chunkSize = 10;
    for (let i = 0; i < documents.length; i += chunkSize) {
      const chunk = {
        documents: documents.slice(i, i + chunkSize),
        metadatas: metadatas.slice(i, i + chunkSize),
        ids: ids.slice(i, i + chunkSize)
      };
      
      console.log(`📝 Processing chunk ${Math.floor(i/chunkSize) + 1}/${Math.ceil(documents.length/chunkSize)} (${chunk.documents.length} items)...`);
      
      await collection.add(chunk);
      
      // Small delay to avoid overwhelming the API
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Verify insertion
    const finalCount = await collection.count();
    console.log(`✅ Population complete! Total entries: ${finalCount}`);
    
    // Test search
    console.log('\n🔍 Testing search functionality...');
    const testQueries = [
      'exam dates',
      'hostel fees',
      'library hours',
      'admission process'
    ];
    
    for (const query of testQueries) {
      try {
        const results = await collection.query({
          queryTexts: [query],
          nResults: 2,
          include: ['documents', 'metadatas', 'distances']
        });
        
        console.log(`\nQuery: "${query}"`);
        if (results.documents[0].length > 0) {
          results.documents[0].forEach((doc, index) => {
            const metadata = results.metadatas[0][index];
            const similarity = (1 - results.distances[0][index]).toFixed(3);
            console.log(`  ✅ "${metadata.title}" (similarity: ${similarity})`);
          });
        } else {
          console.log(`  ❌ No results found`);
        }
      } catch (error) {
        console.log(`  ⚠️ Search test failed: ${error.message}`);
      }
    }
    
    console.log('\n🎉 Knowledge base population completed successfully!');
    console.log('💡 You can now use MEENA with MANIT-specific knowledge.');
    console.log('🔗 Access admin dashboard: http://localhost:3000/admin');
    
  } catch (error) {
    console.error('❌ Population failed:', error);
    console.log('\n💡 Troubleshooting:');
    console.log('   1. Make sure ChromaDB server is running: chroma run --host localhost --port 8000');
    console.log('   2. Check GOOGLE_API_KEY in .env.local');
    console.log('   3. Verify network connectivity');
  }
}

// Run the population
populateKnowledgeBase().catch(console.error);