import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Copy, Check, Share2, Printer, Shield, Sprout, FlaskConical, Stethoscope } from "lucide-react";
import { AdviceEntry } from "@/api/types";

interface AdvicePanelProps {
  advice?: AdviceEntry | null;
  cropDisplayName: string;
  isHealthy: boolean;
  farmersAdvice?: string;
}

type TabType = "symptoms" | "organic" | "chemical" | "prevention";

export const AdvicePanel: React.FC<AdvicePanelProps> = ({
  advice,
  cropDisplayName,
  isHealthy,
  farmersAdvice,
}) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<TabType>(isHealthy ? "prevention" : "symptoms");
  const [copied, setCopied] = useState(false);

  if (!advice) return null;

  const handleCopy = async () => {
    const textToCopy = `
CropAI Treatment Report: ${cropDisplayName}
Severity: ${advice.severity}

Symptoms:
${advice.symptoms}

Organic Treatment:
${advice.organic_treatment.join("\n")}

Chemical Treatment:
${advice.chemical_treatment.join("\n")}

Prevention:
${advice.prevention.join("\n")}

Farmer's Note:
${farmersAdvice || ""}
`.trim();

    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard write failed
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `CropAI Report: ${cropDisplayName}`,
          text: `Diagnosis and agronomic treatment plan for ${cropDisplayName}. Symptoms: ${advice.symptoms.slice(0, 100)}...`,
          url: window.location.href,
        });
      } catch {
        // User cancelled share
      }
    } else {
      handleCopy();
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="bg-white dark:bg-[#0c2417] border border-gray-200 dark:border-[#1b4d32] rounded-3xl p-6 shadow-xl space-y-5 print:shadow-none print:border-none">
      {/* Header & Quick Action Buttons */}
      <div className="flex items-center justify-between flex-wrap gap-3 border-b border-gray-100 dark:border-gray-800 pb-4">
        <div>
          <h3 className="text-base font-extrabold text-gray-900 dark:text-white flex items-center space-x-2">
            <span>📋</span>
            <span>{t("advice.title")}</span>
          </h3>
          <p className="text-[11px] text-gray-500 dark:text-emerald-300/70">
            {cropDisplayName} &bull; Agronomic Management Protocol
          </p>
        </div>

        {/* Action bar: Copy, Share, Print/PDF */}
        <div className="flex items-center space-x-1.5 print:hidden">
          <button
            type="button"
            onClick={handleCopy}
            className="p-2 rounded-xl text-xs font-semibold bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 flex items-center space-x-1 transition min-h-[36px]"
            title={t("result.copyAdvice")}
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{copied ? t("result.copied") : t("result.copyAdvice")}</span>
          </button>

          <button
            type="button"
            onClick={handleShare}
            className="p-2 rounded-xl text-xs font-semibold bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 flex items-center space-x-1 transition min-h-[36px]"
            title={t("result.share")}
          >
            <Share2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t("result.share")}</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="p-2 rounded-xl text-xs font-semibold bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 flex items-center space-x-1 transition min-h-[36px]"
            title={t("result.downloadReport")}
          >
            <Printer className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t("result.downloadReport")}</span>
          </button>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex items-center space-x-1 overflow-x-auto pb-1 scrollbar-none print:hidden">
        <button
          type="button"
          onClick={() => setActiveTab("symptoms")}
          className={`py-2 px-3.5 rounded-xl text-xs font-bold whitespace-nowrap flex items-center space-x-1.5 transition min-h-[38px] ${
            activeTab === "symptoms"
              ? "bg-[#16a34a] text-white shadow-sm"
              : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200"
          }`}
        >
          <Stethoscope className="w-3.5 h-3.5" />
          <span>{t("advice.symptoms")}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("organic")}
          className={`py-2 px-3.5 rounded-xl text-xs font-bold whitespace-nowrap flex items-center space-x-1.5 transition min-h-[38px] ${
            activeTab === "organic"
              ? "bg-[#16a34a] text-white shadow-sm"
              : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200"
          }`}
        >
          <Sprout className="w-3.5 h-3.5" />
          <span>{t("advice.organic")}</span>
        </button>

        {!isHealthy && (
          <button
            type="button"
            onClick={() => setActiveTab("chemical")}
            className={`py-2 px-3.5 rounded-xl text-xs font-bold whitespace-nowrap flex items-center space-x-1.5 transition min-h-[38px] ${
              activeTab === "chemical"
                ? "bg-[#16a34a] text-white shadow-sm"
                : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200"
            }`}
          >
            <FlaskConical className="w-3.5 h-3.5" />
            <span>{t("advice.chemical")}</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => setActiveTab("prevention")}
          className={`py-2 px-3.5 rounded-xl text-xs font-bold whitespace-nowrap flex items-center space-x-1.5 transition min-h-[38px] ${
            activeTab === "prevention"
              ? "bg-[#16a34a] text-white shadow-sm"
              : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200"
          }`}
        >
          <Shield className="w-3.5 h-3.5" />
          <span>{t("advice.prevention")}</span>
        </button>
      </div>

      {/* Tab Panels */}
      <div className="space-y-4 pt-1">
        {/* Symptoms */}
        {(activeTab === "symptoms" || typeof window !== "undefined") && (
          <div className={activeTab === "symptoms" ? "block space-y-2" : "hidden print:block space-y-2"}>
            <div className="flex items-center space-x-1.5 text-xs font-black uppercase tracking-wider text-[#059669]">
              <Stethoscope className="w-4 h-4" />
              <span>{t("advice.symptoms")}</span>
            </div>
            <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 leading-relaxed bg-gray-50 dark:bg-gray-900/40 p-4 rounded-2xl border border-gray-100 dark:border-gray-800">
              {advice.symptoms}
            </p>
          </div>
        )}

        {/* Organic */}
        {(activeTab === "organic" || typeof window !== "undefined") && (
          <div className={activeTab === "organic" ? "block space-y-2" : "hidden print:block space-y-2"}>
            <div className="flex items-center space-x-1.5 text-xs font-black uppercase tracking-wider text-[#059669]">
              <Sprout className="w-4 h-4" />
              <span>{t("advice.organic")}</span>
            </div>
            <ul className="space-y-2 bg-emerald-50/60 dark:bg-emerald-950/20 p-4 rounded-2xl border border-emerald-100 dark:border-emerald-900/50">
              {advice.organic_treatment && advice.organic_treatment.length > 0 ? (
                advice.organic_treatment.map((item, idx) => (
                  <li key={idx} className="flex items-start space-x-2 text-xs sm:text-sm text-gray-800 dark:text-gray-200 leading-relaxed">
                    <span className="text-[#16a34a] font-bold text-sm leading-none mt-0.5">•</span>
                    <span>{item}</span>
                  </li>
                ))
              ) : (
                <li className="text-xs text-gray-600 dark:text-gray-400">
                  No curative organic sprays needed for this condition.
                </li>
              )}
            </ul>
          </div>
        )}

        {/* Chemical */}
        {!isHealthy && (activeTab === "chemical" || typeof window !== "undefined") && (
          <div className={activeTab === "chemical" ? "block space-y-2" : "hidden print:block space-y-2"}>
            <div className="flex items-center space-x-1.5 text-xs font-black uppercase tracking-wider text-amber-600 dark:text-amber-400">
              <FlaskConical className="w-4 h-4" />
              <span>{t("advice.chemical")}</span>
            </div>
            <ul className="space-y-2 bg-amber-50/60 dark:bg-amber-950/20 p-4 rounded-2xl border border-amber-100 dark:border-amber-900/50">
              {advice.chemical_treatment && advice.chemical_treatment.length > 0 ? (
                advice.chemical_treatment.map((item, idx) => (
                  <li key={idx} className="flex items-start space-x-2 text-xs sm:text-sm text-gray-800 dark:text-gray-200 leading-relaxed">
                    <span className="text-amber-600 font-bold text-sm leading-none mt-0.5">•</span>
                    <span>{item}</span>
                  </li>
                ))
              ) : (
                <li className="text-xs text-gray-600 dark:text-gray-400">
                  Consult regional extension officer for local label approvals.
                </li>
              )}
            </ul>
          </div>
        )}

        {/* Prevention */}
        {(activeTab === "prevention" || typeof window !== "undefined") && (
          <div className={activeTab === "prevention" ? "block space-y-2" : "hidden print:block space-y-2"}>
            <div className="flex items-center space-x-1.5 text-xs font-black uppercase tracking-wider text-blue-600 dark:text-blue-400">
              <Shield className="w-4 h-4" />
              <span>{t("advice.prevention")}</span>
            </div>
            <ul className="space-y-2 bg-blue-50/60 dark:bg-blue-950/20 p-4 rounded-2xl border border-blue-100 dark:border-blue-900/50">
              {advice.prevention && advice.prevention.length > 0 ? (
                advice.prevention.map((item, idx) => (
                  <li key={idx} className="flex items-start space-x-2 text-xs sm:text-sm text-gray-800 dark:text-gray-200 leading-relaxed">
                    <span className="text-blue-500 font-bold text-sm leading-none mt-0.5">✅</span>
                    <span>{item}</span>
                  </li>
                ))
              ) : (
                <li className="text-xs text-gray-600 dark:text-gray-400">
                  Maintain standard sanitation and crop rotation.
                </li>
              )}
            </ul>
          </div>
        )}

        {/* Farmer's Advice highlight card */}
        {farmersAdvice && (
          <div className="p-4 rounded-2xl bg-[#fffbeb] dark:bg-amber-950/30 border border-[#fef3c7] dark:border-amber-900/60 space-y-1.5">
            <div className="flex items-center space-x-2 text-xs font-black uppercase tracking-wider text-[#b45309] dark:text-amber-400">
              <span>🧑‍🌾</span>
              <span>{t("advice.farmersAdvice")}</span>
            </div>
            <p className="text-xs sm:text-sm text-[#92400e] dark:text-amber-200 leading-relaxed font-medium">
              {farmersAdvice}
            </p>
          </div>
        )}
      </div>

      {/* Extension Disclaimer */}
      <p className="text-[11px] text-gray-400 dark:text-gray-500 italic pt-2 border-t border-gray-100 dark:border-gray-800">
        ⚠️ {t("advice.disclaimer")}
      </p>
    </div>
  );
};
