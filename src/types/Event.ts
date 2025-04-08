export interface Event {
  id: number;
  title: string;
  date: string;
  time: string;
  location: string;
  coordinates: [number, number]; // [latitude, longitude]
  category: string;
  organizer: string;
  description: string;
  image: string;
}
