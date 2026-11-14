import React from "react";
import { useTranslation } from "react-i18next";
import { History, Moon, Sun, Sparkles } from "lucide-react";
import { useHealthQuery } from "@/api/hooks";

interface HeaderProps {
  isDark: boolean;
  onToggleTheme: () => void;
  onOpenHistory: () => void;
  historyCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  isDark,
  onToggleTheme,
  onOpenHistory,
  historyCount,
}) => {
  const { t, i18n } = useTranslation();
  const { data: health, isError } = useHealthQuery();

  const handleLangChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    i18n.changeLanguage(e.target.value);
  };

  const isOnline = !isError && health?.status === "healthy";

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-white/80 dark:bg-[#06150c]/85 border-b border-gray-200/80 dark:border-[#164429]/80 transition-colors">
      <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
        {/* Brand Logo & Status */}
        <div className="flex items-center space-x-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-green-400 flex items-center justify-center text-lg shadow-md shadow-emerald-500/20 text-white font-bold select-none">
            🌱
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-lg font-black tracking-tight text-gray-900 dark:text-white">
                Crop<span className="text-[#22c55e]">AI</span>
              </span>
              {/* Subtle backend health dot */}
              <span
                className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold border transition-colors ${
                  isOnline
                    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                    : "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800"
                }`}
                title={isOnline ? t("app.statusOnline") : t("app.statusDegraded")}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isOnline ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
                  }`}
                />
                <span className="hidden sm:inline">
                  {isOnline ? "Online" : "Degraded"}
                </span>
              </span>
            </div>
            <p className="text-[10px] text-gray-500 dark:text-gray-400 hidden md:block">
              {t("app.subtitle")}
            </p>
          </div>
        </div>

        {/* Right Action Bar */}
        <div className="flex items-center space-x-2">
          {/* AI-Powered Pill */}
          <div className="hidden sm:inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#0c2417] text-[#4ade80] border border-[#1b4d32] shadow-sm select-none">
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span>{t("nav.aiPowered")}</span>
          </div>

          {/* History Drawer Trigger */}
          <button
            type="button"
            onClick={onOpenHistory}
            className="relative p-2 rounded-xl border border-gray-200 dark:border-[#1b4d32] text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#0c2417] transition active:scale-95 min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label={t("nav.history")}
            title={t("nav.history")}
          >
            <History className="w-4 h-4" />
            {historyCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#22c55e] text-white text-[10px] font-black flex items-center justify-center shadow">
                {historyCount > 9 ? "9+" : historyCount}
              </span>
            )}
          </button>

          {/* Language Switcher */}
          <div className="relative">
            <select
              value={i18n.resolvedLanguage || "en"}
              onChange={handleLangChange}
              className="py-2 px-2.5 rounded-xl border border-gray-200 dark:border-[#1b4d32] bg-gray-50 dark:bg-[#0c2417] text-gray-800 dark:text-gray-100 text-xs font-bold cursor-pointer shadow-sm focus:ring-2 focus:ring-[#22c55e] min-h-[44px]"
              aria-label={t("nav.language")}
            >
              <option value="en">🇺🇸 EN</option>
              <option value="hi">🇮🇳 हिन्दी</option>
              <option value="es">🇪🇸 ES</option>
            </select>
          </div>

          {/* Theme Toggle */}
          <button
            type="button"
            onClick={onToggleTheme}
            className="p-2 rounded-xl border border-gray-200 dark:border-[#1b4d32] text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#0c2417] transition active:scale-95 min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label={isDark ? t("nav.lightMode") : t("nav.darkMode")}
            title={isDark ? t("nav.lightMode") : t("nav.darkMode")}
          >
            {isDark ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-gray-600" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
