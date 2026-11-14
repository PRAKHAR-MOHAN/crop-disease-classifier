import React from "react";
import { useTranslation } from "react-i18next";
import { CheckCircle2, AlertTriangle, AlertCircle, RefreshCw, Sparkles } from "lucide-react";
import { PredictionResponse } from "@/api/types";
import { parseClassName } from "@/lib/parseClassName";
import { ConfidenceBar } from "./ConfidenceBar";

interface ResultCardProps {
  prediction: PredictionResponse;
  onReset: () => void;
}

export const ResultCard: React.FC<ResultCardProps> = ({
  prediction,
  onReset,
}) => {
  const { t } = useTranslation();
  const { label, confidence, top3, is_uncertain, is_ood, latency_ms } = prediction;

  const parsed = parseClassName(label);

  // Status Badge Configuration
  const getStatusBadge = () => {
    if (parsed.isHealthy) {
      return {
        icon: <CheckCircle2 className="w-3.5 h-3.5" />,
        text: t("result.statusHealthy"),
        className: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800",
      };
    }
    if (parsed.category === "pest") {
      return {
        icon: <AlertCircle className="w-3.5 h-3.5" />,
        text: t("result.statusPest"),
        className: "bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border-purple-300 dark:border-purple-800",
      };
    }
    return {
      icon: <AlertTriangle className="w-3.5 h-3.5" />,
      text: t("result.statusDiseased"),
      className: "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300 dark:border-amber-800",
    };
  };

  const statusBadge = getStatusBadge();

  // Edge state: OOD Rejection Card
  if (is_ood || label === "Unknown") {
    return (
      <div className="w-full max-w-xl mx-auto rounded-3xl overflow-hidden border border-rose-800 bg-[#0c2417] shadow-xl p-6 space-y-4 animate-in fade-in">
        <div className="flex items-start space-x-3 text-rose-400">
          <div className="p-3 rounded-2xl bg-rose-950/80 border border-rose-800">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base sm:text-lg font-black text-white">
              {t("edge.oodTitle")}
            </h3>
            <p className="text-xs text-rose-200 leading-relaxed">
              {t("edge.oodDescription")}
            </p>
          </div>
        </div>

        {/* Tips list */}
        <div className="p-4 rounded-2xl bg-[#081e13] border border-[#1b4d32] text-xs space-y-1.5 text-gray-200">
          <p className="font-bold uppercase tracking-wider text-[10px] text-emerald-400">
            Recommended Action:
          </p>
          <p>• {t("edge.oodTip1")}</p>
          <p>• {t("edge.oodTip2")}</p>
          <p>• {t("edge.oodTip3")}</p>
        </div>

        <button
          type="button"
          onClick={onReset}
          className="w-full py-3 px-4 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 transition active:scale-95 flex items-center justify-center space-x-2 min-h-[44px]"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>{t("upload.retakeBtn")}</span>
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-xl mx-auto rounded-3xl overflow-hidden border border-[#1b4d32] bg-[#0c2417] shadow-2xl transition-all space-y-0">
      {/* Edge State: Low Confidence Warning Banner */}
      {is_uncertain && (
        <div className="p-3 bg-amber-950/70 border-b border-amber-800/80 text-amber-200 text-xs flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 text-amber-400" />
          <span className="font-medium">{t("edge.uncertainDescription")}</span>
        </div>
      )}

      {/* Edge State: Celebratory Healthy Banner */}
      {parsed.isHealthy && (
        <div className="p-3 bg-emerald-950/70 border-b border-emerald-800/80 text-emerald-200 text-xs flex items-center space-x-2">
          <Sparkles className="w-4 h-4 text-[#22c55e] flex-shrink-0" />
          <span className="font-semibold">{t("edge.healthyDescription")}</span>
        </div>
      )}

      {/* Header Container (Matches Image 2 Style) */}
      <div className="bg-gradient-to-r from-[#092215] to-[#0e301e] border-b border-[#1b4d32] p-5 sm:p-6 flex items-start justify-between gap-3">
        <div className="flex items-center space-x-3.5">
          <div className="w-14 h-14 rounded-2xl bg-[#143d26] border border-[#235f3d] flex items-center justify-center text-3xl shadow-sm flex-shrink-0 select-none">
            {parsed.cropEmoji}
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-snug">
              {parsed.displayName}
            </h2>
            {parsed.scientificName && (
              <p className="text-xs sm:text-sm font-semibold text-emerald-300 italic">
                ({parsed.scientificName})
              </p>
            )}

            {/* Status & Latency Badges */}
            <div className="flex items-center space-x-2 pt-2">
              <span
                className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold border shadow-xs ${statusBadge.className}`}
              >
                {statusBadge.icon}
                <span>{statusBadge.text}</span>
              </span>
              <span className="text-[10px] font-mono text-emerald-400/80">
                ⚡ {latency_ms} ms
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Body Content */}
      <div className="p-5 sm:p-7 space-y-5 bg-[#081e13]">
        {/* Calibrated Confidence Bar */}
        <ConfidenceBar confidence={confidence} />

        {/* Top-3 Alternatives List */}
        {top3 && top3.length > 0 && (
          <div className="pt-2 border-t border-[#1b4d32] space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400">
              {t("result.top3Title")}
            </h4>
            <div className="space-y-2">
              {top3.map((entry) => {
                const itemParsed = parseClassName(entry.class_id);
                const percent = Math.round(entry.confidence * 100);

                return (
                  <div
                    key={entry.rank}
                    className="p-2.5 rounded-xl bg-[#0c2417] border border-[#1b4d32] flex items-center justify-between text-xs gap-3"
                  >
                    <div className="flex items-center space-x-2 truncate">
                      <span className="w-5 h-5 rounded-md bg-[#143d26] text-[10px] font-bold text-emerald-300 flex items-center justify-center flex-shrink-0">
                        #{entry.rank}
                      </span>
                      <span>{itemParsed.cropEmoji}</span>
                      <span className="font-semibold text-white truncate">
                        {itemParsed.displayName}
                      </span>
                    </div>

                    {/* Mini bar & percent */}
                    <div className="flex items-center space-x-2 flex-shrink-0">
                      <div className="w-16 bg-[#143d26] h-1.5 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#22c55e] rounded-full"
                          style={{ width: `${Math.max(percent, 4)}%` }}
                        />
                      </div>
                      <span className="font-mono font-bold text-xs text-emerald-200 min-w-[32px] text-right">
                        {percent}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
