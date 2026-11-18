import { AdviceEntry, PredictionResponse, Top3Entry } from "./types";
import adviceData from "../data/advice_kb.json";

export const DEMO_CLASSES: string[] = [
  "Apple___Apple_scab",
  "Apple___Black_rot",
  "Apple___Cedar_apple_rust",
  "Apple___healthy",
  "Blueberry___healthy",
  "Cherry___Powdery_mildew",
  "Cherry___healthy",
  "Corn___Common_rust",
  "Corn___Gray_leaf_spot",
  "Corn___Northern_Leaf_Blight",
  "Corn___healthy",
  "Grape___Black_rot",
  "Grape___Esca_Black_Measles",
  "Grape___Leaf_blight",
  "Grape___healthy",
  "Orange___Citrus_greening",
  "Peach___Bacterial_spot",
  "Peach___healthy",
  "Pepper_bell___Bacterial_spot",
  "Pepper_bell___healthy",
  "Potato___Early_blight",
  "Potato___Late_blight",
  "Potato___healthy",
  "Raspberry___healthy",
  "Soybean___healthy",
  "Squash___Powdery_mildew",
  "Strawberry___Leaf_scorch",
  "Strawberry___healthy",
  "Tomato___Bacterial_spot",
  "Tomato___Early_blight",
  "Tomato___Late_blight",
  "Tomato___Leaf_Mold",
  "Tomato___Mosaic_virus",
  "Tomato___Septoria_leaf_spot",
  "Tomato___Spider_mites",
  "Tomato___Target_Spot",
  "Tomato___Yellow_Leaf_Curl_Virus",
  "Tomato___healthy",
];

const DEFAULT_HEALTHY_ADVICE: AdviceEntry = {
  severity: "healthy",
  symptoms:
    "Foliage shows uniform green coloration, turgid leaf structure, and no visible lesions, chlorosis, mold, or pest feeding damage.",
  organic_treatment: [
    "No curative treatment required; continue balanced compost or vermicompost top-dressing.",
    "Maintain beneficial microbial activity with periodic seaweed or compost tea foliar feeds if appropriate.",
  ],
  chemical_treatment: ["No fungicide or insecticide application needed."],
  prevention: [
    "Maintain adequate plant spacing for airflow and avoid overhead evening irrigation.",
    "Inspect lower leaves weekly for early signs of spots, webbing, or insect eggs.",
    "Rotate crops seasonally and sanitize pruning tools between beds.",
  ],
};

const DEFAULT_DISEASE_ADVICE: AdviceEntry = {
  severity: "moderate",
  symptoms:
    "Abnormal leaf spotting, chlorotic halos, or necrotic lesions observed on plant tissue.",
  organic_treatment: [
    "Prune and destroy heavily affected leaves away from the field (do not compost diseased debris).",
    "Apply cold-pressed neem oil (0.5-1%) or potassium bicarbonate / copper soap per label guidance in cool evening hours.",
  ],
  chemical_treatment: [
    "Consult a local agricultural extension officer to confirm the exact pathogen or pest before spraying.",
    "Use a targeted, registered fungicide or bactericide following label dosage and pre-harvest intervals.",
  ],
  prevention: [
    "Water at the root zone in the morning so foliage dries rapidly.",
    "Practice a 2-3 year crop rotation and plant certified disease-free seeds or resistant varieties.",
    "Control weeds and volunteer host plants around field borders.",
  ],
};

export function getDemoAdvice(classId: string): AdviceEntry {
  const kb = adviceData as Record<string, AdviceEntry>;
  if (kb[classId]) {
    return kb[classId];
  }

  // Check case-insensitive
  const lowerMap = Object.entries(kb).reduce<Record<string, AdviceEntry>>(
    (acc, [k, v]) => {
      acc[k.toLowerCase()] = v;
      return acc;
    },
    {}
  );
  if (lowerMap[classId.toLowerCase()]) {
    return lowerMap[classId.toLowerCase()];
  }

  if (classId.toLowerCase().includes("healthy")) {
    return DEFAULT_HEALTHY_ADVICE;
  }

  return DEFAULT_DISEASE_ADVICE;
}

function generateHeatmapDataUrl(): string | null {
  try {
    if (typeof document === "undefined") return null;
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    // Draw dark transparent background
    ctx.clearRect(0, 0, 256, 256);

    // Primary foliar lesion hotspot
    const grad1 = ctx.createRadialGradient(130, 125, 8, 130, 125, 95);
    grad1.addColorStop(0, "rgba(239, 68, 68, 0.85)"); // Intense red (pathogen focus)
    grad1.addColorStop(0.35, "rgba(245, 158, 11, 0.72)"); // Warm amber
    grad1.addColorStop(0.65, "rgba(16, 185, 129, 0.4)"); // Cool emerald
    grad1.addColorStop(0.9, "rgba(59, 130, 246, 0.15)"); // Blue boundary
    grad1.addColorStop(1, "rgba(59, 130, 246, 0)");
    ctx.fillStyle = grad1;
    ctx.fillRect(0, 0, 256, 256);

    // Secondary lesion hotspot
    const grad2 = ctx.createRadialGradient(80, 165, 4, 80, 165, 55);
    grad2.addColorStop(0, "rgba(220, 38, 38, 0.75)");
    grad2.addColorStop(0.5, "rgba(245, 158, 11, 0.5)");
    grad2.addColorStop(1, "rgba(245, 158, 11, 0)");
    ctx.fillStyle = grad2;
    ctx.fillRect(0, 0, 256, 256);

    return canvas.toDataURL("image/png");
  } catch {
    return null;
  }
}

export async function simulateClientPrediction(
  file: Blob | File
): Promise<PredictionResponse> {
  // Simulate rapid neural network inference delay (300-450ms)
  await new Promise((resolve) => setTimeout(resolve, 380));

  const fileName = ((file as File).name || "").toLowerCase();

  // Match file name against common crop pathology indicators
  let chosenClass = "Tomato___Early_blight";
  let runnerUp1 = "Tomato___Late_blight";
  let runnerUp2 = "Tomato___Target_Spot";

  if (fileName.includes("apple") || fileName.includes("cedar")) {
    chosenClass = "Apple___Cedar_apple_rust";
    runnerUp1 = "Apple___Apple_scab";
    runnerUp2 = "Apple___Black_rot";
  } else if (fileName.includes("corn") || fileName.includes("maize")) {
    chosenClass = "Corn___Common_rust";
    runnerUp1 = "Corn___Gray_leaf_spot";
    runnerUp2 = "Corn___Northern_Leaf_Blight";
  } else if (fileName.includes("grape") || fileName.includes("rot")) {
    chosenClass = "Grape___Black_rot";
    runnerUp1 = "Grape___Esca_Black_Measles";
    runnerUp2 = "Grape___Leaf_blight";
  } else if (fileName.includes("potato")) {
    chosenClass = "Potato___Early_blight";
    runnerUp1 = "Potato___Late_blight";
    runnerUp2 = "Tomato___Early_blight";
  } else if (fileName.includes("peach")) {
    chosenClass = "Peach___Bacterial_spot";
    runnerUp1 = "Tomato___Bacterial_spot";
    runnerUp2 = "Pepper_bell___Bacterial_spot";
  } else if (fileName.includes("pepper")) {
    chosenClass = "Pepper_bell___Bacterial_spot";
    runnerUp1 = "Tomato___Bacterial_spot";
    runnerUp2 = "Potato___Early_blight";
  } else if (fileName.includes("squash") || fileName.includes("powdery")) {
    chosenClass = "Squash___Powdery_mildew";
    runnerUp1 = "Cherry___Powdery_mildew";
    runnerUp2 = "Tomato___Leaf_Mold";
  } else if (fileName.includes("healthy")) {
    chosenClass = "Tomato___healthy";
    runnerUp1 = "Potato___healthy";
    runnerUp2 = "Pepper_bell___healthy";
  } else {
    // Deterministic selection based on file size or name
    const hash = ((file as File).size || 1024) % 4;
    if (hash === 1) {
      chosenClass = "Apple___Cedar_apple_rust";
      runnerUp1 = "Apple___Apple_scab";
      runnerUp2 = "Apple___Black_rot";
    } else if (hash === 2) {
      chosenClass = "Corn___Common_rust";
      runnerUp1 = "Corn___Northern_Leaf_Blight";
      runnerUp2 = "Corn___Gray_leaf_spot";
    } else if (hash === 3) {
      chosenClass = "Grape___Black_rot";
      runnerUp1 = "Grape___Leaf_blight";
      runnerUp2 = "Tomato___Late_blight";
    }
  }

  const confidence = 0.942;
  const top3: Top3Entry[] = [
    { rank: 1, class_id: chosenClass, confidence: confidence },
    { rank: 2, class_id: runnerUp1, confidence: 0.043 },
    { rank: 3, class_id: runnerUp2, confidence: 0.015 },
  ];

  const advice = getDemoAdvice(chosenClass);
  const gradcamDataUrl = generateHeatmapDataUrl();

  return {
    request_id: `demo_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    label: chosenClass,
    confidence: confidence,
    top3: top3,
    gradcam: gradcamDataUrl,
    advice: advice,
    is_uncertain: false,
    is_ood: false,
    latency_ms: 114,
    is_demo_mode: true,
  };
}
