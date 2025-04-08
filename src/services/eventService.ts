import { Event } from '../types/Event';

// Define the base URL for the FAU Calendar website
const FAU_CALENDAR_URL = 'https://calendar.fau.edu/calendar';

// Function to fetch events from the FAU Calendar website
export const fetchEvents = async (): Promise<Event[]> => {
  try {
    // Fetch the calendar page
    const response = await fetch(FAU_CALENDAR_URL);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch events: ${response.status} ${response.statusText}`);
    }
    
    const html = await response.text();
    
    // Parse the HTML to extract event information
    const events: Event[] = [];
    let nextId = 1;
    
    // Use DOM parser to extract event data
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    // Find event elements
    const eventElements = doc.querySelectorAll('.event-card');
    
    // If we can't find event cards with the selector, try an alternative approach
    if (eventElements.length === 0) {
      // Extract event links from the page
      const eventLinks = Array.from(doc.querySelectorAll('a[href*="/event/"]'));
      
      // Process unique event links
      const processedUrls = new Set<string>();
      
      for (const link of eventLinks) {
        const eventUrl = link.getAttribute('href');
        if (!eventUrl || processedUrls.has(eventUrl)) continue;
        
        processedUrls.add(eventUrl);
        
        try {
          // Fetch the individual event page
          const eventResponse = await fetch(new URL(eventUrl, FAU_CALENDAR_URL).href);
          const eventHtml = await eventResponse.text();
          const eventDoc = parser.parseFromString(eventHtml, 'text/html');
          
          // Extract event title
          const title = eventDoc.querySelector('h1')?.textContent?.trim() || 'Untitled Event';
          
          // Extract event date and time
          const dateTimeText = eventDoc.querySelector('.event-date-time')?.textContent || 
                             eventDoc.querySelector('.event-time')?.textContent || 
                             eventDoc.querySelector('time')?.textContent || '';
          
          // Parse date and time
          let date = 'TBD';
          let time = 'TBD';
          
          if (dateTimeText) {
            // Try to extract date in format like "Friday, April 4, 2025"
            const dateMatch = dateTimeText.match(/([A-Za-z]+, [A-Za-z]+ \d+, \d{4})/);
            if (dateMatch) {
              date = dateMatch[1];
            }
            
            // Try to extract time in format like "10:00 AM - 11:00 AM"
            const timeMatch = dateTimeText.match(/(\\d{1,2}:\\d{2} [AP]M)\\s*-\\s*(\\d{1,2}:\\d{2} [AP]M)/);
                        if (timeMatch) {
              time = `${timeMatch[1]} - ${timeMatch[2]}`;
            } else {
              // Try to match just a start time
              const startTimeMatch = dateTimeText.match(/(\d{1,2}:\d{2} [AP]M)/);
              if (startTimeMatch) {
                time = startTimeMatch[1];
              }
            }
          }
          
          // Extract location
          const location = eventDoc.querySelector('.event-location')?.textContent?.trim() || 
                         eventDoc.querySelector('address')?.textContent?.trim() || 
                         'FAU Campus';
          
          // Extract description
          const description = eventDoc.querySelector('.event-description')?.textContent?.trim() || 
                            eventDoc.querySelector('.description')?.textContent?.trim() || 
                            'No description available.';
          
          // Extract category
          const categoryElement = eventDoc.querySelector('.event-type a') || 
                               eventDoc.querySelector('.event-category');
          const category = categoryElement?.textContent?.trim() || 'General';
          
          // Extract organizer
          const organizerElement = eventDoc.querySelector('.event-organizer') || 
                                 eventDoc.querySelector('.department a');
          const organizer = organizerElement?.textContent?.trim() || 'FAU';
          
          // Extract image
          const imageElement = eventDoc.querySelector('.event-image img') || 
                             eventDoc.querySelector('img.event-detail-image') || 
                             eventDoc.querySelector('.event-card img');
          const image = imageElement?.getAttribute('src') || 
                      'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80';
          
          // Default to FAU Boca Raton coordinates if not available
          // In a real implementation, you might want to geocode the address
          const coordinates: [number, number] = [26.3721, -80.1020];
          
          events.push({
            id: nextId++,
            title,
            date,
            time,
            location,
            coordinates,
            category,
            organizer,
            description,
            image
          });
          
        } catch (eventError) {
          console.error(`Error fetching event details for ${eventUrl}:`, eventError);
        }
      }
    } else {
      // Process event cards if they're found
      eventElements.forEach(eventElement => {
        const titleElement = eventElement.querySelector('.event-title') || 
                           eventElement.querySelector('h3');
        const title = titleElement?.textContent?.trim() || 'Untitled Event';
        
        const dateElement = eventElement.querySelector('.event-date') || 
                          eventElement.querySelector('.date');
        const date = dateElement?.textContent?.trim() || 'TBD';
        
        const timeElement = eventElement.querySelector('.event-time') || 
                          eventElement.querySelector('.time');
        const time = timeElement?.textContent?.trim() || 'TBD';
        
        const locationElement = eventElement.querySelector('.event-location') || 
                             eventElement.querySelector('.location');
        const location = locationElement?.textContent?.trim() || 'FAU Campus';
        
        const categoryElement = eventElement.querySelector('.event-category') || 
                             eventElement.querySelector('.category');
        const category = categoryElement?.textContent?.trim() || 'General';
        
        const organizerElement = eventElement.querySelector('.event-organizer') || 
                               eventElement.querySelector('.organizer');
        const organizer = organizerElement?.textContent?.trim() || 'FAU';
        
        const descriptionElement = eventElement.querySelector('.event-description') || 
                                 eventElement.querySelector('.description');
        const description = descriptionElement?.textContent?.trim() || 'No description available.';
        
        const imageElement = eventElement.querySelector('img');
        const image = imageElement?.getAttribute('src') || 
                    'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80';
        
        // Default to FAU Boca Raton coordinates
        const coordinates: [number, number] = [26.3721, -80.1020];
        
        events.push({
          id: nextId++,
          title,
          date,
          time,
          location,
          coordinates,
          category,
          organizer,
          description,
          image
        });
      });
    }
    
    // If we couldn't extract any events, use mock data as fallback
    if (events.length === 0) {
      console.warn('Could not extract events from the FAU Calendar website. Using fallback data.');
      return getFallbackEvents();
    }
    
    return events;
  } catch (error) {
    console.error('Error fetching events:', error);
    // Return fallback data in case of error
    return getFallbackEvents();
  }
};

// Function to fetch a single event by ID
export const fetchEventById = async (id: number): Promise<Event | null> => {
  try {
    const events = await fetchEvents();
    return events.find(event => event.id === id) || null;
  } catch (error) {
    console.error(`Error fetching event with ID ${id}:`, error);
    return null;
  }
};

// Fallback events data in case web scraping fails
const getFallbackEvents = (): Event[] => {
  return [
    {
      id: 1,
      title: "Spring Career Fair",
      date: "Apr 15, 2025",
      time: "10:00 AM - 3:00 PM",
      location: "Student Union",
      coordinates: [26.3721, -80.1020],
      category: "Career",
      organizer: "FAU Career Center",
      description: "Connect with over 100 employers from various industries looking to hire FAU students and alumni for internships and full-time positions. Bring your resume and dress professionally.",
      image: "https://images.unsplash.com/photo-1540317580384-e5d43867caa6?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80"
    },
    {
      id: 2,
      title: "Basketball Game: FAU vs. UCF",
      date: "Apr 18, 2025",
      time: "7:00 PM",
      location: "FAU Arena",
      coordinates: [26.3700, -80.1030],
      category: "Sports",
      organizer: "FAU Athletics",
      description: "Come support the Owls as they take on the UCF Knights in this exciting basketball matchup. Student admission is free with a valid Owl Card.",
      image: "https://images.unsplash.com/photo-1504450758481-7338eba7524a?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80"
    },
    {
      id: 3,
      title: "Hackathon 2025",
      date: "Apr 22-24, 2025",
      time: "Starts at 9:00 AM",
      location: "Engineering East Building",
      coordinates: [26.3730, -80.1010],
      category: "Academic",
      organizer: "College of Engineering & Computer Science",
      description: "A 48-hour coding competition where students form teams to build innovative software and hardware projects. Prizes will be awarded in multiple categories.",
      image: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80"
    },
    {
      id: 4,
      title: "Guest Lecture: AI Ethics",
      date: "Apr 25, 2025",
      time: "2:00 PM - 4:00 PM",
      location: "College of Business",
      coordinates: [26.3710, -80.1015],
      category: "Academic",
      organizer: "Department of Computer Science",
      description: "Join us for a thought-provoking lecture on the ethical implications of artificial intelligence by Dr. Sarah Johnson, a leading researcher in the field.",
      image: "https://images.unsplash.com/photo-1558021212-51b6ecfa0db9?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80"
    },
    {
      id: 5,
      title: "Spring Concert",
      date: "Apr 28, 2025",
      time: "8:00 PM",
      location: "Outdoor Amphitheater",
      coordinates: [26.3740, -80.1025],
      category: "Arts",
      organizer: "Student Activities Board",
      description: "Our annual spring concert featuring popular artists and local talent. This year's headliner will be announced soon!",
      image: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80"
    }
  ];
};
