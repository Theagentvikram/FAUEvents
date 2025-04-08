import React, { useEffect, useRef, useState } from 'react';
import 'mapbox-gl/dist/mapbox-gl.css';
import '@mapbox/mapbox-gl-directions/dist/mapbox-gl-directions.css';
import mapboxgl from 'mapbox-gl';
import { mockEvents } from '../data/mockEvents';
import { Calendar, MapPin, Filter, Loader } from 'lucide-react';
import { fetchEvents } from '../services/eventService';
import { Event } from '../types/Event';

// Type assertion to ensure mockEvents matches the Event type
const typedMockEvents: Event[] = mockEvents.map(event => ({
  ...event,
  coordinates: [event.coordinates[0], event.coordinates[1]] as [number, number]
}));

// Mapbox access token
mapboxgl.accessToken = 'pk.eyJ1IjoibGltcGV0MTIzIiwiYSI6ImNtODRveW9ocDB5MDEya3JhaDRiMnFhYmYifQ.kWfb3QpMmybSvbbG4BgLhA';

// FAU bounds - more tightly constrained to the campus
const FAU_BOUNDS = {
  north: 26.3790, // Slightly north of campus
  south: 26.3650, // Slightly south of campus
  west: -80.1080, // Slightly west of campus
  east: -80.0950  // Slightly east of campus
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
  const [activeFilter, setActiveFilter] = useState<string>('');
  const [eventMarkers, setEventMarkers] = useState<mapboxgl.Marker[]>([]);
  const [events, setEvents] = useState<Event[]>(typedMockEvents);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // FAU Boca Raton coordinates
  const fauCenter: [number, number] = [-80.1020, 26.3721];

  // Function to calculate distance between two coordinates in meters
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  };

  // Function to filter events based on selected filter
  const filterEvents = (filter: string) => {
    // If clicking the active filter, clear it
    if (filter === activeFilter) {
      setActiveFilter('');
      if (map.current && userLocation) {
        // Clear any existing route
        if (map.current.getSource('route')) {
          map.current.removeLayer('route');
          map.current.removeSource('route');
        }
        setDirections(null);
        
        // Show all events
        addEventMarkers(events, userLocation);
      }
      return;
    }
    
    // Set the new active filter
    setActiveFilter(filter);
    
    let filtered = [];
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const formatDateString = (date: Date) => {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
    };
    
    const todayStr = formatDateString(today);
    const tomorrowStr = formatDateString(tomorrow);
    
    switch (filter) {
      case 'today':
        filtered = events.filter(event => event.date.includes(todayStr));
        break;
      case 'tomorrow':
        filtered = events.filter(event => event.date.includes(tomorrowStr));
        break;
      case '200m':
        if (userLocation) {
          filtered = events.filter(event => {
            const distance = calculateDistance(
              userLocation[1], userLocation[0],
              event.coordinates[0], event.coordinates[1]
            );
            return distance <= 200;
          });
        } else {
          setMapError('Please enable location services to use distance-based filtering');
          setActiveFilter('');
          filtered = events;
          return; // Exit early
        }
        break;
      case '500m':
        if (userLocation) {
          filtered = events.filter(event => {
            const distance = calculateDistance(
              userLocation[1], userLocation[0],
              event.coordinates[0], event.coordinates[1]
            );
            return distance <= 500;
          });
        } else {
          setMapError('Please enable location services to use distance-based filtering');
          setActiveFilter('');
          filtered = events;
          return; // Exit early
        }
        break;
      case '':
        filtered = events;
        break;
      default:
        filtered = events;
        break;
    }
    
    console.log(`Filtered events for ${filter}:`, filtered.length);
    
    // Add new markers if map is initialized
    if (map.current && userLocation) {
      addEventMarkers(filtered, userLocation);
    }
  };
  
  // Function to add event markers to the map
  const addEventMarkers = (events: Event[], userCoords: [number, number]) => {
    // First safely remove any existing markers
    eventMarkers.forEach(marker => {
      try {
        marker.remove();
      } catch (e) {
        console.error('Error removing marker:', e);
      }
    });
    
    // Remove any existing route
    if (map.current && map.current.getSource('route')) {
      try {
        map.current.removeLayer('route');
        map.current.removeSource('route');
      } catch (e) {
        console.error('Error removing route:', e);
      }
    }
    
    // Clear the directions
    setDirections(null);
    
    // Create a new array for markers
    const newMarkers: mapboxgl.Marker[] = [];
    
    if (!map.current) return;
    
    // Add markers after a small delay to prevent flickering
    setTimeout(() => {
      events.forEach(event => {
      const markerEl = document.createElement('div');
      markerEl.className = 'marker-glow';
      
      // Create a unique ID for this event's popup buttons
      const btnId = `get-directions-btn-${event.id}-${Date.now()}`;
      
      const popup = new mapboxgl.Popup({ offset: 25 })
        .setHTML(`
          <div class="text-center">
            <h3 class="font-semibold text-lg">${event.title}</h3>
            <p class="text-sm text-gray-600">${event.date} • ${event.time}</p>
            <button id="${btnId}" class="bg-blue-600 text-white px-3 py-1 rounded mt-2 hover:bg-blue-700">
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
        .addTo(map.current!);

      newMarkers.push(marker);

      // Add click handlers for marker
      markerEl.addEventListener('click', () => {
        // Close any other open popups first
        newMarkers.forEach(m => {
          if (m !== marker && m.getPopup().isOpen()) {
            m.togglePopup();
          }
        });
        marker.togglePopup();
      });
      
      // Add event listener for the Get Directions button
      popup.on('open', () => {
        setTimeout(() => {
          const btn = document.getElementById(btnId);
          if (btn) {
            // Remove any existing event listeners to prevent duplicates
            const newBtn = btn.cloneNode(true);
            if (btn.parentNode) {
              btn.parentNode.replaceChild(newBtn, btn);
            }
            
            // Add the click event listener to the new button
            newBtn.addEventListener('click', () => {
              getDirections(userCoords, [event.coordinates[1], event.coordinates[0]]);
            });
          }
        }, 100); // Small delay to ensure the DOM is updated
      });
      });
      
      // Update state with new markers
      setEventMarkers(newMarkers);
    }, 100);
  };

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

  // Effect to fetch events from the API
  useEffect(() => {
    const getEvents = async () => {
      setIsLoading(true);
      try {
        const fetchedEvents = await fetchEvents();
        if (fetchedEvents.length > 0) {
          setEvents(fetchedEvents);
        } else {
          // Fallback to mock events if API fails or returns empty
          setEvents(typedMockEvents);
        }
      } catch (error) {
        console.error('Error fetching events:', error);
        setEvents(typedMockEvents);
      } finally {
        setIsLoading(false);
      }
    };
    
    getEvents();
  }, []);
  
  // Effect to handle filter changes
  useEffect(() => {
    if (map.current && userLocation && activeFilter !== '') {
      filterEvents(activeFilter);
    }
  }, [activeFilter, events]);

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
        ],
        pitchWithRotate: false, // Disable pitch with rotate gesture
        dragRotate: false // Disable map rotation
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

              // Initialize with all events
              addEventMarkers(typedMockEvents, userCoords);
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

      {isLoading && (
        <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded mb-4 flex items-center">
          <Loader size={20} className="animate-spin mr-2" />
          Loading events from FAU Campus Labs...
        </div>
      )}

      {mapError ? (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {mapError}
        </div>
      ) : (
        <>
          <div className="bg-white p-4 rounded-lg shadow-md mb-8">
            <p className="text-gray-700 mb-4">
              Explore FAU campus events and get walking directions. Click any marker to get directions from your current location.
              {userLocation ? " Your current location is shown in blue." : " Enable location services to see your position."}
            </p>
            
            <div className="flex flex-wrap gap-2">
              <div className="flex items-center mb-2 mr-2">
                <Filter size={16} className="mr-1" />
                <span className="font-semibold">Filter Events:</span>
              </div>
              
              <button 
                onClick={() => filterEvents('today')}
                className={`flex items-center px-3 py-1 rounded-full text-sm ${
                  activeFilter === 'today' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                }`}
              >
                <Calendar size={14} className="mr-1" />
                Today
              </button>
              
              <button 
                onClick={() => filterEvents('tomorrow')}
                className={`flex items-center px-3 py-1 rounded-full text-sm ${
                  activeFilter === 'tomorrow' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                }`}
              >
                <Calendar size={14} className="mr-1" />
                Tomorrow
              </button>
              
              <button 
                onClick={() => filterEvents('200m')}
                className={`flex items-center px-3 py-1 rounded-full text-sm ${
                  activeFilter === '200m' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                }`}
              >
                <MapPin size={14} className="mr-1" />
                Within 200m
              </button>
              
              <button 
                onClick={() => filterEvents('500m')}
                className={`flex items-center px-3 py-1 rounded-full text-sm ${
                  activeFilter === '500m' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                }`}
              >
                <MapPin size={14} className="mr-1" />
                Within 500m
              </button>
              
              {activeFilter && (
                <button 
                  onClick={() => filterEvents('')}
                  className="px-3 py-1 rounded-full text-sm bg-red-100 text-red-800 hover:bg-red-200"
                >
                  Clear Filter
                </button>
              )}
            </div>
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