import React, { useEffect, useRef, useState } from 'react';
import 'mapbox-gl/dist/mapbox-gl.css';
import '@mapbox/mapbox-gl-directions/dist/mapbox-gl-directions.css';
import mapboxgl from 'mapbox-gl';
import MapboxDirections from '@mapbox/mapbox-gl-directions/dist/mapbox-gl-directions';
import { mockEvents } from '../data/mockEvents';

// Mapbox access token
mapboxgl.accessToken = 'pk.eyJ1IjoibGltcGV0MTIzIiwiYSI6ImNtODRveW9ocDB5MDEya3JhaDRiMnFhYmYifQ.kWfb3QpMmybSvbbG4BgLhA';

// FAU bounds
const FAU_BOUNDS = {
  north: 26.3771,
  south: 26.3671,
  west: -80.1070,
  east: -80.0970
};

const MapPage: React.FC = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const directionsRef = useRef<MapboxDirections | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);

  // FAU Boca Raton coordinates
  const fauCenter: [number, number] = [-80.1020, 26.3721];

  useEffect(() => {
    if (!mapContainer.current) return;

    try {
      if (!mapboxgl.supported()) {
        throw new Error('Your browser does not support Mapbox GL');
      }

      // Add custom CSS for glowing markers
      const style = document.createElement('style');
      style.textContent = `
        .marker-glow {
          width: 25px;
          height: 25px;
          background-color: #CD1041;
          border-radius: 50%;
          cursor: pointer;
          animation: pulse 2s infinite;
          box-shadow: 0 0 0 rgba(205, 16, 65, 0.4);
          position: relative;
        }

        @keyframes pulse {
          0% {
            box-shadow: 0 0 0 0 rgba(205, 16, 65, 0.4);
          }
          70% {
            box-shadow: 0 0 0 10px rgba(205, 16, 65, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(205, 16, 65, 0);
          }
        }

        .marker-glow::after {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 15px;
          height: 15px;
          background-color: white;
          border-radius: 50%;
        }
      `;
      document.head.appendChild(style);

      const initializeMap = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: fauCenter,
        zoom: 15.5,
        minZoom: 14.5,
        maxZoom: 18,
        maxBounds: [
          [FAU_BOUNDS.west, FAU_BOUNDS.south], // Southwest coordinates
          [FAU_BOUNDS.east, FAU_BOUNDS.north]  // Northeast coordinates
        ]
      });

      map.current = initializeMap;

      initializeMap.on('error', (e) => {
        console.error('Map error:', e);
        setMapError('Error loading map. Please try again later.');
      });

      initializeMap.on('load', () => {
        // Add FAU boundary
        initializeMap.addSource('fau-area', {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'Polygon',
              coordinates: [[
                [FAU_BOUNDS.west, FAU_BOUNDS.south],
                [FAU_BOUNDS.east, FAU_BOUNDS.south],
                [FAU_BOUNDS.east, FAU_BOUNDS.north],
                [FAU_BOUNDS.west, FAU_BOUNDS.north],
                [FAU_BOUNDS.west, FAU_BOUNDS.south]
              ]]
            }
          }
        });

        initializeMap.addLayer({
          id: 'fau-area-fill',
          type: 'fill',
          source: 'fau-area',
          paint: {
            'fill-color': '#004B8D',
            'fill-opacity': 0.1
          }
        });

        initializeMap.addLayer({
          id: 'fau-area-border',
          type: 'line',
          source: 'fau-area',
          paint: {
            'line-color': '#004B8D',
            'line-width': 2
          }
        });

        // Add navigation controls
        initializeMap.addControl(new mapboxgl.NavigationControl(), 'top-right');

        // Function to handle getting directions
        const handleGetDirections = (eventCoords: [number, number]) => {
          if (!userLocation) {
            // If we don't have user location, try to get it first
            navigator.geolocation.getCurrentPosition(
              (position) => {
                const userCoords: [number, number] = [
                  position.coords.longitude,
                  position.coords.latitude
                ];
                setUserLocation(userCoords);
                if (map.current) {
                  updateUserLocationMarker(userCoords, map.current);
                }
                // Wait a bit for the directions control to be ready
                setTimeout(() => {
                  if (directionsRef.current) {
                    directionsRef.current.setOrigin(userCoords);
                    directionsRef.current.setDestination(eventCoords);
                  }
                }, 100);
              },
              (error) => {
                console.error("Error getting location:", error);
                alert('Please enable location services to get directions');
              },
              {
                enableHighAccuracy: true,
                timeout: 5000,
                maximumAge: 0
              }
            );
          } else {
            // If we already have user location, use it directly
            if (directionsRef.current) {
              // Convert coordinates to string format that Mapbox expects
              const originStr = `${userLocation[0]},${userLocation[1]}`;
              const destStr = `${eventCoords[0]},${eventCoords[1]}`;
              
              directionsRef.current.setOrigin(originStr);
              directionsRef.current.setDestination(destStr);
            }
          }
        };

        // Add directions control
        const directions = new MapboxDirections({
          accessToken: mapboxgl.accessToken,
          unit: 'imperial',
          profile: 'mapbox/walking',
          interactive: true,
          controls: {
            inputs: true,
            instructions: true,
            profileSwitcher: false
          },
          flyTo: false,
          bbox: [
            FAU_BOUNDS.west,
            FAU_BOUNDS.south,
            FAU_BOUNDS.east,
            FAU_BOUNDS.north
          ]
        });

        // Wait for directions control to be ready
        directions.on('load', () => {
          console.log('Directions control ready');
        });
        
        initializeMap.addControl(directions, 'top-left');
        directionsRef.current = directions;

        // Add event markers with custom styling and click handlers
        mockEvents.forEach(event => {
          // Create custom marker element
          const markerEl = document.createElement('div');
          markerEl.className = 'marker-glow';
          
          const popup = new mapboxgl.Popup({ offset: 25 })
            .setHTML(`
              <div class="text-center">
                <h3 class="font-semibold text-lg">${event.title}</h3>
                <p class="text-sm text-gray-600">${event.date} • ${event.time}</p>
                <button class="get-directions-btn bg-blue-600 text-white px-3 py-1 rounded mt-2 hover:bg-blue-700">
                  Get Directions
                </button>
                <a href="/events/${event.id}" class="inline-block mt-2 text-blue-600 hover:text-blue-800 ml-2">
                  View Details
                </a>
              </div>
            `);

          const marker = new mapboxgl.Marker({
            element: markerEl
          })
            .setLngLat([event.coordinates[1], event.coordinates[0]])
            .setPopup(popup)
            .addTo(initializeMap);

          // Add click handler for the marker
          markerEl.addEventListener('click', () => {
            handleGetDirections([event.coordinates[1], event.coordinates[0]]);
          });

          // Add click handler for the "Get Directions" button
          popup.on('open', () => {
            const btn = document.querySelector('.get-directions-btn');
            if (btn) {
              btn.addEventListener('click', () => {
                handleGetDirections([event.coordinates[1], event.coordinates[0]]);
              });
            }
          });
        });

        // Get initial user location and watch for changes
        if (navigator.geolocation) {
          const handlePositionUpdate = (position: GeolocationPosition) => {
            const userCoords: [number, number] = [
              position.coords.longitude,
              position.coords.latitude
            ];
            setUserLocation(userCoords);
            if (map.current) {
              updateUserLocationMarker(userCoords, map.current);
            }
          };

          // Get initial position
          navigator.geolocation.getCurrentPosition(
            handlePositionUpdate,
            (error) => {
              console.error("Error getting location:", error);
            },
            {
              enableHighAccuracy: true,
              timeout: 5000,
              maximumAge: 0
            }
          );

          // Watch for location changes
          const watchId = navigator.geolocation.watchPosition(
            handlePositionUpdate,
            (error) => {
              console.error("Error watching location:", error);
            },
            {
              enableHighAccuracy: true,
              timeout: 5000,
              maximumAge: 0
            }
          );

          // Cleanup watch on unmount
          return () => {
            navigator.geolocation.clearWatch(watchId);
          };
        }
      });

      return () => {
        map.current?.remove();
      };
    } catch (error) {
      console.error('Error initializing map:', error);
      setMapError('Error initializing map. Please check your browser compatibility.');
    }
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">FAU Campus Map</h1>
      
      {mapError ? (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {mapError}
        </div>
      ) : (
        <>
          <div className="bg-white p-4 rounded-lg shadow-md mb-8">
            <p className="text-gray-700">
              Explore FAU campus events and get walking directions. Click any marker to get directions from your current location.
              {userLocation ? " Your current location is shown in blue." : " Enable location services to see your position."}
            </p>
          </div>
          
          <div className="h-[600px] rounded-lg overflow-hidden shadow-lg relative">
            <div ref={mapContainer} className="absolute inset-0" />
          </div>
        </>
      )}
      
      <div className="mt-8 grid md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Campus Events</h2>
          <div className="space-y-4">
            {mockEvents.slice(0, 3).map(event => (
              <div key={event.id} className="flex items-start border-b border-gray-100 pb-4">
                <img 
                  src={event.image} 
                  alt={event.title}
                  className="w-16 h-16 object-cover rounded mr-4"
                />
                <div>
                  <h3 className="font-semibold">{event.title}</h3>
                  <p className="text-sm text-gray-600">{event.date} • {event.location}</p>
                  <a 
                    href={`/events/${event.id}`}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    View Details
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Navigation Tips</h2>
          <p className="text-gray-700 mb-4">
            How to use the campus map:
          </p>
          <ul className="list-disc list-inside text-gray-700 space-y-2">
            <li>Click any glowing red marker to view event details</li>
            <li>Click "Get Directions" to get walking directions from your location</li>
            <li>Use the navigation panel to modify routes or enter custom locations</li>
            <li>Your position is shown with a blue marker when location is enabled</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default MapPage;