import { Event } from '../types/Event';

// Define the base URL for the FAU Campus Labs API
const FAU_EVENTS_API = 'https://fau.campuslabs.com/engage/api/discovery/event/search';

// Default parameters for the API request
const DEFAULT_PARAMS = {
  endsAfter: new Date().toISOString(),
  orderByField: 'endsOn',
  orderByDirection: 'ascending',
  status: 'Approved',
  take: 20,
  query: ''
};

// Function to fetch events from the FAU Campus Labs API
export const fetchEvents = async (): Promise<Event[]> => {
  try {
    // Construct the URL with query parameters
    const queryParams = new URLSearchParams();
    
    // Add each parameter individually
    queryParams.append('endsAfter', new Date().toISOString());
    queryParams.append('orderByField', DEFAULT_PARAMS.orderByField);
    queryParams.append('orderByDirection', DEFAULT_PARAMS.orderByDirection);
    queryParams.append('status', DEFAULT_PARAMS.status);
    queryParams.append('take', DEFAULT_PARAMS.take.toString());
    queryParams.append('query', DEFAULT_PARAMS.query);
    
    const response = await fetch(`${FAU_EVENTS_API}?${queryParams}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch events: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Transform the API response to match our Event type
    const events: Event[] = data.value.map((item: any) => {
      // Extract the coordinates from the location
      // Note: This is a simplification, as the actual API might not provide coordinates directly
      // In a real implementation, you might need to geocode the address
      
      // Default to FAU Boca Raton coordinates if not available
      const coordinates: [number, number] = [26.3721, -80.1020];
      
      // Parse the date and time
      const startDate = new Date(item.startsOn);
      const endDate = new Date(item.endsOn);
      
      // Format the date and time
      const formatDate = (date: Date) => {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
      };
      
      const formatTime = (start: Date, end: Date) => {
        const formatHour = (date: Date) => {
          const hours = date.getHours();
          const minutes = date.getMinutes();
          const ampm = hours >= 12 ? 'PM' : 'AM';
          const hour = hours % 12 || 12;
          return `${hour}:${minutes.toString().padStart(2, '0')} ${ampm}`;
        };
        
        return `${formatHour(start)} - ${formatHour(end)}`;
      };
      
      return {
        id: item.id,
        title: item.name,
        date: formatDate(startDate),
        time: formatTime(startDate, endDate),
        location: item.location || 'FAU Campus',
        coordinates: coordinates,
        category: item.categoryNames[0] || 'General',
        organizer: item.organizationName || 'FAU',
        description: item.description || 'No description available.',
        image: item.imagePath || 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80'
      };
    });
    
    return events;
  } catch (error) {
    console.error('Error fetching events:', error);
    // Return an empty array or throw the error based on your error handling strategy
    return [];
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
