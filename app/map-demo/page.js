'use client';

import { useState } from 'react';
import InteractiveMap from '../components/InteractiveMap';
import { CAMPUS_LOCATIONS, generateMapResponse } from '../../lib/mapUtils';
import { MapPin, Navigation, Search } from 'lucide-react';

export default function MapDemo() {
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredLocations = Object.entries(CAMPUS_LOCATIONS).filter(([key, location]) => 
    location.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    key.toLowerCase().includes(searchQuery.toLowerCase()) ||
    location.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center mb-4">
            <MapPin className="w-8 h-8 text-blue-600 mr-3" />
            <div>
              <h1 className="text-2xl font-bold text-gray-800">MANIT Campus Map Demo</h1>
              <p className="text-gray-600">Interactive campus locations with Leaflet maps integration</p>
            </div>
          </div>

          <div className="mb-6">
            <div className="relative">
              <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search locations (e.g., NTB, Library, Hostel...)"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Location List */}
            <div className="space-y-3">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Campus Locations</h2>
              <div className="max-h-96 overflow-y-auto space-y-2">
                {filteredLocations.map(([key, location]) => (
                  <div
                    key={key}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      selectedLocation?.key === key
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                    onClick={() => setSelectedLocation({ key, ...location })}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-medium text-gray-800">{location.name}</h3>
                        <p className="text-sm text-gray-600 mt-1">{location.description}</p>
                        <div className="flex items-center mt-2 text-xs text-gray-500">
                          <Navigation className="w-3 h-3 mr-1" />
                          <span>{location.coordinates[0].toFixed(4)}, {location.coordinates[1].toFixed(4)}</span>
                          <span className="mx-2">•</span>
                          <span className="bg-gray-100 px-2 py-0.5 rounded capitalize">{location.category}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Map Display */}
            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Interactive Map</h2>
              {selectedLocation ? (
                <InteractiveMap
                  coordinates={selectedLocation.coordinates}
                  title={selectedLocation.name}
                  description={selectedLocation.description}
                />
              ) : (
                <div className="bg-gray-100 rounded-lg h-64 flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <MapPin className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Select a location to view its map</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Usage Examples */}
          <div className="mt-8 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold text-blue-800 mb-2">How to use in chat:</h3>
            <div className="text-sm text-blue-700 space-y-1">
              <p>• Ask: "Where is NTB?" or "Location of New Technology Block"</p>
              <p>• Ask: "How to reach the library?" or "Where is the main gate?"</p>
              <p>• Ask: "Show me H10 block location" or "Directions to sports complex"</p>
            </div>
          </div>

          {/* Technical Info */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold text-gray-800 mb-2">Technical Implementation:</h3>
            <div className="text-sm text-gray-600 space-y-1">
              <p>• <strong>Maps:</strong> Leaflet.js with OpenStreetMap tiles</p>
              <p>• <strong>Integration:</strong> MAP_COORDINATES{} pattern detection</p>
              <p>• <strong>Knowledge Base:</strong> Campus locations stored in ChromaDB</p>
              <p>• <strong>Auto-Detection:</strong> Location queries trigger interactive maps</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}