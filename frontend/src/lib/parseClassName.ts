export interface ParsedClass {
  raw: string;
  crop: string;
  disease: string;
  displayName: string;
  cropEmoji: string;
  cropHindi: string;
  category: "healthy" | "pest" | "diseased";
  isHealthy: boolean;
  scientificName?: string;
}

export const CROP_METADATA: Record<
  string,
  { name: string; hindi: string; emoji: string }
> = {
  Apple: { name: "Apple", hindi: "सेब", emoji: "🍎" },
  Blueberry: { name: "Blueberry", hindi: "ब्लूबेरी", emoji: "🫐" },
  Cherry: { name: "Cherry", hindi: "चेरी", emoji: "🍒" },
  Corn: { name: "Corn", hindi: "मक्का", emoji: "🌽" },
  Grape: { name: "Grape", hindi: "अंगूर", emoji: "🍇" },
  Orange: { name: "Orange", hindi: "संतरा", emoji: "🍊" },
  Peach: { name: "Peach", hindi: "आड़ू", emoji: "🍑" },
  Pepper_bell: { name: "Bell Pepper", hindi: "शिमला मिर्च", emoji: "🫑" },
  Potato: { name: "Potato", hindi: "आलू", emoji: "🥔" },
  Raspberry: { name: "Raspberry", hindi: "रसभरी", emoji: "🫐" },
  Soybean: { name: "Soybean", hindi: "सोयाबीन", emoji: "🌱" },
  Squash: { name: "Squash", hindi: "कद्दू / तोरी", emoji: "🎃" },
  Strawberry: { name: "Strawberry", hindi: "स्ट्रॉबेरी", emoji: "🍓" },
  Tomato: { name: "Tomato", hindi: "टमाटर", emoji: "🍅" },
};

export const SCIENTIFIC_NAMES: Record<string, string> = {
  "Tomato___Bacterial_spot": "Xanthomonas vesicatoria",
  "Tomato___Early_blight": "Alternaria solani",
  "Tomato___Late_blight": "Phytophthora infestans",
  "Tomato___Leaf_Mold": "Passalora fulva",
  "Tomato___Septoria_leaf_spot": "Septoria lycopersici",
  "Tomato___Spider_mites": "Tetranychus urticae",
  "Tomato___Target_Spot": "Corynespora cassiicola",
  "Tomato___Yellow_Leaf_Curl_Virus": "Begomovirus (TYLCV)",
  "Tomato___Mosaic_virus": "Tomato Mosaic Virus (TMV)",
  "Potato___Early_blight": "Alternaria solani",
  "Potato___Late_blight": "Phytophthora infestans",
  "Corn___Common_rust": "Puccinia sorghi",
  "Corn___Gray_leaf_spot": "Cercospora zeae-maydis",
  "Corn___Northern_Leaf_Blight": "Exserohilum turcicum",
  "Apple___Apple_scab": "Venturia inaequalis",
  "Apple___Black_rot": "Botryosphaeria obtusa",
  "Apple___Cedar_apple_rust": "Gymnosporangium juniperi-virginianae",
  "Grape___Black_rot": "Guignardia bidwellii",
  "Grape___Esca_Black_Measles": "Phaeomoniella chlamydospora",
  "Grape___Leaf_blight": "Pseudocercospora cladosporioides",
  "Pepper_bell___Bacterial_spot": "Xanthomonas campestris pv. vesicatoria",
  "Squash___Powdery_mildew": "Podosphaera xanthii",
  "Strawberry___Leaf_scorch": "Diplocarpon earlianum",
  "Cherry___Powdery_mildew": "Podosphaera clandestina",
  "Peach___Bacterial_spot": "Xanthomonas arboricola pv. pruni",
  "Orange___Citrus_greening": "Candidatus Liberibacter asiaticus",
};

export function parseClassName(rawLabel: string | undefined | null): ParsedClass {
  if (!rawLabel || rawLabel === "Unknown") {
    return {
      raw: "Unknown",
      crop: "Plant",
      disease: "Unidentified",
      displayName: "Unidentified Sample",
      cropEmoji: "🌿",
      cropHindi: "पौधा",
      category: "diseased",
      isHealthy: false,
    };
  }

  if (rawLabel.includes("___")) {
    const [rawCrop, rawDisease] = rawLabel.split("___");
    const cropMeta = CROP_METADATA[rawCrop] || {
      name: rawCrop.replace(/_/g, " "),
      hindi: rawCrop,
      emoji: "🌿",
    };

    const cleanDisease = rawDisease.replace(/_/g, " ");
    const isHealthy = cleanDisease.toLowerCase().includes("healthy");
    const isPest = cleanDisease.toLowerCase().includes("mite") || rawCrop.toLowerCase() === "pest";

    let category: "healthy" | "pest" | "diseased" = "diseased";
    if (isHealthy) category = "healthy";
    else if (isPest) category = "pest";

    return {
      raw: rawLabel,
      crop: cropMeta.name,
      disease: cleanDisease,
      displayName: `${cropMeta.name} · ${cleanDisease}`,
      cropEmoji: cropMeta.emoji,
      cropHindi: cropMeta.hindi,
      category,
      isHealthy,
      scientificName: SCIENTIFIC_NAMES[rawLabel],
    };
  }

  // Fallback single string
  const cleanName = rawLabel.replace(/_/g, " ");
  const isHealthy = cleanName.toLowerCase().includes("healthy");
  return {
    raw: rawLabel,
    crop: "Crop",
    disease: cleanName,
    displayName: cleanName,
    cropEmoji: "🌿",
    cropHindi: "फसल",
    category: isHealthy ? "healthy" : "diseased",
    isHealthy,
    scientificName: SCIENTIFIC_NAMES[rawLabel],
  };
}
