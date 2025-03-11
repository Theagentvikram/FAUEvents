import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { MapPin } from 'lucide-react';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import EventsPage from './pages/EventsPage';
import EventDetailPage from './pages/EventDetailPage';
import MapPage from './pages/MapPage';
import ProfilePage from './pages/ProfilePage';

function App() {
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
          <div className="container mx-auto">
            <p>© 2025 FAU Event App</p>
          </div>
        </footer>
      </div>
    </Router>
  );
}

export default App;