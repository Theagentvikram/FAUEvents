import React, { useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MapPin, Calendar, Clock, Users, Share2, Bell, ArrowLeft } from 'lucide-react';
import { mockEvents } from '../data/mockEvents';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

// Your Mapbox access token
mapboxgl.accessToken = 'pk.eyJ1IjoibGltcGV0MTIzIiwiYSI6ImNtODRveW9ocDB5MDEya3JhaDRiMnFhYmYifQ.kWfb3QpMmybSvbbG4BgLhA';

const EventDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const event = mockEvents.find(e => e.id === Number(id));
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  
  useEffect(() => {
    if (!mapContainer.current || !event || map.current) return;

    const initializeMap = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [event.coordinates[1], event.coordinates[0]],
      zoom: 16
    });

    map.current = initializeMap;

    initializeMap.on('load', () => {
      // Add navigation controls
      initializeMap.addControl(new mapboxgl.NavigationControl(), 'top-right');

      // Add event marker
      const popup = new mapboxgl.Popup({ offset: 25 })
        .setHTML(`
          <div class="text-center">
            <h3 class="font-semibold">${event.title}</h3>
            <p class="text-sm text-gray-600">${event.location}</p>
          </div>
        `);

      new mapboxgl.Marker()
        .setLngLat([event.coordinates[1], event.coordinates[0]])
        .setPopup(popup)
        .addTo(initializeMap);
    });

    return () => {
      map.current?.remove();
    };
  }, [event]);

  if (!event) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold mb-4">Event not found</h2>
        <p className="mb-8">The event you're looking for doesn't exist or has been removed.</p>
        <Link to="/events" className="text-blue-600 hover:text-blue-800">
          ← Back to Events
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Link to="/events" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-6">
        <ArrowLeft size={20} className="mr-1" />
        Back to Events
      </Link>
      
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="relative">
          <img 
            src={event.image} 
            alt={event.title} 
            className="w-full h-64 md:h-96 object-cover"
          />
          <div className="absolute top-4 left-4">
            <span className="inline-block px-3 py-1 bg-blue-600 text-white text-sm font-semibold rounded-full">
              {event.category}
            </span>
          </div>
        </div>
        
        <div className="p-6">
          <h1 className="text-3xl font-bold mb-4">{event.title}</h1>
          
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div>
              <div className="flex items-center mb-4">
                <Calendar size={20} className="text-blue-600 mr-2" />
                <span>{event.date}</span>
              </div>
              <div className="flex items-center mb-4">
                <Clock size={20} className="text-blue-600 mr-2" />
                <span>{event.time}</span>
              </div>
              <div className="flex items-center mb-4">
                <MapPin size={20} className="text-blue-600 mr-2" />
                <span>{event.location}</span>
              </div>
              <div className="flex items-center">
                <Users size={20} className="text-blue-600 mr-2" />
                <span>{event.organizer}</span>
              </div>
            </div>
            
            <div className="flex flex-col md:items-end justify-start">
              <button className="mb-4 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center">
                <Bell size={20} className="mr-2" />
                Set Reminder
              </button>
              <button className="bg-gray-100 text-gray-800 px-6 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors flex items-center justify-center">
                <Share2 size={20} className="mr-2" />
                Share Event
              </button>
            </div>
          </div>
          
          <div className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">About This Event</h2>
            <p className="text-gray-700 whitespace-pre-line">{event.description}</p>
          </div>
          
          <div>
            <h2 className="text-2xl font-semibold mb-4">Location</h2>
            <div className="h-64 rounded-lg overflow-hidden">
              <div ref={mapContainer} className="h-full w-full" />
            </div>
            <p className="mt-4 text-gray-600 text-sm">
              Click the marker to get directions to the event location.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetailPage;