export interface CropZone {
  id: string;
  name: string;
  crop: string;
  areaAcres: number;
  healthIndex: number;
  dominantPathogen: string | null;
  severity: "healthy" | "warning" | "critical";
  lastScanTime: string;
  coordinates: { lat: number; lng: number };
}

export const CROP_ZONES: CropZone[] = [
  {
    id: "tomato-polyhouse-1",
    name: "Tomato Polyhouse · Zone A",
    crop: "Tomato (Solanum lycopersicum)",
    areaAcres: 4.5,
    healthIndex: 82,
    dominantPathogen: "Early Blight (Alternaria solani)",
    severity: "warning",
    lastScanTime: "12 mins ago",
    coordinates: { lat: 31.634, lng: 74.872 },
  },
  {
    id: "apple-orchard-north",
    name: "Apple Orchard · North Slope",
    crop: "Apple (Malus domestica)",
    areaAcres: 12.0,
    healthIndex: 94,
    dominantPathogen: "Cedar Apple Rust (Gymnosporangium)",
    severity: "healthy",
    lastScanTime: "28 mins ago",
    coordinates: { lat: 32.239, lng: 77.188 },
  },
  {
    id: "corn-belt-block-3",
    name: "Corn / Maize Belt · Block 03",
    crop: "Corn (Zea mays)",
    areaAcres: 25.0,
    healthIndex: 88,
    dominantPathogen: "Common Rust (Puccinia sorghi)",
    severity: "healthy",
    lastScanTime: "1 hour ago",
    coordinates: { lat: 30.901, lng: 75.857 },
  },
  {
    id: "grape-vineyard-west",
    name: "Grape Vineyard · West Trellis",
    crop: "Grape (Vitis vinifera)",
    areaAcres: 8.2,
    healthIndex: 71,
    dominantPathogen: "Black Rot (Guignardia bidwellii)",
    severity: "critical",
    lastScanTime: "4 mins ago",
    coordinates: { lat: 19.997, lng: 73.789 },
  },
  {
    id: "potato-field-south",
    name: "Potato Seed Beds · South Sector",
    crop: "Potato (Solanum tuberosum)",
    areaAcres: 16.0,
    healthIndex: 96,
    dominantPathogen: null,
    severity: "healthy",
    lastScanTime: "45 mins ago",
    coordinates: { lat: 26.846, lng: 80.946 },
  },
];

export interface DiseaseIncident {
  id: string;
  cropName: string;
  pathogenName: string;
  scientificName: string;
  zoneName: string;
  confidence: number;
  detectedAt: string;
  severity: "critical" | "warning" | "healthy";
  symptomsSummary: string;
  prescribedTreatment: string;
  imageUrl?: string;
}

export const RECENT_DISEASE_INCIDENTS: DiseaseIncident[] = [
  {
    id: "inc-101",
    cropName: "Tomato",
    pathogenName: "Early Blight",
    scientificName: "Alternaria solani",
    zoneName: "Tomato Polyhouse · Zone A",
    confidence: 0.945,
    detectedAt: "12 mins ago",
    severity: "warning",
    symptomsSummary: "Concentric bullseye rings and chlorotic halos observed on lower leaves.",
    prescribedTreatment: "Prune affected bottom foliage (10-12 in), avoid evening overhead watering, and apply copper hydroxide spray.",
  },
  {
    id: "inc-102",
    cropName: "Grape",
    pathogenName: "Black Rot",
    scientificName: "Guignardia bidwellii",
    zoneName: "Grape Vineyard · West Trellis",
    confidence: 0.962,
    detectedAt: "34 mins ago",
    severity: "critical",
    symptomsSummary: "Small reddish-brown circular spots expanding with black pycnidia pimples.",
    prescribedTreatment: "Immediate application of myclobutanil or mancozeb; remove and burn mummified berries.",
  },
  {
    id: "inc-103",
    cropName: "Corn",
    pathogenName: "Common Rust",
    scientificName: "Puccinia sorghi",
    zoneName: "Corn Belt · Block 03",
    confidence: 0.891,
    detectedAt: "1 hour ago",
    severity: "warning",
    symptomsSummary: "Golden-brown powdery pustules erupting across upper and lower leaf surfaces.",
    prescribedTreatment: "Scout surrounding rows; apply azoxystrobin fungicide if pustules cover >5% of ear leaf area.",
  },
  {
    id: "inc-104",
    cropName: "Potato",
    pathogenName: "Late Blight",
    scientificName: "Phytophthora infestans",
    zoneName: "Potato Seed Beds",
    confidence: 0.978,
    detectedAt: "2 hours ago",
    severity: "critical",
    symptomsSummary: "Water-soaked lesions turning dark purplish-black with white mildew rim underneath.",
    prescribedTreatment: "Apply systemic chlorothalonil + dimethomorph; destroy cull piles immediately to halt spore spread.",
  },
  {
    id: "inc-105",
    cropName: "Apple",
    pathogenName: "Cedar Apple Rust",
    scientificName: "Gymnosporangium juniperi-virginianae",
    zoneName: "Apple Orchard · North Slope",
    confidence: 0.914,
    detectedAt: "3 hours ago",
    severity: "warning",
    symptomsSummary: "Bright orange-yellow circular spots on upper leaf surfaces.",
    prescribedTreatment: "Apply preventative immunox or captan spray during petal-fall window.",
  },
];

export interface DiseaseTrendPoint {
  date: string;
  fungalBlight: number;
  bacterialSpot: number;
  viralPest: number;
  healthyRatio: number;
}

export const DISEASE_TRENDS: Record<string, DiseaseTrendPoint[]> = {
  "7d": [
    { date: "Mon", fungalBlight: 14, bacterialSpot: 6, viralPest: 3, healthyRatio: 92 },
    { date: "Tue", fungalBlight: 18, bacterialSpot: 8, viralPest: 4, healthyRatio: 89 },
    { date: "Wed", fungalBlight: 22, bacterialSpot: 9, viralPest: 5, healthyRatio: 86 },
    { date: "Thu", fungalBlight: 25, bacterialSpot: 11, viralPest: 4, healthyRatio: 83 },
    { date: "Fri", fungalBlight: 19, bacterialSpot: 7, viralPest: 3, healthyRatio: 88 },
    { date: "Sat", fungalBlight: 16, bacterialSpot: 6, viralPest: 2, healthyRatio: 91 },
    { date: "Sun", fungalBlight: 12, bacterialSpot: 5, viralPest: 2, healthyRatio: 94 },
  ],
  "30d": [
    { date: "Week 1", fungalBlight: 28, bacterialSpot: 14, viralPest: 8, healthyRatio: 85 },
    { date: "Week 2", fungalBlight: 34, bacterialSpot: 18, viralPest: 9, healthyRatio: 81 },
    { date: "Week 3", fungalBlight: 22, bacterialSpot: 12, viralPest: 6, healthyRatio: 89 },
    { date: "Week 4", fungalBlight: 15, bacterialSpot: 7, viralPest: 4, healthyRatio: 93 },
  ],
  "season": [
    { date: "Sowing", fungalBlight: 5, bacterialSpot: 2, viralPest: 1, healthyRatio: 98 },
    { date: "Vegetative", fungalBlight: 18, bacterialSpot: 9, viralPest: 6, healthyRatio: 91 },
    { date: "Flowering", fungalBlight: 36, bacterialSpot: 17, viralPest: 11, healthyRatio: 82 },
    { date: "Fruit Set", fungalBlight: 24, bacterialSpot: 11, viralPest: 7, healthyRatio: 88 },
    { date: "Harvest", fungalBlight: 12, bacterialSpot: 6, viralPest: 3, healthyRatio: 95 },
  ],
};
