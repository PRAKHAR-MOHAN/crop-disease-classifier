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
    <header className="border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur sticky top-0 z-20">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center space-x-2">
          <span className="text-2xl" role="img" aria-label="sprout">
            🌱
          </span>
          <div>
            <h1 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">
              {t("app.title")}
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">
              {t("app.subtitle")}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-2">
          {/* History Button */}
          <button
            onClick={onOpenHistory}
            className="relative px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
            aria-label={t("nav.history")}
          >
            📋 {t("nav.history")}
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
              className="text-xs py-1.5 px-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent dark:bg-gray-800 font-medium cursor-pointer"
              aria-label={t("nav.language")}
            >
              <option value="en">English</option>
              <option value="hi">हिंदी</option>
              <option value="es">Español</option>
            </select>
          </div>

          {/* Dark Mode Toggle */}
          <button
            onClick={onToggleDark}
            className="p-2 rounded-lg border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition text-sm"
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

