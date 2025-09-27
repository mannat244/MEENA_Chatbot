import chromaDBService from '../lib/chromadb.js';
import { manitKnowledgeBase } from '../data/comprehensive-knowledge-base.js';

// Initialize ChromaDB service
const chromaService = chromaDBService;

/**
 * Populate the knowledge base with comprehensive MANIT information
 */
async function populateKnowledgeBase() {
  try {
    console.log('🚀 Starting comprehensive knowledge base population...');
    
    // Initialize ChromaDB
    await chromaService.initialize();
    console.log('✅ ChromaDB initialized');
    
    // Add each knowledge entry
    let successCount = 0;
    let failCount = 0;
    
    console.log(`\n📚 Adding ${manitKnowledgeBase.length} knowledge entries...`);
    
    for (const entry of manitKnowledgeBase) {
      try {
        const success = await chromaService.addKnowledgeEntry(entry);
        if (success) {
          console.log(`✅ Added: ${entry.title}`);
          successCount++;
        } else {
          console.log(`❌ Failed: ${entry.title}`);
          failCount++;
        }
      } catch (error) {
        console.error(`❌ Error adding knowledge entry: ${entry.title}`, error.message);
        failCount++;
      }
      
      // Small delay to avoid overwhelming the API
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    console.log(`\n📊 Population Summary:`);
    console.log(`✅ Successfully added: ${successCount} entries`);
    console.log(`❌ Failed: ${failCount} entries`);
    console.log(`📈 Success rate: ${((successCount / manitKnowledgeBase.length) * 100).toFixed(1)}%`);
    
    // Test search functionality
    console.log(`\n🔍 Testing search functionality...`);
    const testQueries = [
      'fee structure',
      'hostel accommodation',
      'academic calendar',
      'CSE department',
      'placement statistics',
      'library timings',
      'admission process'
    ];
    
    for (const query of testQueries) {
      try {
        console.log(`\n🔎 Searching for: "${query}"`);
        const results = await chromaService.semanticSearch(query, {
          limit: 3
        });
        
        if (results && results.length > 0) {
          console.log(`📋 Found ${results.length} relevant results:`);
          results.forEach((result, index) => {
            console.log(`  ${index + 1}. ${result.title} (similarity: ${result.similarity?.toFixed(3) || 'N/A'})`);
          });
        } else {
          console.log(`❌ No results found for "${query}"`);
        }
      } catch (error) {
        console.error(`❌ Search error for "${query}":`, error.message);
      }
    }
    
    console.log('\n🎉 Comprehensive knowledge base population completed!');
    
  } catch (error) {
    console.error('❌ Failed to populate knowledge base:', error);
    throw error;
  }
}

// Run the population script
populateKnowledgeBase()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });