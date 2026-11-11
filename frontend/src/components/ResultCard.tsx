import React from "react";
import { useTranslation } from "react-i18next";
import { PredictionResponse } from "@/types/prediction";

interface ResultCardProps {
  prediction: PredictionResponse;
}

export const ResultCard: React.FC<ResultCardProps> = ({ prediction }) => {
  const { t } = useTranslation();
  const { label, confidence, top3, is_uncertain, is_ood, latency_ms } = prediction;

  const isHealthy = label.toLowerCase().includes("healthy");
  const formattedLabel = label === "Unknown" ? "Unknown / Non-Crop" : label.replace("___", ": ");

  const confPercent = Math.round(confidence * 100);

  const getConfidenceBarColor = () => {
    if (is_ood || is_uncertain) return "bg-amber-500";
    if (confPercent >= 80) return "bg-emerald-500";
    if (confPercent >= 50) return "bg-blue-500";
    return "bg-rose-500";
  };

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 shadow-sm space-y-4">
      {/* Top Banners for OOD / Low Confidence */}
      {is_ood && (
        <div className="flex items-start space-x-2.5 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs">
          <span className="text-base">⚠️</span>
          <span className="leading-relaxed font-medium">{t("result.oodBanner")}</span>
        </div>
      )}

      {!is_ood && is_uncertain && (
        <div className="flex items-start space-x-2.5 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs">
          <span className="text-base">❓</span>
          <span className="leading-relaxed font-medium">{t("result.uncertainBanner")}</span>
        </div>
      )}

      {/* Primary Diagnosis */}
      <div>
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
          <span>{t("result.diagnosisTitle")}</span>
          <span className="font-mono text-[11px]">{latency_ms} ms</span>
        </div>
        <div className="flex items-center space-x-2">
          <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            {formattedLabel}
          </h2>
          {isHealthy && !is_ood && (
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
              {t("result.healthyTag")}
            </span>
          )}
        </div>
      </div>

      {/* Confidence Bar */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs font-semibold">
          <span className="text-gray-700 dark:text-gray-300">{t("result.confidence")}</span>
          <span className="font-mono">{confPercent}%</span>
        </div>
        <div className="w-full bg-gray-100 dark:bg-gray-800 h-2.5 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${getConfidenceBarColor()}`}
            style={{ width: `${Math.max(confPercent, 4)}%` }}
          />
        </div>
      </div>

      {/* Top-3 Candidate Predictions */}
      {top3 && top3.length > 0 && (
        <div className="pt-2 border-t border-gray-100 dark:border-gray-800 space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
            {t("result.top3Title")}
          </h3>
          <div className="space-y-1.5">
            {top3.map((entry) => (
              <div
                key={entry.rank}
                className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-gray-50 dark:bg-gray-800/40"
              >
                <div className="flex items-center space-x-2 truncate">
                  <span className="text-gray-400 font-mono text-[10px]">#{entry.rank}</span>
                  <span className="font-medium text-gray-800 dark:text-gray-200 truncate">
                    {entry.class_id.replace("___", ": ")}
                  </span>
                </div>
                <span className="font-mono text-gray-500 dark:text-gray-400 ml-2">
                  {Math.round(entry.confidence * 100)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

