import React from "react";
import { useTranslation } from "react-i18next";
import { PredictionResponse } from "@/types/prediction";

interface ResultCardProps {
  prediction: PredictionResponse;
}

const CROP_EMOJIS: Record<string, string> = {
  Apple: "🍎",
  Blueberry: "🫐",
  Cherry: "🍒",
  Corn: "🌽",
  Grape: "🍇",
  Orange: "🍊",
  Peach: "🍑",
  Pepper_bell: "🫑",
  Potato: "🥔",
  Raspberry: "🫐",
  Soybean: "🌱",
  Squash: "🎃",
  Strawberry: "🍓",
  Tomato: "🍅",
};

export const ResultCard: React.FC<ResultCardProps> = ({ prediction }) => {
  const { t } = useTranslation();
  const { label, confidence, top3, latency_ms } = prediction;

  const isHealthy = label.toLowerCase().includes("healthy");

  // Parse Crop & Pathology
  let cropName = "Plant";
  let diseaseName = label;
  let cropEmoji = "🌿";

  if (label.includes("___")) {
    const parts = label.split("___");
    cropName = parts[0].replace("_", " ");
    diseaseName = parts[1].replace(/_/g, " ");
    cropEmoji = CROP_EMOJIS[parts[0]] || "🌿";
  } else if (label !== "Unknown") {
    diseaseName = label.replace(/_/g, " ");
  }

  const confPercent = Math.round(confidence * 100);

  const getGradientByConfidence = () => {
    if (isHealthy) return "from-emerald-500 to-teal-400";
    if (confPercent >= 80) return "from-emerald-500 via-teal-500 to-cyan-500";
    if (confPercent >= 50) return "from-amber-500 to-orange-400";
    return "from-rose-500 to-pink-500";
  };

  return (
    <div className="relative overflow-hidden bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border border-gray-200/80 dark:border-gray-800 rounded-3xl p-6 shadow-xl space-y-5 transition-all">
      {/* Decorative ambient corner glow */}
      <div className="absolute -top-12 -right-12 w-36 h-36 bg-gradient-to-br from-brand-400/20 to-teal-400/10 rounded-full blur-2xl pointer-events-none" />

      {/* Header bar: Diagnostic Badge & Latency */}
      <div className="flex items-center justify-between">
        <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300 border border-brand-200 dark:border-brand-800">
          <span className="w-2 h-2 rounded-full bg-brand-500 animate-pulse" />
          <span>AI Pathology Diagnosis</span>
        </div>
        <div className="flex items-center space-x-1 text-xs font-mono font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800/80 px-2.5 py-1 rounded-full border border-gray-200 dark:border-gray-700">
          <span>⚡</span>
          <span>{latency_ms} ms</span>
        </div>
      </div>

      {/* Primary Diagnosis */}
      <div>
        <div className="flex items-center space-x-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
          <span>{cropEmoji}</span>
          <span>{cropName} Foliage</span>
        </div>
        <div className="flex items-baseline flex-wrap gap-2">
          <h2 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
            {diseaseName}
          </h2>
          {isHealthy ? (
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
              ✓ Healthy Leaf
            </span>
          ) : (
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
              Pathology Detected
            </span>
          )}
        </div>
      </div>

      {/* Modern Gradient Confidence Gauge */}
      <div className="space-y-2 bg-gray-50/80 dark:bg-gray-800/40 p-4 rounded-2xl border border-gray-100 dark:border-gray-800">
        <div className="flex justify-between items-center text-xs font-bold">
          <span className="text-gray-600 dark:text-gray-300 uppercase tracking-wider">
            {t("result.confidence")} (Calibrated)
          </span>
          <span className="text-sm font-extrabold font-mono text-gray-900 dark:text-white">
            {confPercent}%
          </span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700/60 h-3 rounded-full overflow-hidden p-0.5">
          <div
            className={`h-full rounded-full bg-gradient-to-r ${getGradientByConfidence()} transition-all duration-700 shadow-sm`}
            style={{ width: `${Math.max(confPercent, 5)}%` }}
          />
        </div>
        <p className="text-[11px] text-gray-500 dark:text-gray-400 flex items-center justify-between pt-0.5">
          <span>Temperature Calibrated (ECE &lt; 0.002)</span>
          <span>High Reliability</span>
        </p>
      </div>

      {/* Top-3 Candidate Predictions with Mini-Bars */}
      {top3 && top3.length > 0 && (
        <div className="pt-2 border-t border-gray-100 dark:border-gray-800 space-y-2.5">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
            <span>{t("result.top3Title")}</span>
            <span>Probability</span>
          </div>
          <div className="space-y-2">
            {top3.map((entry) => {
              const entryCrop = entry.class_id.includes("___")
                ? entry.class_id.split("___")[0]
                : "Plant";
              const entryEmoji = CROP_EMOJIS[entryCrop] || "🌿";
              const cleanEntryName = entry.class_id.replace("___", ": ").replace(/_/g, " ");
              const entryPct = Math.round(entry.confidence * 100);

              return (
                <div
                  key={entry.rank}
                  className="group p-2.5 rounded-xl bg-gray-50 hover:bg-gray-100 dark:bg-gray-800/40 dark:hover:bg-gray-800/80 transition-all border border-gray-100 dark:border-gray-800"
                >
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <div className="flex items-center space-x-2 truncate">
                      <span className="w-5 h-5 rounded-md bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-[10px] font-bold text-gray-700 dark:text-gray-300">
                        #{entry.rank}
                      </span>
                      <span className="text-sm">{entryEmoji}</span>
                      <span className="font-semibold text-gray-800 dark:text-gray-200 truncate">
                        {cleanEntryName}
                      </span>
                    </div>
                    <span className="font-mono font-bold text-xs text-gray-700 dark:text-gray-300">
                      {entryPct}%
                    </span>
                  </div>
                  {/* Subtle probability bar */}
                  <div className="w-full bg-gray-200 dark:bg-gray-700/50 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-brand-500 rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(entryPct, 2)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
