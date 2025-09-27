'use client';

import { useEffect, useRef, useState, memo } from 'react';
import { MapPin, ExternalLink } from 'lucide-react';

const InteractiveMap = memo(({ coordinates, title, description }) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(null);

  // Parse coordinates from different formats
  const parseCoordinates = (coords) => {
    if (Array.isArray(coords) && coords.length === 2) {
      return { lat: parseFloat(coords[0]), lng: parseFloat(coords[1]) };
    }
    
    if (typeof coords === 'string') {
      // Handle "lat,lng" format
      const parts = coords.split(',').map(s => s.trim());
      if (parts.length === 2) {
        return { lat: parseFloat(parts[0]), lng: parseFloat(parts[1]) };
      }
    }
    
    if (coords && typeof coords === 'object' && coords.lat && coords.lng) {
      return { lat: parseFloat(coords.lat), lng: parseFloat(coords.lng) };
    }
    
    return null;
  };

  const openInGoogleMaps = () => {
    const parsedCoords = parseCoordinates(coordinates);
    if (parsedCoords) {
      const googleMapsUrl = `https://www.google.com/maps?q=${parsedCoords.lat},${parsedCoords.lng}`;
      window.open(googleMapsUrl, '_blank');
    }
  };

  const initializeMap = () => {
    if (!window.L || !mapRef.current || mapInstanceRef.current) return;

    try {
      const parsedCoords = parseCoordinates(coordinates);
      
      if (!parsedCoords || isNaN(parsedCoords.lat) || isNaN(parsedCoords.lng)) {
        setError('Invalid coordinates provided');
        return;
      }

      // Initialize the map with disabled interactions for small embed
      // Adjust zoom based on container size for better mobile experience
      const containerWidth = mapRef.current.offsetWidth;
      const mobileZoom = containerWidth < 300 ? 15 : 16;
      
      const map = window.L.map(mapRef.current, {
        center: [parsedCoords.lat, parsedCoords.lng],
        zoom: mobileZoom,
        zoomControl: false,
        attributionControl: false,
        dragging: false,
        scrollWheelZoom: false,
        doubleClickZoom: false,
        boxZoom: false,
        keyboard: false,
        tap: false,
        preferCanvas: true, // Use canvas for better performance
        fadeAnimation: false, // Disable fade animation to prevent flicker
        zoomAnimation: false, // Disable zoom animation
        markerZoomAnimation: false // Disable marker animations
      });

      // Add OpenStreetMap tiles with caching and performance options
      window.L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '',
        updateWhenIdle: true, // Only update tiles when map is idle
        updateWhenZooming: false, // Don't update during zoom
        keepBuffer: 2, // Keep more tiles in memory
        updateInterval: 200 // Reduce update frequency
      }).addTo(map);

      // Add a marker
      window.L.marker([parsedCoords.lat, parsedCoords.lng]).addTo(map);
      
      // Add a circle to highlight the area
      window.L.circle([parsedCoords.lat, parsedCoords.lng], {
        color: '#3b82f6',
        fillColor: '#3b82f6',
        fillOpacity: 0.2,
        radius: 30
      }).addTo(map);

      mapInstanceRef.current = map;
      setIsLoaded(true);
      
      // Ensure map tiles load properly - single call, no repeated invalidation
      setTimeout(() => {
        if (mapInstanceRef.current) {
          map.invalidateSize();
        }
      }, 150);
      
    } catch (err) {
      console.error('Map initialization error:', err);
      setError('Failed to initialize map');
    }
  };

  // Wait for Leaflet to load - use useMemo to prevent re-initialization
  useEffect(() => {
    if (mapInstanceRef.current) return; // Don't re-initialize if map exists

    const checkLeaflet = () => {
      if (window.L) {
        initializeMap();
      } else {
        setTimeout(checkLeaflet, 100);
      }
    };
    
    checkLeaflet();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        setIsLoaded(false);
      }
    };
  }, []); // Remove coordinates dependency to prevent re-initialization

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-2 mb-2 cursor-pointer hover:bg-red-100 transition-colors max-w-xs sm:max-w-sm md:max-w-md mx-auto" onClick={openInGoogleMaps}>
        <div className="flex items-center text-red-800 text-xs">
          <MapPin className="w-3 h-3 mr-1 flex-shrink-0" />
          <span className="truncate mr-1">Map unavailable - Tap to open</span>
          <ExternalLink className="w-3 h-3 flex-shrink-0" />
        </div>
      </div>
    );
  }

  return (
    <div 
      className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm cursor-pointer hover:shadow-md transition-shadow w-full" 
      onClick={openInGoogleMaps}
      style={{ maxWidth: '100%' }}
    >
      {/* Mini Map Header */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-2 py-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center min-w-0 flex-1">
            <MapPin className="w-3 h-3 mr-1 flex-shrink-0" />
            <span className="font-medium text-xs truncate">
              {title || 'Location Map'}
            </span>
          </div>
          <ExternalLink className="w-3 h-3 flex-shrink-0 ml-1" />
        </div>
      </div>

      {/* Compact Map Container - Responsive height and mobile optimized */}
      <div className="relative">
        <div 
          ref={mapRef} 
          className="w-full h-20 xs:h-24 sm:h-28 md:h-32 bg-gray-100"
          style={{ 
            minHeight: '80px',
            maxHeight: '128px',
            contain: 'layout style', // CSS containment for better performance
            willChange: 'auto' // Optimize for animations
          }}
        />
        
        {!isLoaded && !error && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
            <div className="text-center">
              <div className="animate-spin w-3 h-3 sm:w-4 sm:h-4 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-1"></div>
              <p className="text-gray-600 text-xs">Loading...</p>
            </div>
          </div>
        )}

        {/* Click overlay for better UX */}
        <div className="absolute inset-0 bg-transparent hover:bg-blue-500 hover:bg-opacity-10 transition-colors flex items-center justify-center opacity-0 hover:opacity-100">
          <div className="bg-white bg-opacity-90 rounded-full p-1 sm:p-2 shadow-lg">
            <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600" />
          </div>
        </div>
      </div>

      {/* Compact Footer - Mobile optimized */}
      <div className="bg-gray-50 px-2 py-1 border-t">
        <div className="flex items-center justify-between text-xs text-gray-600">
          <span className="truncate mr-1 text-xs sm:text-xs">{description || 'Tap to open in Google Maps'}</span>
          <span className="text-blue-600 whitespace-nowrap text-xs">Open →</span>
        </div>
      </div>
    </div>
  );
});

InteractiveMap.displayName = 'InteractiveMap';

export default InteractiveMap;