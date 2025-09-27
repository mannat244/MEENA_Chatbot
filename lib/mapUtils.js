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
export const CAMPUS_LOCATIONS = {
  // Main Buildings
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
  'AB': {
    name: 'Administrative Block (AB)',
    coordinates: [23.209486879043148, 77.41245462794596],
    description: 'Administrative offices, registrar, and student services.',
    category: 'administrative'
  },

  // Hostels
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
  'GIRLS_HOSTEL': {
    name: 'Girls Hostel',
    coordinates: [23.214000, 77.407000],
    description: 'Girls hostel with security and amenities.',
    category: 'hostel'
  },

  // Facilities
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

  // Gates
  'MAIN_GATE': {
    name: 'Main Gate',
    coordinates: [23.212000, 77.407500],
    description: 'Primary entrance to MANIT campus.',
    category: 'entrance'
  },
  'BACK_GATE': {
    name: 'Back Gate',
    coordinates: [23.217000, 77.411000],
    description: 'Secondary entrance near hostels.',
    category: 'entrance'
  }
};

// Function to search for locations in user queries
export const findLocationInQuery = (query) => {
  if (!query || typeof query !== 'string') return null;
  
  const normalizedQuery = query.toLowerCase().trim();
  
  // Direct matches first
  for (const [key, location] of Object.entries(CAMPUS_LOCATIONS)) {
    const locationNames = [
      key.toLowerCase(),
      location.name.toLowerCase(),
      ...location.name.toLowerCase().split(' ')
    ];
    
    if (locationNames.some(name => normalizedQuery.includes(name))) {
      return { key, ...location };
    }
  }

  // Pattern matching for common location queries
  const patterns = [
    { regex: /where\s+is\s+(\w+)/i, group: 1 },
    { regex: /location\s+of\s+(\w+)/i, group: 1 },
    { regex: /(\w+)\s+location/i, group: 1 },
    { regex: /find\s+(\w+)/i, group: 1 },
    { regex: /(\w+)\s+block/i, group: 1 }
  ];

  for (const pattern of patterns) {
    const match = normalizedQuery.match(pattern.regex);
    if (match) {
      const searchTerm = match[pattern.group].toUpperCase();
      if (CAMPUS_LOCATIONS[searchTerm]) {
        return { key: searchTerm, ...CAMPUS_LOCATIONS[searchTerm] };
      }
    }
  }

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