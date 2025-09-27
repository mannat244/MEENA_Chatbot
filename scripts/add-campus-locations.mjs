// Add campus locations to ChromaDB knowledge base
import { CAMPUS_LOCATIONS } from '../lib/mapUtils.js';

const getChromaService = async () => {
  try {
    const chromaDBModule = await import('../lib/chromadb.js');
    const service = chromaDBModule.default;
    return service;
  } catch (error) {
    console.error('ChromaDB loading failed:', error.message);
    throw new Error('ChromaDB service unavailable');
  }
};

async function addLocationToKnowledgeBase() {
  console.log('🗺️ ===== ADDING CAMPUS LOCATIONS TO KNOWLEDGE BASE =====');
  
  try {
    const chromaService = await getChromaService();
    await chromaService.initialize();
    console.log('✅ ChromaDB service ready');

    let successCount = 0;
    let failCount = 0;

    for (const [key, location] of Object.entries(CAMPUS_LOCATIONS)) {
      try {
        const knowledgeEntry = {
          id: `location_${key.toLowerCase()}`,
          title: `${location.name} - MANIT Campus Location`,
          content: `${location.name} is located at coordinates ${location.coordinates[0]}, ${location.coordinates[1]} on the MANIT campus. ${location.description}

**Location Details:**
- Name: ${location.name}
- Category: ${location.category}
- Coordinates: ${location.coordinates[0]}, ${location.coordinates[1]}
- Description: ${location.description}

**Common Names:** ${location.name}, ${key}

**Directions:** This location can be found on the interactive campus map at the specified coordinates. Use the campus navigation system or ask for directions from the main gate.`,
          category: 'campus_location',
          tags: [
            'location',
            'campus',
            'directions',
            location.category,
            key.toLowerCase(),
            ...location.name.toLowerCase().split(' ')
          ],
          source: 'campus_database',
          metadata: {
            location_key: key,
            coordinates: location.coordinates,
            category: location.category,
            name: location.name,
            searchable_terms: [
              key.toLowerCase(),
              location.name.toLowerCase(),
              ...location.name.toLowerCase().split(' '),
              location.category
            ]
          }
        };

        const result = await chromaService.addKnowledgeEntry(knowledgeEntry);
        
        if (result.success) {
          console.log(`✅ Added location: ${location.name}`);
          successCount++;
        } else {
          console.error(`❌ Failed to add ${location.name}:`, result.error);
          failCount++;
        }
      } catch (error) {
        console.error(`❌ Error adding ${location.name}:`, error.message);
        failCount++;
      }
    }

    console.log('\n📊 Location Addition Summary:');
    console.log(`✅ Successfully added: ${successCount} locations`);
    console.log(`❌ Failed to add: ${failCount} locations`);
    console.log(`📍 Total locations processed: ${Object.keys(CAMPUS_LOCATIONS).length}`);

    if (successCount > 0) {
      console.log('\n🎉 Campus locations successfully added to knowledge base!');
      console.log('Users can now ask questions like:');
      console.log('- "Where is NTB?"');
      console.log('- "Location of H10 block"');
      console.log('- "How to reach the library?"');
      console.log('- "Where is the main gate?"');
    }

  } catch (error) {
    console.error('❌ Failed to add locations to knowledge base:', error);
  }
}

// Run the script
addLocationToKnowledgeBase()
  .then(() => {
    console.log('🏁 Location addition process completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Location addition process failed:', error);
    process.exit(1);
  });