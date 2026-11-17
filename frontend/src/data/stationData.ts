export interface StationInfo {
  id: string;
  name: string;
  region: string;
  crop: string;
  areaHectares: number;
  temp: number;
  humidity: number;
  pressure: number;
  healthIndex: number;
  status: "optimal" | "warning" | "alert";
  coordinates: { lat: number; lng: number };
}

export const STATIONS: StationInfo[] = [
  {
    id: "jammu-plains",
    name: "Jammu Plains · Station 01",
    region: "Northern Plains",
    crop: "Tomato & Polyhouse Crops",
    areaHectares: 14.5,
    temp: 23.4,
    humidity: 68,
    pressure: 982.5,
    healthIndex: 86,
    status: "optimal",
    coordinates: { lat: 32.7266, lng: 74.857 },
  },
  {
    id: "punjab-wheat",
    name: "Punjab Wheat Estate · Sensor B",
    region: "Malwa Belt",
    crop: "Corn & Wheat",
    areaHectares: 32.0,
    temp: 26.1,
    humidity: 52,
    pressure: 978.2,
    healthIndex: 91,
    status: "optimal",
    coordinates: { lat: 30.901, lng: 75.8573 },
  },
  {
    id: "himachal-apple",
    name: "Himachal Apple Valley · Ridge 4",
    region: "Shimla Hills",
    crop: "Apple & Cherry",
    areaHectares: 8.2,
    temp: 17.8,
    humidity: 82,
    pressure: 890.4,
    healthIndex: 74,
    status: "warning",
    coordinates: { lat: 31.1048, lng: 77.1734 },
  },
  {
    id: "nashik-vineyard",
    name: "Nashik Vineyard · Block C",
    region: "Western Ghats",
    crop: "Grape (Export Quality)",
    areaHectares: 19.8,
    temp: 28.3,
    humidity: 46,
    pressure: 994.0,
    healthIndex: 88,
    status: "optimal",
    coordinates: { lat: 19.9975, lng: 73.7898 },
  },
];

export interface OutbreakAlert {
  id: string;
  timestamp: string;
  stationId: string;
  stationName: string;
  crop: string;
  disease: string;
  severity: "critical" | "warning" | "monitored";
  confidence: number;
  location: string;
  recommendedAction: string;
}

export const RECENT_ALERTS: OutbreakAlert[] = [
  {
    id: "alt-01",
    timestamp: "10 mins ago",
    stationId: "himachal-apple",
    stationName: "Himachal Apple Valley",
    crop: "Apple",
    disease: "Cedar Apple Rust",
    severity: "warning",
    confidence: 0.94,
    location: "Block 04, Row 12",
    recommendedAction: "Apply preventative myclobutanil fungicide before evening rain.",
  },
  {
    id: "alt-02",
    timestamp: "32 mins ago",
    stationId: "jammu-plains",
    stationName: "Jammu Plains",
    crop: "Tomato",
    disease: "Early Blight (Alternaria solani)",
    severity: "warning",
    confidence: 0.88,
    location: "Polyhouse 02, South Bay",
    recommendedAction: "Prune bottom 12 inches of infected leaves; turn on drip airflow.",
  },
  {
    id: "alt-03",
    timestamp: "1 hour ago",
    stationId: "nashik-vineyard",
    stationName: "Nashik Vineyard",
    crop: "Grape",
    disease: "Black Rot",
    severity: "critical",
    confidence: 0.96,
    location: "East Trellis Zone 3",
    recommendedAction: "Immediate sulfur spray and quarantine row 7 to 9.",
  },
  {
    id: "alt-04",
    timestamp: "3 hours ago",
    stationId: "punjab-wheat",
    stationName: "Punjab Wheat Estate",
    crop: "Corn",
    disease: "Common Rust",
    severity: "monitored",
    confidence: 0.76,
    location: "Field Boundary North",
    recommendedAction: "Spore count low. Routine foliar neem spray scheduled.",
  },
];

export interface TelemetryPoint {
  time: string;
  temp: number;
  humidity: number;
  pressure: number;
  sporeRisk: number;
}

export const TELEMETRY_HISTORY: Record<string, TelemetryPoint[]> = {
  "15m": [
    { time: "03:35", temp: 22.1, humidity: 47, pressure: 973.2, sporeRisk: 12 },
    { time: "03:38", temp: 22.1, humidity: 48, pressure: 973.3, sporeRisk: 14 },
    { time: "03:41", temp: 22.2, humidity: 48, pressure: 973.4, sporeRisk: 15 },
    { time: "03:44", temp: 22.2, humidity: 48, pressure: 973.5, sporeRisk: 16 },
    { time: "03:47", temp: 22.3, humidity: 49, pressure: 973.5, sporeRisk: 18 },
    { time: "03:50", temp: 22.2, humidity: 48, pressure: 973.5, sporeRisk: 16 },
  ],
  "1h": [
    { time: "02:50", temp: 21.8, humidity: 44, pressure: 972.8, sporeRisk: 10 },
    { time: "03:05", temp: 22.0, humidity: 46, pressure: 973.0, sporeRisk: 12 },
    { time: "03:20", temp: 22.3, humidity: 49, pressure: 973.2, sporeRisk: 15 },
    { time: "03:35", temp: 22.5, humidity: 51, pressure: 973.4, sporeRisk: 19 },
    { time: "03:50", temp: 22.2, humidity: 48, pressure: 973.5, sporeRisk: 16 },
  ],
  "6h": [
    { time: "10:00", temp: 19.2, humidity: 62, pressure: 970.5, sporeRisk: 28 },
    { time: "11:30", temp: 21.0, humidity: 56, pressure: 971.8, sporeRisk: 22 },
    { time: "13:00", temp: 23.4, humidity: 45, pressure: 972.9, sporeRisk: 14 },
    { time: "14:30", temp: 23.8, humidity: 43, pressure: 973.2, sporeRisk: 11 },
    { time: "16:00", temp: 22.2, humidity: 48, pressure: 973.5, sporeRisk: 16 },
  ],
  "24h": [
    { time: "Yesterday 16:00", temp: 23.0, humidity: 46, pressure: 972.1, sporeRisk: 15 },
    { time: "Yesterday 22:00", temp: 18.5, humidity: 72, pressure: 970.0, sporeRisk: 42 },
    { time: "Today 04:00", temp: 16.2, humidity: 85, pressure: 969.4, sporeRisk: 58 },
    { time: "Today 10:00", temp: 20.4, humidity: 58, pressure: 971.5, sporeRisk: 25 },
    { time: "Today 16:00", temp: 22.2, humidity: 48, pressure: 973.5, sporeRisk: 16 },
  ],
};
