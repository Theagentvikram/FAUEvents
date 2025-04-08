import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, Bell } from 'lucide-react';
import { mockEvents } from '../data/mockEvents';

const HomePage: React.FC = () => {
  // Get upcoming events (first 3)
  const upcomingEvents = mockEvents.slice(0, 3);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Section */}
      <section className="bg-blue-800 text-white rounded-lg p-8 mb-12">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl font-bold mb-4">Discover FAU Events</h1>
          <p className="text-xl mb-8">
            Stay connected with campus life. Find events, get reminders, and never miss out.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link 
              to="/events" 
              className="bg-white text-blue-800 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              Browse Events
            </Link>
            <Link 
              to="/map" 
              className="bg-transparent border-2 border-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              View Map
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="mb-12">
        <h2 className="text-3xl font-bold text-center mb-8">App Features</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 text-blue-800 rounded-full mb-4">
              <Calendar size={32} />
            </div>
            <h3 className="text-xl font-semibold mb-2">Event Calendar</h3>
            <p className="text-gray-600">
              Browse and search for upcoming events across campus.
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 text-blue-800 rounded-full mb-4">
              <MapPin size={32} />
            </div>
            <h3 className="text-xl font-semibold mb-2">Interactive Map</h3>
            <p className="text-gray-600">
              Find event locations and navigate campus with ease.
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 text-blue-800 rounded-full mb-4">
              <Bell size={32} />
            </div>
            <h3 className="text-xl font-semibold mb-2">Event Reminders</h3>
            <p className="text-gray-600">
              Get notifications for events you're interested in.
            </p>
          </div>
        </div>
      </section>

      {/* Upcoming Events Section */}
      <section>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Upcoming Events</h2>
          <Link to="/events" className="text-blue-600 hover:text-blue-800">
            View All →
          </Link>
        </div>
        
        <div className="grid md:grid-cols-3 gap-6">
          {upcomingEvents.map(event => (
            <div key={event.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              <img 
                src={event.image} 
                alt={event.title} 
                className="w-full h-48 object-cover"
              />
              <div className="p-4">
                <div className="text-sm text-blue-600 mb-2">{event.date}</div>
                <h3 className="text-xl font-semibold mb-2">{event.title}</h3>
                <div className="flex items-center text-gray-500 mb-3">
                  <MapPin size={16} className="mr-1" />
                  <span>{event.location}</span>
                </div>
                <Link 
                  to={`/events/${event.id}`}
                  className="block text-center bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition-colors"
                >
                  View Details
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default HomePage;