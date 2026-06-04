import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import 'dotenv/config';

const AIRPORT_COORDS: Record<string, { lat: number; lon: number; city: string }> = {
  JFK: { lat: 40.6413, lon: -73.7781, city: 'New York' },
  LAX: { lat: 33.9425, lon: -118.4081, city: 'Los Angeles' },
  ORD: { lat: 41.9742, lon: -87.9073, city: 'Chicago' },
  ATL: { lat: 33.6407, lon: -84.4277, city: 'Atlanta' },
  DFW: { lat: 32.8998, lon: -97.0403, city: 'Dallas' },
  DEN: { lat: 39.8561, lon: -104.6737, city: 'Denver' },
  SFO: { lat: 37.6213, lon: -122.3790, city: 'San Francisco' },
  SEA: { lat: 47.4502, lon: -122.3088, city: 'Seattle' },
  MIA: { lat: 25.7959, lon: -80.2870, city: 'Miami' },
  BOS: { lat: 42.3656, lon: -71.0096, city: 'Boston' },
  LAS: { lat: 36.0840, lon: -115.1537, city: 'Las Vegas' },
  PHX: { lat: 33.4373, lon: -112.0078, city: 'Phoenix' },
  IAH: { lat: 29.9902, lon: -95.3368, city: 'Houston' },
  EWR: { lat: 40.6895, lon: -74.1745, city: 'Newark' },
  CLT: { lat: 35.2144, lon: -80.9473, city: 'Charlotte' },
  MSP: { lat: 44.8848, lon: -93.2223, city: 'Minneapolis' },
  DTW: { lat: 42.2162, lon: -83.3554, city: 'Detroit' },
  PHL: { lat: 39.8729, lon: -75.2437, city: 'Philadelphia' },
  LGA: { lat: 40.7769, lon: -73.8740, city: 'New York' },
  MCO: { lat: 28.4312, lon: -81.3081, city: 'Orlando' },
  SAN: { lat: 32.7338, lon: -117.1933, city: 'San Diego' },
  TPA: { lat: 27.9772, lon: -82.5311, city: 'Tampa' },
  PDX: { lat: 45.5898, lon: -122.5951, city: 'Portland' },
  HNL: { lat: 21.3187, lon: -157.9224, city: 'Honolulu' },
  YYZ: { lat: 43.6777, lon: -79.6248, city: 'Toronto' },
  YVR: { lat: 49.1967, lon: -123.1815, city: 'Vancouver' },
  MEX: { lat: 19.4363, lon: -99.0721, city: 'Mexico City' },
  CUN: { lat: 21.0365, lon: -86.8771, city: 'Cancun' },
  LHR: { lat: 51.4700, lon: -0.4543, city: 'London' },
  LGW: { lat: 51.1537, lon: -0.1821, city: 'London Gatwick' },
  CDG: { lat: 49.0097, lon: 2.5479, city: 'Paris' },
  AMS: { lat: 52.3105, lon: 4.7683, city: 'Amsterdam' },
  FRA: { lat: 50.0379, lon: 8.5622, city: 'Frankfurt' },
  MAD: { lat: 40.4936, lon: -3.5668, city: 'Madrid' },
  BCN: { lat: 41.2974, lon: 2.0833, city: 'Barcelona' },
  FCO: { lat: 41.8003, lon: 12.2389, city: 'Rome' },
  MXP: { lat: 45.6306, lon: 8.7281, city: 'Milan' },
  MUC: { lat: 48.3538, lon: 11.7861, city: 'Munich' },
  ZRH: { lat: 47.4647, lon: 8.5492, city: 'Zurich' },
  VIE: { lat: 48.1103, lon: 16.5697, city: 'Vienna' },
  BRU: { lat: 50.9014, lon: 4.4844, city: 'Brussels' },
  CPH: { lat: 55.6180, lon: 12.6508, city: 'Copenhagen' },
  ARN: { lat: 59.6519, lon: 17.9186, city: 'Stockholm' },
  OSL: { lat: 60.1939, lon: 11.1004, city: 'Oslo' },
  HEL: { lat: 60.3172, lon: 24.9633, city: 'Helsinki' },
  WAW: { lat: 52.1657, lon: 20.9671, city: 'Warsaw' },
  PRG: { lat: 50.1008, lon: 14.2600, city: 'Prague' },
  ATH: { lat: 37.9364, lon: 23.9445, city: 'Athens' },
  LIS: { lat: 38.7813, lon: -9.1359, city: 'Lisbon' },
  DUB: { lat: 53.4213, lon: -6.2701, city: 'Dublin' },
  IST: { lat: 41.2753, lon: 28.7519, city: 'Istanbul' },
  HKG: { lat: 22.3080, lon: 113.9185, city: 'Hong Kong' },
  NRT: { lat: 35.7653, lon: 140.3860, city: 'Tokyo' },
  HND: { lat: 35.5494, lon: 139.7798, city: 'Tokyo' },
  ICN: { lat: 37.4602, lon: 126.4407, city: 'Seoul' },
  PEK: { lat: 40.0799, lon: 116.6031, city: 'Beijing' },
  PVG: { lat: 31.1443, lon: 121.8083, city: 'Shanghai' },
  SIN: { lat: 1.3644, lon: 103.9915, city: 'Singapore' },
  BKK: { lat: 13.6900, lon: 100.7501, city: 'Bangkok' },
  KUL: { lat: 2.7456, lon: 101.7099, city: 'Kuala Lumpur' },
  SYD: { lat: -33.9399, lon: 151.1753, city: 'Sydney' },
  MEL: { lat: -37.6690, lon: 144.8410, city: 'Melbourne' },
  AKL: { lat: -37.0082, lon: 174.7850, city: 'Auckland' },
  DEL: { lat: 28.5665, lon: 77.1031, city: 'Delhi' },
  BOM: { lat: 19.0896, lon: 72.8656, city: 'Mumbai' },
  DXB: { lat: 25.2532, lon: 55.3657, city: 'Dubai' },
  AUH: { lat: 24.4330, lon: 54.6511, city: 'Abu Dhabi' },
  DOH: { lat: 25.2609, lon: 51.6138, city: 'Doha' },
  JNB: { lat: -26.1367, lon: 28.2411, city: 'Johannesburg' },
  CPT: { lat: -33.9648, lon: 18.6017, city: 'Cape Town' },
  CAI: { lat: 30.1219, lon: 31.4056, city: 'Cairo' },
  GRU: { lat: -23.4356, lon: -46.4731, city: 'São Paulo' },
  EZE: { lat: -34.8222, lon: -58.5358, city: 'Buenos Aires' },
  SCL: { lat: -33.3930, lon: -70.7858, city: 'Santiago' },
  BOG: { lat: 4.7016, lon: -74.1469, city: 'Bogotá' },
  LIM: { lat: -12.0219, lon: -77.1143, city: 'Lima' },
};

const WMO_WEATHER: Record<number, { desc: string; icon: string }> = {
  0: { desc: 'Clear Sky', icon: 'sun' },
  1: { desc: 'Mainly Clear', icon: 'sun' },
  2: { desc: 'Partly Cloudy', icon: 'cloud-sun' },
  3: { desc: 'Overcast', icon: 'cloud' },
  45: { desc: 'Foggy', icon: 'cloud' },
  48: { desc: 'Icy Fog', icon: 'cloud' },
  51: { desc: 'Light Drizzle', icon: 'cloud-drizzle' },
  53: { desc: 'Moderate Drizzle', icon: 'cloud-drizzle' },
  55: { desc: 'Dense Drizzle', icon: 'cloud-drizzle' },
  61: { desc: 'Light Rain', icon: 'cloud-rain' },
  63: { desc: 'Moderate Rain', icon: 'cloud-rain' },
  65: { desc: 'Heavy Rain', icon: 'cloud-rain' },
  71: { desc: 'Light Snow', icon: 'cloud-snow' },
  73: { desc: 'Moderate Snow', icon: 'cloud-snow' },
  75: { desc: 'Heavy Snow', icon: 'cloud-snow' },
  77: { desc: 'Snow Grains', icon: 'cloud-snow' },
  80: { desc: 'Rain Showers', icon: 'cloud-rain' },
  81: { desc: 'Heavy Showers', icon: 'cloud-rain' },
  85: { desc: 'Snow Showers', icon: 'cloud-snow' },
  95: { desc: 'Thunderstorm', icon: 'cloud-lightning' },
  96: { desc: 'Hail Storm', icon: 'cloud-lightning' },
  99: { desc: 'Thunderstorm', icon: 'cloud-lightning' },
};

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Add JSON body parser
  app.use(express.json());

  // Proxy endpoint for AeroDataBox flight search
  app.get("/api/flights/:flightNumber", async (req, res) => {
    const flightNumber = req.params.flightNumber.toUpperCase();
    
    // Built-in Demo Flight to review MVP features smoothly
    if (flightNumber === "TEST1234" || flightNumber === "DEMO") {
      const now = new Date();
      const dep = new Date(now.getTime() - 1.5 * 60 * 60 * 1000); // 1.5 hours ago
      const arr = new Date(now.getTime() + 1.2 * 60 * 60 * 1000); // 1.2 hours from now
      return res.json([{
        number: flightNumber === "TEST1234" ? "TEST 1234" : "DEMO 999",
        status: "En Route",
        departure: {
          airport: { iata: "LHR" },
          scheduledTimeUtc: dep.toISOString(),
          actualTimeUtc: dep.toISOString(),
          gate: "A10"
        },
        arrival: {
          airport: { iata: "JFK" },
          scheduledTimeUtc: arr.toISOString(),
          actualTimeUtc: arr.toISOString(),
          baggageBelt: "4"
        }
      }]);
    }

    const apiKey = process.env.RAPIDAPI_KEY;

    // Optional: date parameter for AeroDataBox. Default to today
    const date = new Date().toISOString().split('T')[0];

    if (!apiKey) {
      return res.status(500).json({ error: "Missing RAPIDAPI_KEY environment variable. Configure this in Settings." });
    }

    try {
      // By default AeroDataBox has flights/number/...
      // But aviationstack might be flights?flight_iata=...
      // We'll support AeroDataBox as requested by the user context
      const response = await fetch(`https://aerodatabox.p.rapidapi.com/flights/number/${flightNumber}/${date}`, {
        method: 'GET',
        headers: {
          'X-RapidAPI-Key': apiKey,
          'X-RapidAPI-Host': 'aerodatabox.p.rapidapi.com',
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.statusText}`);
      }

      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("Flight API Search Error:", error);
      res.status(500).json({ error: "Failed to fetch flight data. Check your API key and connection." });
    }
  });

  // Real-time weather for destination airport via Open-Meteo (free, no key)
  app.get('/api/weather/:iata', async (req, res) => {
    const iata = req.params.iata.toUpperCase();
    const coords = AIRPORT_COORDS[iata];
    if (!coords) {
      return res.status(404).json({ error: `Unknown airport: ${iata}` });
    }
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&current=temperature_2m,weather_code&temperature_unit=fahrenheit`;
      const resp = await fetch(url);
      if (!resp.ok) throw new Error('Weather API failed');
      const data = await resp.json() as any;
      const wmo: number = data.current?.weather_code ?? 0;
      const weather = WMO_WEATHER[wmo] ?? { desc: 'Unknown', icon: 'cloud-sun' };
      res.json({ temp: Math.round(data.current.temperature_2m), description: weather.desc, icon: weather.icon, city: coords.city });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch weather' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    // For Express 4
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
