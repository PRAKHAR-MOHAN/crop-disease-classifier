import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Info } from "lucide-react";
import { getConfidenceTier } from "@/lib/confidenceColor";

interface ConfidenceBarProps {
  confidence: number;
}

export const ConfidenceBar: React.FC<ConfidenceBarProps> = ({ confidence }) => {
  const { t } = useTranslation();
  const [showTooltip, setShowTooltip] = useState(false);
  const tier = getConfidenceTier(confidence);

  return (
    <div className="space-y-2 bg-gray-50 dark:bg-gray-800/50 p-4 rounded-2xl border border-gray-200/70 dark:border-gray-700/60">
      {/* Top Labels */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-1.5 text-xs font-bold text-gray-700 dark:text-gray-300">
          <span>{t("result.confidenceTitle")}</span>

          {/* Tooltip trigger */}
          <div className="relative inline-block">
            <button
              type="button"
              onClick={() => setShowTooltip(!showTooltip)}
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-0.5 rounded-full"
              aria-label="Info about confidence"
            >
              <Info className="w-3.5 h-3.5" />
            </button>

            {showTooltip && (
              <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-64 p-2.5 rounded-xl bg-gray-900 text-white text-[11px] leading-relaxed shadow-xl border border-gray-700 z-30 pointer-events-none">
                {t("result.confidenceTooltip")}
                <div className="absolute left-1/2 -translate-x-1/2 top-full w-2 h-2 bg-gray-900 border-r border-b border-gray-700 rotate-45 -mt-1" />
              </div>
            )}
          </div>
        </div>

        {/* Tier badge & percent */}
        <div className="flex items-center space-x-2">
          <span
            className={`px-2 py-0.5 rounded-md text-[11px] font-bold border ${tier.badgeBg} ${tier.badgeText} ${tier.badgeBorder}`}
          >
            {t(tier.labelKey)}
          </span>
          <span className="text-sm font-black font-mono text-gray-900 dark:text-white">
            {tier.percent}%
          </span>
        </div>
      </div>

      {/* Progress Track */}
      <div
        className="w-full bg-gray-200 dark:bg-gray-700 h-2.5 rounded-full overflow-hidden p-0.5"
        role="progressbar"
        aria-valuenow={tier.percent}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={`h-full rounded-full bg-gradient-to-r ${tier.barGradient} transition-all duration-700 shadow-sm`}
          style={{ width: `${Math.max(tier.percent, 6)}%` }}
        />
      </div>

      <div className="flex justify-between text-[10px] text-gray-500 dark:text-gray-400 font-mono">
        <span>0% Ambiguous</span>
        <span>50% Threshold</span>
        <span>100% Deterministic</span>
      </div>
    </div>
  );
};
