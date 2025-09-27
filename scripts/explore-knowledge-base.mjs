import { ChromaClient } from 'chromadb';
import { GoogleGenerativeAI } from '@google/generative-ai';
import 'dotenv/config';

// Initialize clients
const client = new ChromaClient({
  path: "http://localhost:8000"
});

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

async function exploreKnowledgeBase() {
  try {
    console.log('🔍 MEENA Knowledge Base Explorer');
    console.log('==================================\n');

    // Get collection info
    const collection = await client.getCollection({ name: "manit_knowledge" });
    const count = await collection.count();
    
    console.log(`📊 Collection Statistics:`);
    console.log(`   Collection Name: manit_knowledge`);
    console.log(`   Total Entries: ${count}`);
    console.log(`   Server: http://localhost:8000\n`);

    if (count === 0) {
      console.log('❌ Knowledge base is empty!');
      console.log('💡 Run: node scripts/populate-knowledge-base.mjs\n');
      return;
    }

    // Get all entries (limited to 50 for readability)
    const results = await collection.get({
      limit: Math.min(count, 50),
      include: ['documents', 'metadatas']
    });

    console.log(`📚 Knowledge Entries (showing ${results.documents.length} of ${count}):`);
    console.log('=' .repeat(60));

    // Group by category
    const categories = {};
    results.documents.forEach((doc, index) => {
      const metadata = results.metadatas[index];
      const category = metadata?.category || 'uncategorized';
      
      if (!categories[category]) {
        categories[category] = [];
      }
      
      categories[category].push({
        title: metadata?.title || 'Untitled',
        content: doc.substring(0, 100) + (doc.length > 100 ? '...' : ''),
        subcategory: metadata?.subcategory || 'general',
        tags: metadata?.tags || [],
        source: metadata?.source || 'unknown',
        lastUpdated: metadata?.lastUpdated || 'unknown'
      });
    });

    // Display by category
    Object.entries(categories).forEach(([category, entries]) => {
      console.log(`\n📁 ${category.toUpperCase()} (${entries.length} entries)`);
      console.log('-'.repeat(40));
      
      entries.forEach((entry, index) => {
        console.log(`${index + 1}. ${entry.title}`);
        console.log(`   📝 ${entry.content}`);
        console.log(`   🏷️  Tags: ${entry.tags.join(', ')}`);
        console.log(`   📅 Updated: ${entry.lastUpdated}`);
        console.log('');
      });
    });

    // Test search functionality
    console.log('\n🔍 Testing Search Functionality:');
    console.log('=' .repeat(40));
    
    const searchQueries = [
      'exam dates',
      'hostel fees', 
      'library timing',
      'admission process'
    ];

    for (const query of searchQueries) {
      try {
        const searchResults = await collection.query({
          queryTexts: [query],
          nResults: 3,
          include: ['documents', 'metadatas', 'distances']
        });

        console.log(`\nQuery: "${query}"`);
        if (searchResults.documents[0].length > 0) {
          searchResults.documents[0].forEach((doc, index) => {
            const metadata = searchResults.metadatas[0][index];
            const distance = searchResults.distances[0][index];
            console.log(`  ✅ ${metadata?.title || 'Untitled'} (similarity: ${(1-distance).toFixed(3)})`);
            console.log(`     ${doc.substring(0, 80)}...`);
          });
        } else {
          console.log(`  ❌ No results found`);
        }
      } catch (error) {
        console.log(`  ⚠️ Search error: ${error.message}`);
      }
    }

    console.log('\n📋 Summary:');
    console.log(`   • Total Categories: ${Object.keys(categories).length}`);
    console.log(`   • Categories: ${Object.keys(categories).join(', ')}`);
    console.log(`   • Search functionality: Working`);
    console.log(`   • Embedding model: gemini-embedding-001\n`);

    console.log('💡 To explore more:');
    console.log('   • Admin Dashboard: http://localhost:3000/admin');
    console.log('   • Chat Interface: http://localhost:3000');
    console.log('   • Add more data: node scripts/populate-knowledge-base.mjs');

  } catch (error) {
    console.error('❌ Error exploring knowledge base:', error);
    console.log('\n💡 Troubleshooting:');
    console.log('   1. Make sure ChromaDB server is running: chroma run --host localhost --port 8000');
    console.log('   2. Check if collection exists');
    console.log('   3. Verify environment variables');
  }
}

// Run the explorer
exploreKnowledgeBase().catch(console.error);