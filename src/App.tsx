import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { MapPin, MessageSquare } from 'lucide-react';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import EventsPage from './pages/EventsPage';
import EventDetailPage from './pages/EventDetailPage';
import MapPage from './pages/MapPage';
import ProfilePage from './pages/ProfilePage';
import FeedbackPopup from './components/FeedbackPopup';

function App() {
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  
  return (
    <Router>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/events" element={<EventsPage />} />
            <Route path="/events/:id" element={<EventDetailPage />} />
            <Route path="/map" element={<MapPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Routes>
        </main>
        <footer className="bg-blue-800 text-white p-4 text-center">
          <div className="container mx-auto flex justify-between items-center">
            <p>© 2025 FAU Event App</p>
            <button 
              onClick={() => setIsFeedbackOpen(true)}
              className="flex items-center text-white hover:text-blue-200 transition-colors"
            >
              <MessageSquare size={18} className="mr-1" />
              Give Feedback
            </button>
          </div>
        </footer>
        
        {/* Feedback Popup */}
        <FeedbackPopup 
          isOpen={isFeedbackOpen} 
          onClose={() => setIsFeedbackOpen(false)} 
        />
      </div>
    </Router>
  );
}

export default App;