import React from "react";
import { useTranslation } from "react-i18next";

interface HeaderProps {
  isDark: boolean;
  onToggleDark: () => void;
  onOpenHistory: () => void;
  historyCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  isDark,
  onToggleDark,
  onOpenHistory,
  historyCount,
}) => {
  const { t, i18n } = useTranslation();

  const handleLangChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    i18n.changeLanguage(e.target.value);
  };

  return (
    <header className="border-b border-gray-200/80 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md sticky top-0 z-30 transition-colors">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-600 to-emerald-400 flex items-center justify-center text-xl shadow-md shadow-brand-500/20">
            🌱
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-base sm:text-lg font-black text-gray-900 dark:text-white tracking-tight">
                Crop<span className="text-brand-600 dark:text-brand-400">Scan</span> AI
              </h1>
              <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                v1.0 • 99.8% Acc
              </span>
            </div>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 hidden sm:block">
              Calibrated ONNX Diagnostics & Grad-CAM Explainability
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-2">
          {/* History Button */}
          <button
            onClick={onOpenHistory}
            className="relative px-3 py-1.5 text-xs font-semibold rounded-xl border border-gray-200 dark:border-gray-700/80 hover:bg-gray-100 dark:hover:bg-gray-800 transition shadow-sm active:scale-95"
            aria-label={t("nav.history")}
          >
            📋 <span className="hidden sm:inline">{t("nav.history")}</span>
            {historyCount > 0 && (
              <span className="ml-1.5 inline-flex items-center px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-brand-500 text-white">
                {historyCount}
              </span>
            )}
          </button>

          {/* Language Switcher */}
          <div className="relative">
            <select
              value={i18n.resolvedLanguage || "en"}
              onChange={handleLangChange}
              className="text-xs py-1.5 px-2.5 rounded-xl border border-gray-200 dark:border-gray-700/80 bg-white dark:bg-gray-800 font-semibold cursor-pointer shadow-sm focus:ring-2 focus:ring-brand-500"
              aria-label={t("nav.language")}
            >
              <option value="en">🇺🇸 EN</option>
              <option value="hi">🇮🇳 हिंदी</option>
              <option value="es">🇪🇸 ES</option>
            </select>
          </div>

          {/* Dark Mode Toggle */}
          <button
            onClick={onToggleDark}
            className="p-2 rounded-xl border border-gray-200 dark:border-gray-700/80 hover:bg-gray-100 dark:hover:bg-gray-800 transition text-sm shadow-sm active:scale-95"
            aria-label={t("nav.darkMode")}
            title={t("nav.darkMode")}
          >
            {isDark ? "☀️" : "🌙"}
          </button>
        </div>
      </div>
    </header>
  );
};
