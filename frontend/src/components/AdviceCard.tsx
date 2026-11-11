import React from "react";
import { useTranslation } from "react-i18next";
import { AdviceEntry } from "@/types/prediction";

interface AdviceCardProps {
  advice?: AdviceEntry | null;
  isHealthy?: boolean;
}

const severityBadgeMap: Record<string, { label: string; color: string }> = {
  healthy: { label: "Healthy", color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400" },
  low: { label: "Low Severity", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400" },
  moderate: { label: "Moderate Severity", color: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400" },
  high: { label: "High Severity", color: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400" },
  critical: { label: "Critical Severity", color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" },
};

export const AdviceCard: React.FC<AdviceCardProps> = ({ advice, isHealthy }) => {
  const { t } = useTranslation();

  if (!advice) return null;

  const badge = severityBadgeMap[advice.severity] || severityBadgeMap.moderate;

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 shadow-sm space-y-4">
      {/* Header with Severity Badge */}
      <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
        <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center space-x-2">
          <span>🩺</span>
          <span>{t("advice.title")}</span>
        </h3>
        <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${badge.color}`}>
          {badge.label}
        </span>
      </div>

      {/* Symptoms */}
      {advice.symptoms && (
        <div className="space-y-1">
          <h4 className="text-xs uppercase font-bold tracking-wider text-gray-400 dark:text-gray-500">
            {t("advice.symptoms")}
          </h4>
          <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
            {advice.symptoms}
          </p>
        </div>
      )}

      {/* Organic Treatment */}
      {advice.organic_treatment && advice.organic_treatment.length > 0 && (
        <div className="space-y-1">
          <h4 className="text-xs uppercase font-bold tracking-wider text-emerald-600 dark:text-emerald-400">
            🌱 {t("advice.organic")}
          </h4>
          <ul className="list-disc list-inside text-xs sm:text-sm text-gray-700 dark:text-gray-300 space-y-1">
            {advice.organic_treatment.map((item, idx) => (
              <li key={idx} className="leading-relaxed">
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Chemical Treatment */}
      {advice.chemical_treatment && advice.chemical_treatment.length > 0 && !isHealthy && (
        <div className="space-y-1">
          <h4 className="text-xs uppercase font-bold tracking-wider text-amber-600 dark:text-amber-400">
            🧪 {t("advice.chemical")}
          </h4>
          <ul className="list-disc list-inside text-xs sm:text-sm text-gray-700 dark:text-gray-300 space-y-1">
            {advice.chemical_treatment.map((item, idx) => (
              <li key={idx} className="leading-relaxed">
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Prevention */}
      {advice.prevention && advice.prevention.length > 0 && (
        <div className="space-y-1">
          <h4 className="text-xs uppercase font-bold tracking-wider text-blue-600 dark:text-blue-400">
            🛡️ {t("advice.prevention")}
          </h4>
          <ul className="list-disc list-inside text-xs sm:text-sm text-gray-700 dark:text-gray-300 space-y-1">
            {advice.prevention.map((item, idx) => (
              <li key={idx} className="leading-relaxed">
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Extension Disclaimer */}
      <div className="text-[11px] text-gray-400 dark:text-gray-500 border-t border-gray-100 dark:border-gray-800 pt-2 italic">
        {t("advice.disclaimer")}
      </div>
    </div>
  );
};

