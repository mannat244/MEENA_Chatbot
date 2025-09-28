// Map Coordinates Parser - Utility for detecting and parsing MAP_COORDINATES{} patterns

export const parseMapCoordinates = (text) => {
  if (!text || typeof text !== 'string') return null;

  console.log('🗺️ Parsing text for MAP_COORDINATES:', text.substring(0, 200) + '...');

  // Regex to match MAP_COORDINATES{...} patterns - more flexible
  const mapRegex = /MAP_COORDINATES\s*\{([^}]+)\}/gi;
  const matches = [];
  let match;

  while ((match = mapRegex.exec(text)) !== null) {
    console.log('🎯 Found MAP_COORDINATES match:', match[0]);
    
    try {
      const coordsString = match[1].trim();
      console.log('📋 Parsing coordinates string:', coordsString);
      
      // Try to parse as JSON first
      let parsedData;
      try {
        // Add braces back for JSON parsing
        const jsonString = `{${coordsString}}`;
        console.log('🔧 Attempting JSON parse:', jsonString);
        parsedData = JSON.parse(jsonString);
        console.log('✅ JSON parsed successfully:', parsedData);
      } catch (jsonError) {
        console.log('❌ JSON parse failed, trying coordinate extraction');
        // If JSON parsing fails, try to parse as simple coordinates
        const coordsMatch = coordsString.match(/(-?\d+\.?\d*),\s*(-?\d+\.?\d*)/);
        if (coordsMatch) {
          parsedData = {
            coordinates: [parseFloat(coordsMatch[1]), parseFloat(coordsMatch[2])],
            title: 'Location',
            description: 'Requested location on campus'
          };
          console.log('✅ Coordinate extraction successful:', parsedData);
        } else {
          console.warn('❌ Could not parse coordinates:', coordsString);
          continue;
        }
      }

      // Validate that we have coordinates
      if (parsedData && parsedData.coordinates && Array.isArray(parsedData.coordinates) && parsedData.coordinates.length === 2) {
        matches.push({
          fullMatch: match[0],
          index: match.index,
          data: parsedData
        });
        console.log('✅ Added valid map match:', parsedData);
      } else {
        console.warn('❌ Invalid coordinates data:', parsedData);
      }
    } catch (error) {
      console.error('❌ Error parsing MAP_COORDINATES:', error);
    }
  }

  console.log('📊 Total map matches found:', matches.length);
  return matches.length > 0 ? matches : null;
};

export const renderTextWithMaps = (text, InteractiveMapComponent) => {
  const mapMatches = parseMapCoordinates(text);
  
  if (!mapMatches || !InteractiveMapComponent) {
    return { text, maps: [] };
  }

  // Sort matches by index in descending order to replace from end to beginning
  mapMatches.sort((a, b) => b.index - a.index);
  
  let processedText = text;
  const maps = [];

  mapMatches.forEach((match, index) => {
    // Replace the MAP_COORDINATES{} with a placeholder
    const mapPlaceholder = `[MAP_PLACEHOLDER_${index}]`;
    processedText = processedText.substring(0, match.index) + 
                   mapPlaceholder + 
                   processedText.substring(match.index + match.fullMatch.length);
    
    // Store map data for rendering
    maps.push({
      id: `map_${index}`,
      placeholder: mapPlaceholder,
      coordinates: match.data.coordinates,
      title: match.data.title || match.data.name || 'Location',
      description: match.data.description || match.data.info || ''
    });
  });

  return { text: processedText, maps };
};

// Location database with campus coordinates
// NOTE: This is now mostly handled by ChromaDB knowledge base
// Only keeping essential locations for fallback and basic system functionality
export const CAMPUS_LOCATIONS = {
  // Keep only essential buildings for system functionality
  'NTB': {
    name: 'New Technology Block (NTB)',
    coordinates: [23.217438984792697, 77.40852269998584],
    description: 'Main academic building with computer labs, lecture halls, and faculty offices.',
    category: 'academic'
  },
  'H10': {
    name: 'H10 Block',
    coordinates: [23.209486879043148, 77.41245462794596],
    description: 'Academic block with classrooms and departmental offices.',
    category: 'academic'
  },

  // Main facilities only - detailed hostel info should come from knowledge base
  'MAIN_GATE': {
    name: 'Main Gate',
    coordinates: [23.212000, 77.407500],
    description: 'Primary entrance to MANIT campus.',
    category: 'entrance'
  }
  
  /* 
  COMMENTED OUT - This data should come from ChromaDB knowledge base instead of being hardcoded
  
  // Hostels - These should be dynamically loaded from knowledge base
  'HOSTEL_1': {
    name: 'Boys Hostel 1',
    coordinates: [23.215000, 77.408000],
    description: 'First boys hostel with dining facilities.',
    category: 'hostel'
  },
  'HOSTEL_2': {
    name: 'Boys Hostel 2', 
    coordinates: [23.216000, 77.409000],
    description: 'Second boys hostel complex.',
    category: 'hostel'
  },
  'HOSTEL_3': {
    name: 'Boys Hostel 3',
    coordinates: [23.217000, 77.410000],
    description: 'Third boys hostel facility.',
    category: 'hostel'
  },
  'HOSTEL_4': {
    name: 'Boys Hostel 4',
    coordinates: [23.218000, 77.411000],
    description: 'Fourth boys hostel complex.',
    category: 'hostel'
  },
  'HOSTEL_5': {
    name: 'Boys Hostel 5',
    coordinates: [23.219000, 77.412000],
    description: 'Fifth boys hostel facility.',
    category: 'hostel'
  },
  'HOSTEL_10': {
    name: 'Hostel 10 CD',
    coordinates: [23.220000, 77.413000],
    description: 'Hostel 10 CD with Nescafe counter and dining facilities.',
    category: 'hostel'
  },
  'GIRLS_HOSTEL': {
    name: 'Girls Hostel',
    coordinates: [23.214000, 77.407000],
    description: 'Girls hostel with security and amenities.',
    category: 'hostel'
  },
  
  // Other facilities - should come from knowledge base
  'LIBRARY': {
    name: 'Central Library',
    coordinates: [23.216500, 77.409500],
    description: 'Main library with books, journals, and digital resources.',
    category: 'facility'
  },
  'CANTEEN': {
    name: 'Main Canteen',
    coordinates: [23.215500, 77.408800],
    description: 'Primary dining facility for students and staff.',
    category: 'facility'
  },
  'MEDICAL_CENTER': {
    name: 'Medical Center',
    coordinates: [23.214800, 77.408200],
    description: 'Campus healthcare facility with doctor and basic medical services.',
    category: 'facility'
  },
  'SPORTS_COMPLEX': {
    name: 'Sports Complex',
    coordinates: [23.213500, 77.410000],
    description: 'Sports facilities including gymnasium, courts, and playground.',
    category: 'facility'
  },
  'BACK_GATE': {
    name: 'Back Gate',
    coordinates: [23.217000, 77.411000],
    description: 'Secondary entrance near hostels.',
    category: 'entrance'
  }
  */
};

// Function to search for locations in user queries
export const findLocationInQuery = (query) => {
  if (!query || typeof query !== 'string') return null;
  
  const normalizedQuery = query.toLowerCase().trim();
  console.log('🔍 Location search for query:', normalizedQuery);
  
  // Only check the minimal hardcoded locations for essential system functionality
  // Most location data should come from ChromaDB knowledge base instead
  for (const [key, location] of Object.entries(CAMPUS_LOCATIONS)) {
    if (location.name.toLowerCase() === normalizedQuery ||
        normalizedQuery.includes(location.name.toLowerCase()) ||
        normalizedQuery.includes(key.toLowerCase())) {
      console.log('✅ Essential location match found:', location.name);
      return { key, ...location };
    }
  }

  // Detect if this is a location-related query that should be handled by ChromaDB
  const locationKeywords = [
    'where is', 'location of', 'find', 'hostel', 'block', 'building', 
    'library', 'canteen', 'gate', 'medical', 'sports', 'campus',
    'room', 'office', 'department', 'lab', 'hall', 'directions to'
  ];
  
  const isLocationQuery = locationKeywords.some(keyword => 
    normalizedQuery.includes(keyword)
  );
  
  if (isLocationQuery) {
    console.log('🎯 Detected location query - should be handled by ChromaDB knowledge base');
    // Return null so the chat API can search the knowledge base for detailed location info
    return null;
  }

  console.log('❌ No location matches found and not a location query:', normalizedQuery);
  return null;
};

// Generate map response for location queries
export const generateMapResponse = (location, userQuery) => {
  if (!location) return null;

  const mapData = {
    coordinates: location.coordinates,
    title: location.name,
    description: location.description
  };

  const response = `📍 **${location.name}**

${location.description}

MAP_COORDINATES{"coordinates": [${location.coordinates[0]}, ${location.coordinates[1]}], "title": "${location.name}", "description": "${location.description}"}

**Category:** ${location.category}
**Coordinates:** ${location.coordinates[0]}, ${location.coordinates[1]}

You can interact with the map above to get directions or explore the area around ${location.name}.`;

  return response;
};