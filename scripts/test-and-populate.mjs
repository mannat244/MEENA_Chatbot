// Quick test to check ChromaDB status and populate if empty
import { ChromaClient } from 'chromadb';
import { GoogleGenerativeAI } from '@google/generative-ai';

const client = new ChromaClient({ path: "http://localhost:8000" });
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

// Test embedding function
class GeminiEmbeddingFunction {
  constructor() {
    this.model = genAI.getGenerativeModel({ model: "gemini-embedding-001" });
  }

  async generate(texts) {
    console.log(`🔧 Generating embeddings for ${texts.length} texts...`);
    try {
      const embeddings = [];
      for (const text of texts) {
        const result = await this.model.embedContent(text);
        embeddings.push(result.embedding.values);
      }
      console.log(`✅ Generated ${embeddings.length} embeddings successfully`);
      return embeddings;
    } catch (error) {
      console.error('❌ Embedding generation failed:', error);
      throw error;
    }
  }
}

async function testAndPopulate() {
  try {
    console.log('🔍 Testing ChromaDB Connection...');
    
    // Test connection
    await client.heartbeat();
    console.log('✅ ChromaDB server is running');

    // Check collections
    const collections = await client.listCollections();
    console.log('📁 Available collections:', collections.map(c => c.name));

    // Check or create manit_knowledge collection
    let collection;
    try {
      collection = await client.getCollection({
        name: "manit_knowledge",
      });
      console.log('📚 Found existing manit_knowledge collection');
    } catch (error) {
      console.log('📚 Creating new manit_knowledge collection...');
      collection = await client.createCollection({
        name: "manit_knowledge",
        embeddingFunction: new GeminiEmbeddingFunction()
      });
    }

    // Check collection stats
    const count = await collection.count();
    console.log(`📊 Collection contains ${count} entries`);

    if (count === 0) {
      console.log('📝 Adding test entries to knowledge base...');
      
      const testEntries = [
        {
          id: "test_exam_dates",
          text: "Mid-semester examinations at MANIT are scheduled from October 5-12, 2025. End-semester exams will be held from December 15-30, 2025. Students must register for exams through the ERP portal by October 1st.",
          metadata: {
            title: "Exam Schedule 2025-26",
            category: "academics",
            subcategory: "examinations",
            tags: "exams,dates,schedule,registration",
            source: "academic_office",
            lastUpdated: "2025-09-26"
          }
        },
        {
          id: "test_hostel_info",
          text: "MANIT hostels include Homi Bhabha Bhawan, Vikram Sarabhai Bhawan, and Kalpana Chawla Bhawan for girls. Room booking opens in July. Hostel fees are ₹5000-10000 per semester depending on occupancy type.",
          metadata: {
            title: "Hostel Information",
            category: "campus_life",
            subcategory: "accommodation",
            tags: "hostel,fees,booking,accommodation",
            source: "hostel_office",
            lastUpdated: "2025-09-26"
          }
        },
        {
          id: "test_fees_info",
          text: "MANIT fee payment deadline for academic year 2025-26 is October 15, 2025. Late fee of ₹500 applies after deadline. Academic fee is ₹65,000 per semester for B.Tech and ₹75,000 for M.Tech programs.",
          metadata: {
            title: "Fee Payment Information",
            category: "administrative",
            subcategory: "fees",
            tags: "fees,payment,deadline,late_fee",
            source: "accounts_office",
            lastUpdated: "2025-09-26"
          }
        }
      ];

      // Add entries one by one
      for (const entry of testEntries) {
        await collection.add({
          ids: [entry.id],
          documents: [entry.text],
          metadatas: [entry.metadata]
        });
        console.log(`✅ Added: ${entry.metadata.title}`);
      }

      console.log('🎉 Test data populated successfully');
    }

    // Test search functionality
    console.log('\n🔍 Testing search functionality...');
    const testQueries = ["exam dates", "hostel fees", "payment deadline"];
    
    for (const query of testQueries) {
      console.log(`\n📝 Testing query: "${query}"`);
      try {
        const results = await collection.query({
          queryTexts: [query],
          nResults: 2,
          include: ["documents", "metadatas", "distances"]
        });

        if (results.documents[0].length > 0) {
          console.log(`  ✅ Found ${results.documents[0].length} results`);
          results.documents[0].forEach((doc, i) => {
            const similarity = (1 - results.distances[0][i]).toFixed(3);
            const metadata = results.metadatas[0][i];
            console.log(`    ${i+1}. ${metadata.title} (similarity: ${similarity})`);
            console.log(`       ${doc.substring(0, 80)}...`);
          });
        } else {
          console.log('  ❌ No results found');
        }
      } catch (error) {
        console.log(`  ❌ Search error: ${error.message}`);
      }
    }

    console.log('\n✅ ChromaDB test completed successfully!');
    console.log('🎯 You can now test MEENA with these queries:');
    console.log('   - "When are the exams?"');
    console.log('   - "Tell me about hostel fees"');
    console.log('   - "What is the fee payment deadline?"');

  } catch (error) {
    console.error('❌ Test failed:', error);
    console.log('\n💡 Troubleshooting:');
    console.log('1. Make sure ChromaDB server is running: chroma run --host localhost --port 8000');
    console.log('2. Check environment variables in .env.local');
    console.log('3. Verify Google API key is valid');
  }
}

testAndPopulate();