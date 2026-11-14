import React from "react";
import { useTranslation } from "react-i18next";
import { AdviceEntry } from "@/types/prediction";

interface AdviceCardProps {
  advice?: AdviceEntry | null;
  isHealthy?: boolean;
}

const severityBadgeMap: Record<string, { label: string; color: string; border: string }> = {
  healthy: {
    label: "Healthy Plant",
    color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300",
    border: "border-emerald-200 dark:border-emerald-800",
  },
  low: {
    label: "Low Severity",
    color: "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300",
    border: "border-blue-200 dark:border-blue-800",
  },
  moderate: {
    label: "Moderate Severity",
    color: "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300",
    border: "border-amber-200 dark:border-amber-800",
  },
  high: {
    label: "High Severity",
    color: "bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:text-orange-300",
    border: "border-orange-200 dark:border-orange-800",
  },
  critical: {
    label: "Critical Action Needed",
    color: "bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300",
    border: "border-red-200 dark:border-red-800",
  },
};

export const AdviceCard: React.FC<AdviceCardProps> = ({ advice, isHealthy }) => {
  const { t } = useTranslation();

  if (!advice) return null;

  const badge = severityBadgeMap[advice.severity] || severityBadgeMap.moderate;

  return (
    <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border border-gray-200/80 dark:border-gray-800 rounded-3xl p-6 shadow-xl space-y-5 transition-all">
      {/* Header with Severity Badge */}
      <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-4">
        <div className="flex items-center space-x-2.5">
          <div className="w-9 h-9 rounded-xl bg-brand-100 dark:bg-brand-900/40 flex items-center justify-center text-lg">
            🩺
          </div>
          <div>
            <h3 className="text-base font-extrabold text-gray-900 dark:text-white">
              {t("advice.title")}
            </h3>
            <p className="text-[11px] text-gray-500 dark:text-gray-400">
              Agronomic Action Plan & Extension Advice
            </p>
          </div>
        </div>
        <span
          className={`text-xs px-3 py-1 rounded-full font-bold border ${badge.color} ${badge.border}`}
        >
          {badge.label}
        </span>
      </div>

      {/* Symptoms Card */}
      {advice.symptoms && (
        <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 space-y-1.5">
          <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300">
            <span>🔍</span>
            <span>{t("advice.symptoms")}</span>
          </div>
          <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
            {advice.symptoms}
          </p>
        </div>
      )}

      {/* Organic Treatment Card */}
      {advice.organic_treatment && advice.organic_treatment.length > 0 && (
        <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/50 space-y-2">
          <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
            <span>🌱</span>
            <span>{t("advice.organic")}</span>
          </div>
          <ul className="space-y-1.5">
            {advice.organic_treatment.map((item, idx) => (
              <li
                key={idx}
                className="flex items-start space-x-2 text-xs sm:text-sm text-gray-800 dark:text-gray-200 leading-relaxed"
              >
                <span className="text-emerald-500 font-bold mt-0.5">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Chemical Treatment Card */}
      {advice.chemical_treatment && advice.chemical_treatment.length > 0 && !isHealthy && (
        <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/50 space-y-2">
          <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300">
            <span>🧪</span>
            <span>{t("advice.chemical")}</span>
          </div>
          <ul className="space-y-1.5">
            {advice.chemical_treatment.map((item, idx) => (
              <li
                key={idx}
                className="flex items-start space-x-2 text-xs sm:text-sm text-gray-800 dark:text-gray-200 leading-relaxed"
              >
                <span className="text-amber-500 font-bold mt-0.5">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Prevention & Cultural Practices */}
      {advice.prevention && advice.prevention.length > 0 && (
        <div className="p-4 rounded-2xl bg-blue-50/70 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/50 space-y-2">
          <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-blue-800 dark:text-blue-300">
            <span>🛡️</span>
            <span>{t("advice.prevention")}</span>
          </div>
          <ul className="space-y-1.5">
            {advice.prevention.map((item, idx) => (
              <li
                key={idx}
                className="flex items-start space-x-2 text-xs sm:text-sm text-gray-800 dark:text-gray-200 leading-relaxed"
              >
                <span className="text-blue-500 font-bold mt-0.5">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Extension Disclaimer */}
      <div className="p-3 rounded-xl bg-gray-50/60 dark:bg-gray-800/20 border border-gray-100 dark:border-gray-800 text-[11px] text-gray-500 dark:text-gray-400 italic leading-relaxed">
        ⚠️ {t("advice.disclaimer")}
      </div>
    </div>
  );
};
