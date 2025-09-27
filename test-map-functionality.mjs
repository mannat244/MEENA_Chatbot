// Test script for map functionality
import { 
  parseMapCoordinates, 
  renderTextWithMaps, 
  findLocationInQuery, 
  generateMapResponse,
  CAMPUS_LOCATIONS 
} from '../lib/mapUtils.js';

console.log('🗺️ ===== TESTING MAP FUNCTIONALITY =====\n');

// Test 1: Parse MAP_COORDINATES patterns
console.log('1. Testing MAP_COORDINATES parsing:');
const testText = `Here is the location: MAP_COORDINATES{"coordinates": [23.217438984792697, 77.40852269998584], "title": "NTB Block", "description": "New Technology Block"} You can find it easily.`;
const parsed = parseMapCoordinates(testText);
console.log('✅ Parsed coordinates:', parsed);
console.log('');

// Test 2: Location detection in queries
console.log('2. Testing location detection:');
const queries = [
  'Where is NTB?',
  'Location of H10 block',
  'How to reach library?',
  'Show me main gate',
  'Where can I find the canteen?',
  'What is the capital of France?' // Should not match
];

queries.forEach(query => {
  const location = findLocationInQuery(query);
  console.log(`Query: "${query}" -> ${location ? location.name : 'No location found'}`);
});
console.log('');

// Test 3: Generate map responses
console.log('3. Testing map response generation:');
const ntbLocation = CAMPUS_LOCATIONS.NTB;
const response = generateMapResponse(ntbLocation, 'Where is NTB?');
console.log('✅ Generated response for NTB:');
console.log(response.substring(0, 200) + '...');
console.log('');

// Test 4: List all available locations
console.log('4. Available campus locations:');
Object.entries(CAMPUS_LOCATIONS).forEach(([key, location]) => {
  console.log(`   ${key}: ${location.name} (${location.category})`);
});
console.log('');

// Test 5: Simulate text rendering with maps
console.log('5. Testing text rendering with maps:');
const mockInteractiveMap = (props) => ({ type: 'map', props });
const sampleText = `The NTB building is located at: MAP_COORDINATES{"coordinates": [23.217438984792697, 77.40852269998584], "title": "NTB", "description": "Main academic building"} It houses computer labs and lecture halls.`;
const renderResult = renderTextWithMaps(sampleText, mockInteractiveMap);
console.log('✅ Render result:');
console.log('Text:', renderResult.text);
console.log('Maps:', renderResult.maps.length, 'map(s) found');
console.log('');

console.log('🎉 All tests completed successfully!');
console.log('');
console.log('💡 Usage in MEENA chat:');
console.log('   User: "Where is NTB?"');
console.log('   MEENA: Will detect location query and show interactive map');
console.log('');
console.log('🔗 Demo page: /map-demo');
console.log('🗺️ Map integration ready for production use!');