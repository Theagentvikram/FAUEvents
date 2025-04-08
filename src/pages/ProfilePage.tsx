import React, { useState } from 'react';
import { Bell, Calendar, Settings, LogOut } from 'lucide-react';

const ProfilePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('upcoming');
  
  // Mock user data
  const user = {
    name: 'Alex Johnson',
    email: 'alex.johnson@fau.edu',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
    major: 'Computer Science',
    year: 'Junior'
  };
  
  // Mock saved events
  const savedEvents = [
    {
      id: 1,
      title: 'Career Fair',
      date: 'Apr 15, 2025',
      location: 'Student Union',
      reminder: true
    },
    {
      id: 2,
      title: 'Basketball Game',
      date: 'Apr 18, 2025',
      location: 'FAU Arena',
      reminder: true
    },
    {
      id: 3,
      title: 'Hackathon',
      date: 'Apr 22, 2025',
      location: 'Engineering East',
      reminder: false
    }
  ];
  
  // Mock past events
  const pastEvents = [
    {
      id: 4,
      title: 'Club Fair',
      date: 'Mar 10, 2025',
      location: 'Breezeway'
    },
    {
      id: 5,
      title: 'Guest Lecture',
      date: 'Mar 5, 2025',
      location: 'Business Building'
    }
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Profile Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex flex-col md:flex-row items-center">
            <img 
              src={user.avatar} 
              alt={user.name}
              className="w-24 h-24 rounded-full object-cover mb-4 md:mb-0 md:mr-6"
            />
            <div className="text-center md:text-left">
              <h1 className="text-2xl font-bold">{user.name}</h1>
              <p className="text-gray-600">{user.email}</p>
              <div className="mt-2">
                <span className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold mr-2">
                  {user.major}
                </span>
                <span className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">
                  {user.year}
                </span>
              </div>
            </div>
            <div className="mt-4 md:mt-0 md:ml-auto">
              <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors">
                Edit Profile
              </button>
            </div>
          </div>
        </div>
        
        {/* Events Tabs */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="flex border-b">
            <button 
              className={`flex-1 py-4 px-6 text-center font-medium ${activeTab === 'upcoming' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
              onClick={() => setActiveTab('upcoming')}
            >
              Upcoming Events
            </button>
            <button 
              className={`flex-1 py-4 px-6 text-center font-medium ${activeTab === 'past' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
              onClick={() => setActiveTab('past')}
            >
              Past Events
            </button>
            <button 
              className={`flex-1 py-4 px-6 text-center font-medium ${activeTab === 'settings' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
              onClick={() => setActiveTab('settings')}
            >
              Settings
            </button>
          </div>
          
          <div className="p-6">
            {activeTab === 'upcoming' && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Your Upcoming Events</h2>
                {savedEvents.length > 0 ? (
                  <div className="space-y-4">
                    {savedEvents.map(event => (
                      <div key={event.id} className="flex items-center justify-between border-b border-gray-100 pb-4">
                        <div className="flex items-center">
                          <Calendar className="text-blue-600 mr-3" size={24} />
                          <div>
                            <h3 className="font-semibold">{event.title}</h3>
                            <p className="text-sm text-gray-600">{event.date} • {event.location}</p>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <button className={`mr-2 ${event.reminder ? 'text-blue-600' : 'text-gray-400'}`}>
                            <Bell size={20} />
                          </button>
                          <a 
                            href={`/events/${event.id}`}
                            className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors"
                          >
                            View
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">
                    You haven't saved any upcoming events yet.
                  </p>
                )}
              </div>
            )}
            
            {activeTab === 'past' && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Your Past Events</h2>
                {pastEvents.length > 0 ? (
                  <div className="space-y-4">
                    {pastEvents.map(event => (
                      <div key={event.id} className="flex items-center justify-between border-b border-gray-100 pb-4">
                        <div className="flex items-center">
                          <Calendar className="text-gray-400 mr-3" size={24} />
                          <div>
                            <h3 className="font-semibold">{event.title}</h3>
                            <p className="text-sm text-gray-600">{event.date} • {event.location}</p>
                          </div>
                        </div>
                        <a 
                          href={`/events/${event.id}`}
                          className="text-blue-600 hover:text-blue-800 transition-colors"
                        >
                          View
                        </a>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">
                    You haven't attended any events yet.
                  </p>
                )}
              </div>
            )}
            
            {activeTab === 'settings' && (
              <div>
                <h2 className="text-xl font-semibold mb-6">Account Settings</h2>
                
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium mb-3">Notification Preferences</h3>
                    <div className="space-y-3">
                      <div className="flex items-center">
                        <input 
                          type="checkbox" 
                          id="event-reminders" 
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          defaultChecked
                        />
                        <label htmlFor="event-reminders" className="ml-2 block text-gray-700">
                          Event reminders
                        </label>
                      </div>
                      <div className="flex items-center">
                        <input 
                          type="checkbox" 
                          id="new-events" 
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          defaultChecked
                        />
                        <label htmlFor="new-events" className="ml-2 block text-gray-700">
                          New events in your interests
                        </label>
                      </div>
                      <div className="flex items-center">
                        <input 
                          type="checkbox" 
                          id="event-changes" 
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          defaultChecked
                        />
                        <label htmlFor="event-changes" className="ml-2 block text-gray-700">
                          Changes to events you're attending
                        </label>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium mb-3">Privacy Settings</h3>
                    <div className="space-y-3">
                      <div className="flex items-center">
                        <input 
                          type="checkbox" 
                          id="show-profile" 
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          defaultChecked
                        />
                        <label htmlFor="show-profile" className="ml-2 block text-gray-700">
                          Show my profile to other users
                        </label>
                      </div>
                      <div className="flex items-center">
                        <input 
                          type="checkbox" 
                          id="share-attendance" 
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor="share-attendance" className="ml-2 block text-gray-700">
                          Share my event attendance
                        </label>
                      </div>
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t border-gray-200">
                    <button className="flex items-center text-red-600 hover:text-red-800">
                      <LogOut size={20} className="mr-2" />
                      Sign Out
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;