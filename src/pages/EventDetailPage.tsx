import React, { useEffect, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MapPin, Calendar, Clock, Users, Share2, Bell, ArrowLeft, X, Check } from 'lucide-react';
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
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [calendarSuccess, setCalendarSuccess] = useState(false);
  
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
              <button 
                onClick={() => setShowCalendarModal(true)}
                className="mb-4 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center"
              >
                <Bell size={20} className="mr-2" />
                Add to Calendar
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

      {/* Calendar Modal */}
      {showCalendarModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">Add to Calendar</h3>
              <button 
                onClick={() => {
                  setShowCalendarModal(false);
                  setCalendarSuccess(false);
                }} 
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>

            {calendarSuccess ? (
              <div className="text-center py-6">
                <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <Check size={32} className="text-green-600" />
                </div>
                <p className="text-lg font-medium mb-2">Added to Calendar</p>
                <p className="text-gray-600 mb-6">You'll receive a reminder for this event.</p>
                <button 
                  onClick={() => {
                    setShowCalendarModal(false);
                    setCalendarSuccess(false);
                  }}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                >
                  Done
                </button>
              </div>
            ) : (
              <>
                <p className="mb-6">Choose where to add "{event.title}":</p>
                
                <div className="space-y-3 mb-6">
                  <button 
                    onClick={() => {
                      // Generate Google Calendar URL
                      const eventTitle = encodeURIComponent(event.title);
                      const eventLocation = encodeURIComponent(event.location);
                      const eventDescription = encodeURIComponent(event.description);
                      
                      // Parse date and time
                      // This is a simplified version - in a real app, you'd need more robust date parsing
                      const dateStr = event.date.replace(/,\s*\d{4}/, ''); // Remove year
                      const timeStart = event.time.split(' - ')[0];
                      const dateTimeStr = `${dateStr} ${timeStart}`;
                      
                      // Create a date object (this is simplified)
                      const eventDate = new Date(dateTimeStr);
                      const eventDateEnd = new Date(eventDate.getTime() + 2 * 60 * 60 * 1000); // Add 2 hours
                      
                      // Format dates for Google Calendar
                      const formatDate = (date: Date) => {
                        return date.toISOString().replace(/-|:|\.\d+/g, '');
                      };
                      
                      const startDate = formatDate(eventDate);
                      const endDate = formatDate(eventDateEnd);
                      
                      const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${eventTitle}&dates=${startDate}/${endDate}&details=${eventDescription}&location=${eventLocation}&sf=true&output=xml`;
                      
                      // Open in new tab
                      window.open(googleCalendarUrl, '_blank');
                      setCalendarSuccess(true);
                    }}
                    className="w-full text-left px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center"
                  >
                    <img src="https://upload.wikimedia.org/wikipedia/commons/a/a5/Google_Calendar_icon_%282020%29.svg" alt="Google Calendar" className="w-6 h-6 mr-3" />
                    Google Calendar
                  </button>
                  
                  <button 
                    onClick={() => {
                      // Generate iCal file
                      const eventTitle = event.title;
                      const eventLocation = event.location;
                      const eventDescription = event.description.replace(/\n/g, '\\n');
                      
                      // Parse date and time (simplified)
                      const dateStr = event.date.replace(/,\s*\d{4}/, ''); // Remove year
                      const timeStart = event.time.split(' - ')[0];
                      const dateTimeStr = `${dateStr} ${timeStart}`;
                      
                      // Create date objects (simplified)
                      const eventDate = new Date(dateTimeStr);
                      const eventDateEnd = new Date(eventDate.getTime() + 2 * 60 * 60 * 1000); // Add 2 hours
                      
                      // Format dates for iCal
                      const formatDate = (date: Date) => {
                        return date.toISOString().replace(/-|:|\.\d+/g, '').slice(0, -1);
                      };
                      
                      const startDate = formatDate(eventDate);
                      const endDate = formatDate(eventDateEnd);
                      const now = formatDate(new Date());
                      
                      // Create iCal content
                      const icalContent = [
                        'BEGIN:VCALENDAR',
                        'VERSION:2.0',
                        'PRODID:-//FAU Events//EN',
                        'BEGIN:VEVENT',
                        `UID:${Date.now()}@fauevent.com`,
                        `DTSTAMP:${now}`,
                        `DTSTART:${startDate}`,
                        `DTEND:${endDate}`,
                        `SUMMARY:${eventTitle}`,
                        `DESCRIPTION:${eventDescription}`,
                        `LOCATION:${eventLocation}`,
                        'END:VEVENT',
                        'END:VCALENDAR'
                      ].join('\r\n');
                      
                      // Create and download the file
                      const blob = new Blob([icalContent], { type: 'text/calendar;charset=utf-8' });
                      const link = document.createElement('a');
                      link.href = URL.createObjectURL(blob);
                      link.download = `${eventTitle.replace(/\s+/g, '_')}.ics`;
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                      
                      setCalendarSuccess(true);
                    }}
                    className="w-full text-left px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center"
                  >
                    <Calendar size={20} className="mr-3 text-blue-600" />
                    Apple Calendar / Outlook (iCal)
                  </button>
                </div>
                
                <p className="text-sm text-gray-500">
                  You'll be redirected to your calendar app to confirm the details.
                </p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default EventDetailPage;