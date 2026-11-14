import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Sun, Focus, ZoomIn, ShieldAlert, ChevronDown } from "lucide-react";

export const PhotoTips: React.FC = () => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const tips = [
    {
      icon: <Sun className="w-4 h-4 text-amber-500" />,
      title: t("tips.tip1Title"),
      desc: t("tips.tip1Desc"),
    },
    {
      icon: <Focus className="w-4 h-4 text-emerald-500" />,
      title: t("tips.tip2Title"),
      desc: t("tips.tip2Desc"),
    },
    {
      icon: <ZoomIn className="w-4 h-4 text-blue-500" />,
      title: t("tips.tip3Title"),
      desc: t("tips.tip3Desc"),
    },
    {
      icon: <ShieldAlert className="w-4 h-4 text-rose-500" />,
      title: t("tips.tip4Title"),
      desc: t("tips.tip4Desc"),
    },
  ];

  return (
    <div className="w-full max-w-xl mx-auto rounded-2xl bg-white/60 dark:bg-[#0c2417]/60 border border-gray-200 dark:border-[#1b4d32] overflow-hidden transition shadow-sm">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full p-3.5 flex items-center justify-between text-left text-xs font-bold text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-[#143d26] transition min-h-[44px]"
      >
        <span className="flex items-center space-x-2">
          <span>💡</span>
          <span>{t("tips.title")}</span>
        </span>
        <ChevronDown
          className={`w-4 h-4 text-gray-400 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="p-4 border-t border-gray-100 dark:border-gray-800 grid grid-cols-1 sm:grid-cols-2 gap-3 animate-in fade-in duration-200">
          {tips.map((tip, idx) => (
            <div
              key={idx}
              className="p-3 rounded-xl bg-gray-50 dark:bg-gray-900/40 border border-gray-100 dark:border-gray-800/80 space-y-1"
            >
              <div className="flex items-center space-x-1.5 font-bold text-xs text-gray-900 dark:text-white">
                {tip.icon}
                <span>{tip.title}</span>
              </div>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed">
                {tip.desc}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

