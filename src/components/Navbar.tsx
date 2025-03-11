import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Calendar, Map, Home, User } from 'lucide-react';

const Navbar: React.FC = () => {
  const location = useLocation();
  
  const isActive = (path: string) => {
    return location.pathname === path ? 'text-blue-500' : 'text-gray-600';
  };

  return (
    <header className="bg-white shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          <Link to="/" className="text-2xl font-bold text-blue-800 flex items-center">
            <Calendar className="mr-2" />
            FAU Events
          </Link>
          
          <nav className="hidden md:flex space-x-8">
            <Link to="/" className={`${isActive('/')} hover:text-blue-700 transition-colors`}>Home</Link>
            <Link to="/events" className={`${isActive('/events')} hover:text-blue-700 transition-colors`}>Events</Link>
            <Link to="/map" className={`${isActive('/map')} hover:text-blue-700 transition-colors`}>Map</Link>
            <Link to="/profile" className={`${isActive('/profile')} hover:text-blue-700 transition-colors`}>Profile</Link>
          </nav>
        </div>
      </div>
      
      {/* Mobile Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-10">
        <div className="flex justify-around py-2">
          <Link to="/" className={`flex flex-col items-center p-2 ${isActive('/')}`}>
            <Home size={24} />
            <span className="text-xs mt-1">Home</span>
          </Link>
          <Link to="/events" className={`flex flex-col items-center p-2 ${isActive('/events')}`}>
            <Calendar size={24} />
            <span className="text-xs mt-1">Events</span>
          </Link>
          <Link to="/map" className={`flex flex-col items-center p-2 ${isActive('/map')}`}>
            <Map size={24} />
            <span className="text-xs mt-1">Map</span>
          </Link>
          <Link to="/profile" className={`flex flex-col items-center p-2 ${isActive('/profile')}`}>
            <User size={24} />
            <span className="text-xs mt-1">Profile</span>
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Navbar;