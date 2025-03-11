import React, { useEffect, useRef, useState } from 'react';
import 'mapbox-gl/dist/mapbox-gl.css';
import '@mapbox/mapbox-gl-directions/dist/mapbox-gl-directions.css';
import mapboxgl from 'mapbox-gl';
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
  const [mapError, setMapError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [directions, setDirections] = useState<{
    duration: number;
    distance: number;
    steps: Array<{
      instruction: string;
      distance: number;
    }>;
  } | null>(null);

  // FAU Boca Raton coordinates
  const fauCenter: [number, number] = [-80.1020, 26.3721];

  const getDirections = async (start: [number, number], end: [number, number]) => {
    try {
      const response = await fetch(
        `https://api.mapbox.com/directions/v5/mapbox/walking/${start[0]},${start[1]};${end[0]},${end[1]}?steps=true&geometries=geojson&access_token=${mapboxgl.accessToken}`
      );
      const data = await response.json();
      
      if (data.code !== 'Ok') {
        throw new Error('Unable to find directions');
      }

      const route = data.routes[0];
      setDirections({
        duration: Math.round(route.duration / 60), // Convert to minutes
        distance: Math.round(route.distance * 0.000621371 * 100) / 100, // Convert to miles
        steps: route.legs[0].steps.map((step: any) => ({
          instruction: step.maneuver.instruction,
          distance: Math.round(step.distance * 3.28084) // Convert to feet
        }))
      });

      // Draw the route on the map
      if (map.current) {
        // Remove existing route if any
        if (map.current.getSource('route')) {
          map.current.removeLayer('route');
          map.current.removeSource('route');
        }

        map.current.addSource('route', {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: route.geometry
          }
        });

        map.current.addLayer({
          id: 'route',
          type: 'line',
          source: 'route',
          layout: {
            'line-join': 'round',
            'line-cap': 'round'
          },
          paint: {
            'line-color': '#4B9DFF',
            'line-width': 4,
            'line-opacity': 0.8
          }
        });

        // Fit the map to show the full route
        const coordinates = route.geometry.coordinates;
        const bounds = coordinates.reduce((bounds: mapboxgl.LngLatBounds, coord: number[]) => {
          return bounds.extend([coord[0], coord[1]]);
        }, new mapboxgl.LngLatBounds(coordinates[0], coordinates[0]));

        map.current.fitBounds(bounds, {
          padding: 50
        });
      }
    } catch (error) {
      console.error('Error getting directions:', error);
      setMapError('Unable to get directions. Please try again.');
    }
  };

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

        .directions-panel {
          background: white;
          padding: 16px;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          max-height: 400px;
          overflow-y: auto;
        }

        .direction-step {
          padding: 8px 0;
          border-bottom: 1px solid #eee;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .direction-step:last-child {
          border-bottom: none;
        }

        .direction-icon {
          width: 24px;
          height: 24px;
          background: #4B9DFF;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 14px;
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
          [FAU_BOUNDS.west, FAU_BOUNDS.south],
          [FAU_BOUNDS.east, FAU_BOUNDS.north]
        ]
      });

      map.current = initializeMap;

      initializeMap.addControl(new mapboxgl.NavigationControl(), 'top-right');

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

        // Get user's location first before adding markers
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              const userCoords: [number, number] = [
                position.coords.longitude,
                position.coords.latitude
              ];
              setUserLocation(userCoords);

              // Create custom marker element for user location
              const userMarkerEl = document.createElement('div');
              userMarkerEl.style.width = '25px';
              userMarkerEl.style.height = '25px';
              userMarkerEl.style.backgroundColor = '#4B9DFF';
              userMarkerEl.style.borderRadius = '50%';
              userMarkerEl.style.border = '3px solid white';
              userMarkerEl.style.boxShadow = '0 0 10px rgba(75, 157, 255, 0.5)';

              new mapboxgl.Marker({
                element: userMarkerEl
              })
                .setLngLat(userCoords)
                .setPopup(new mapboxgl.Popup().setHTML('<p class="font-semibold">Your Location</p>'))
                .addTo(initializeMap);

              // Now add event markers with directions functionality
              mockEvents.forEach(event => {
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

                // Add click handlers for both marker and Get Directions button
                const handleGetDirections = () => {
                  getDirections(userCoords, [event.coordinates[1], event.coordinates[0]]);
                };

                markerEl.addEventListener('click', handleGetDirections);
                popup.on('open', () => {
                  const btn = document.querySelector('.get-directions-btn');
                  if (btn) {
                    btn.addEventListener('click', handleGetDirections);
                  }
                });
              });
            },
            (error) => {
              console.error("Error getting location:", error);
              setMapError('Unable to get your location. Please enable location services and refresh the page.');
            }
          );
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2">
              <div className="h-[600px] rounded-lg overflow-hidden shadow-lg relative">
                <div ref={mapContainer} className="absolute inset-0" />
              </div>
            </div>

            <div>
              {directions && (
                <div className="directions-panel">
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold mb-2">Walking Directions</h3>
                    <p className="text-sm text-gray-600">
                      {directions.duration} min ({directions.distance} miles)
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    {directions.steps.map((step, index) => (
                      <div key={index} className="direction-step">
                        <div className="direction-icon">
                          {index === 0 ? 'A' : index === directions.steps.length - 1 ? 'B' : index}
                        </div>
                        <div>
                          <p>{step.instruction}</p>
                          {step.distance > 0 && (
                            <p className="text-sm text-gray-600">{step.distance} ft</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {!directions && (
                <div className="bg-white p-6 rounded-lg shadow-md">
                  <h2 className="text-xl font-semibold mb-4">Navigation Tips</h2>
                  <p className="text-gray-700 mb-4">
                    How to use the campus map:
                  </p>
                  <ul className="list-disc list-inside text-gray-700 space-y-2">
                    <li>Click any glowing red marker to view event details</li>
                    <li>Click "Get Directions" to get walking directions from your location</li>
                    <li>Your position is shown with a blue marker when location is enabled</li>
                    <li>Follow the blue line on the map for your walking route</li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default MapPage;