import React, { useState } from "react";
import { PredictionResponse } from "@/types/prediction";
import { PATHOGEN_DETAILS } from "@/data/cropKnowledge";

interface CropAiResultCardProps {
  prediction: PredictionResponse;
  originalImageSrc: string;
  onReset: () => void;
}

const CROP_ICONS: Record<string, string> = {
  Tomato: "🍅",
  Potato: "🥔",
  Corn: "🌽",
  Apple: "🍎",
  Grape: "🍇",
  Pepper_bell: "🫑",
  Squash: "🎃",
  Strawberry: "🍓",
  Cherry: "🍒",
  Peach: "🍑",
  Orange: "🍊",
  Blueberry: "🫐",
  Soybean: "🌱",
};

export const CropAiResultCard: React.FC<CropAiResultCardProps> = ({
  prediction,
  originalImageSrc,
  onReset,
}) => {
  const { label, confidence, gradcam, advice } = prediction;
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [heatmapOpacity, setHeatmapOpacity] = useState(0.55);

  // Extract crop & pathology names
  let crop = "Plant";
  let diseaseRaw = label;
  let cropIcon = "🌿";

  if (label.includes("___")) {
    const parts = label.split("___");
    crop = parts[0].replace("_", " ");
    diseaseRaw = parts[1].replace(/_/g, " ");
    cropIcon = CROP_ICONS[parts[0]] || "🌿";
  }

  const isHealthy = label.toLowerCase().includes("healthy");
  const formattedTitle = `${crop} ${diseaseRaw}`;

  // Lookup pathogen and farmer advice
  const detail = PATHOGEN_DETAILS[label];
  const pathogenName = detail?.pathogen || (isHealthy ? "Healthy Tissue" : "Pathogen");
  const diagnosisText = detail?.diagnosis || advice?.symptoms || "Pathology identified with high confidence.";
  const farmersAdvice = detail?.farmersAdvice || (isHealthy 
    ? "Your plant is healthy! Continue standard watering and crop rotation."
    : "Inspect adjacent plants immediately and remove any leaves showing early signs of infection.");

  // Confidence label
  const confPercent = Math.round(confidence * 100);
  const confBadgeText = confPercent >= 85 ? `High (${confPercent}%)` : confPercent >= 60 ? `Moderate (${confPercent}%)` : `Review (${confPercent}%)`;

  const heatmapSrc = gradcam ? `data:image/png;base64,${gradcam}` : null;

  return (
    <div className="w-full max-w-xl mx-auto rounded-3xl overflow-hidden shadow-2xl border border-gray-200 bg-white transition-all space-y-0">
      {/* Top Header Box (Matches Image 2) */}
      <div className="bg-[#eafaf1] border-b border-[#a7f3d0] p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          {/* Crop Icon in white rounded card */}
          <div className="w-14 h-14 rounded-2xl bg-white border border-[#a7f3d0] flex items-center justify-center text-3xl shadow-sm flex-shrink-0">
            {cropIcon}
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-black text-gray-900 tracking-tight leading-snug">
              {formattedTitle}
            </h2>
            <p className="text-xs sm:text-sm font-semibold text-emerald-800 italic">
              ({pathogenName})
            </p>
            {/* Confidence Badge */}
            <div className="pt-1.5">
              <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#fef3c7] text-[#92400e] border border-[#fde68a] shadow-sm">
                <span>⭐</span>
                <span>Confidence: {confBadgeText}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Grad-CAM Toggle Pill */}
        {heatmapSrc && (
          <button
            type="button"
            onClick={() => setShowHeatmap(!showHeatmap)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shadow-sm border ${
              showHeatmap
                ? "bg-[#16a34a] text-white border-[#15803d]"
                : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
            }`}
          >
            <span>🔬</span>
            <span>{showHeatmap ? "Hide Heatmap" : "View Heatmap"}</span>
          </button>
        )}
      </div>

      {/* Heatmap overlay expander if active */}
      {showHeatmap && heatmapSrc && (
        <div className="bg-gray-900 p-4 border-b border-gray-800 space-y-3">
          <div className="relative aspect-[4/3] max-h-72 w-full rounded-2xl overflow-hidden bg-black mx-auto">
            <img src={originalImageSrc} alt="Crop Leaf" className="w-full h-full object-contain" />
            <img
              src={heatmapSrc}
              alt="Grad-CAM Saliency"
              className="absolute inset-0 w-full h-full object-contain mix-blend-screen pointer-events-none"
              style={{ opacity: heatmapOpacity }}
            />
          </div>
          <div className="flex items-center justify-between text-xs text-white max-w-sm mx-auto pt-1">
            <span>Heatmap Opacity: {Math.round(heatmapOpacity * 100)}%</span>
            <input
              type="range"
              min="0.1"
              max="1.0"
              step="0.05"
              value={heatmapOpacity}
              onChange={(e) => setHeatmapOpacity(parseFloat(e.target.value))}
              className="w-36 accent-emerald-500 cursor-pointer"
            />
          </div>
        </div>
      )}

      {/* Card Content Sections */}
      <div className="p-6 sm:p-7 space-y-6 text-gray-800">
        {/* 1. DIAGNOSIS */}
        <div className="space-y-1.5">
          <div className="flex items-center space-x-2 text-xs font-black uppercase tracking-wider text-[#059669]">
            <span>🔬</span>
            <span>DIAGNOSIS</span>
          </div>
          <p className="text-xs sm:text-sm text-gray-700 leading-relaxed font-normal">
            {diagnosisText}
          </p>
        </div>

        <div className="h-px bg-gray-100" />

        {/* 2. TREATMENT */}
        <div className="space-y-2">
          <div className="flex items-center space-x-2 text-xs font-black uppercase tracking-wider text-[#059669]">
            <span>💊</span>
            <span>TREATMENT</span>
          </div>
          {advice?.chemical_treatment && advice.chemical_treatment.length > 0 && !isHealthy ? (
            <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">
              {advice.chemical_treatment.join(" ")}
            </p>
          ) : advice?.organic_treatment && advice.organic_treatment.length > 0 ? (
            <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">
              {advice.organic_treatment.join(" ")}
            </p>
          ) : (
            <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">
              No curative chemical treatments necessary for healthy foliage. Continue regular garden hygiene and balanced soil nutrition.
            </p>
          )}
        </div>

        <div className="h-px bg-gray-100" />

        {/* 3. PREVENTION */}
        <div className="space-y-2.5">
          <div className="flex items-center space-x-2 text-xs font-black uppercase tracking-wider text-[#059669]">
            <span>🛡️</span>
            <span>PREVENTION</span>
          </div>
          <ul className="space-y-2">
            {advice?.prevention && advice.prevention.length > 0 ? (
              advice.prevention.map((item, idx) => (
                <li key={idx} className="flex items-start space-x-2 text-xs sm:text-sm text-gray-700 leading-relaxed">
                  <span className="text-[#16a34a] font-bold text-sm leading-none mt-0.5">✅</span>
                  <span>{item}</span>
                </li>
              ))
            ) : (
              <>
                <li className="flex items-start space-x-2 text-xs sm:text-sm text-gray-700 leading-relaxed">
                  <span className="text-[#16a34a] font-bold text-sm leading-none mt-0.5">✅</span>
                  <span>Start with certified disease-free seeds or transplants</span>
                </li>
                <li className="flex items-start space-x-2 text-xs sm:text-sm text-gray-700 leading-relaxed">
                  <span className="text-[#16a34a] font-bold text-sm leading-none mt-0.5">✅</span>
                  <span>Practice 2-3 year crop rotation away from the host crop family</span>
                </li>
                <li className="flex items-start space-x-2 text-xs sm:text-sm text-gray-700 leading-relaxed">
                  <span className="text-[#16a34a] font-bold text-sm leading-none mt-0.5">✅</span>
                  <span>Use drip irrigation instead of overhead watering to keep foliage dry</span>
                </li>
                <li className="flex items-start space-x-2 text-xs sm:text-sm text-gray-700 leading-relaxed">
                  <span className="text-[#16a34a] font-bold text-sm leading-none mt-0.5">✅</span>
                  <span>Sanitize pruning tools and shears between beds with bleach solution</span>
                </li>
              </>
            )}
          </ul>
        </div>

        {/* 4. FARMER'S ADVICE (Yellow highlight card) */}
        <div className="p-4 rounded-2xl bg-[#fffbeb] border border-[#fef3c7] space-y-1.5">
          <div className="flex items-center space-x-2 text-xs font-black uppercase tracking-wider text-[#b45309]">
            <span>🧑‍🌾</span>
            <span>FARMER'S ADVICE</span>
          </div>
          <p className="text-xs sm:text-sm text-[#92400e] leading-relaxed font-medium">
            {farmersAdvice}
          </p>
        </div>

        {/* 5. Bottom Analyze Another Crop Button */}
        <div className="pt-2">
          <button
            type="button"
            onClick={onReset}
            className="w-full py-3.5 px-6 rounded-2xl text-sm font-extrabold text-[#16a34a] bg-[#ecfdf5] hover:bg-[#d1fae5] border border-[#a7f3d0] transition-colors flex items-center justify-center space-x-2 shadow-sm active:scale-[0.99]"
          >
            <span>🔄</span>
            <span>Analyze Another Crop</span>
          </button>
        </div>
      </div>
    </div>
  );
};

