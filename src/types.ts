export interface FlightStatus {
  flightNumber: string;
  origin: string;
  destination: string;
  departureTime: string;
  estimatedArrival: string;
  status: string; // "Scheduled", "EnRoute", "Delayed", "Landed"
  progress: number; // 0.0 to 100.0
  gate: string;
  belt: string;
}

export interface FlightSearchResponse {
  error?: string;
  // Based on AeroDataBox rough structure: Usually returns an array of flights for the date
  [key: string]: any; 
}
