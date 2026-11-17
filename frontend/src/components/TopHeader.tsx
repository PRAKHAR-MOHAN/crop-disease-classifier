import React from "react";
import { useTranslation } from "react-i18next";
import {
  Menu,
  Bell,
  ChevronDown,
  User,
} from "lucide-react";
import { STATIONS, StationInfo } from "../data/stationData";
import { UserSession } from "./AuthModal";

interface TopHeaderProps {
  currentTabName: string;
  currentSubtitle: string;
  selectedStation: StationInfo;
  onSelectStation: (st: StationInfo) => void;
  onOpenMobileMenu: () => void;
  alertCount: number;
  onOpenAlerts: () => void;
  userSession: UserSession | null;
  onOpenAuth: () => void;
  backendOnline: boolean;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  currentTabName,
  currentSubtitle,
  selectedStation,
  onSelectStation,
  onOpenMobileMenu,
  alertCount,
  onOpenAlerts,
  userSession,
  onOpenAuth,
  backendOnline,
}) => {
  const { i18n } = useTranslation();

  const handleLangChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    i18n.changeLanguage(e.target.value);
  };

  const formattedTime = new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  return (
    <header className="sticky top-0 z-30 w-full bg-[#070e19]/90 backdrop-blur-md border-b border-[#132238] px-4 sm:px-6 py-3.5 transition-colors">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Left Side: Mobile Menu Button + Title + Subtitle */}
        <div className="flex items-start space-x-3">
          <button
            onClick={onOpenMobileMenu}
            className="lg:hidden p-2 rounded-xl border border-[#1b3454] bg-[#0c1a2c] text-slate-300 hover:text-white"
            aria-label="Open Navigation"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
              <span>Station Operations</span>
              <span>/</span>
              <span className="text-cyan-400">{currentTabName}</span>
            </div>
            <h2 className="text-lg sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <span>{currentTabName}</span>
              {backendOnline && (
                <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950/70 text-emerald-400 border border-emerald-800/50">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>AI Engine Online</span>
                </span>
              )}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5 max-w-lg hidden sm:block">
              {currentSubtitle}
            </p>
          </div>
        </div>

        {/* Right Side: Station Selector, Telemetry Tags, Alerts, User */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 self-end lg:self-auto">
          {/* Station Selector Dropdown */}
          <div className="relative">
            <select
              value={selectedStation.id}
              onChange={(e) => {
                const found = STATIONS.find((s) => s.id === e.target.value);
                if (found) onSelectStation(found);
              }}
              className="py-1.5 px-3 rounded-xl border border-[#1a3352] bg-[#0c1a2c] text-white text-xs font-semibold cursor-pointer shadow-sm hover:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 pr-8 appearance-none"
              aria-label="Select Field Station"
            >
              {STATIONS.map((st) => (
                <option key={st.id} value={st.id} className="bg-[#070e19]">
                  📡 {st.name} ({st.crop.split("&")[0]})
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
          </div>

          {/* Telemetry Status Pill */}
          <div className="hidden md:flex items-center space-x-2 text-xs text-slate-400 px-2.5 py-1 rounded-xl bg-[#0a1524] border border-[#142840]">
            <span className="text-[11px] text-slate-400">Sensor Pod: Open-Agro</span>
            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>Current</span>
            </span>
            <span className="text-[10px] text-slate-400 hidden xl:inline">
              Updated {formattedTime}
            </span>
          </div>

          {/* Language Switcher */}
          <div className="relative">
            <select
              value={i18n.resolvedLanguage || "en"}
              onChange={handleLangChange}
              className="py-1.5 px-2.5 rounded-xl border border-[#1a3352] bg-[#0c1a2c] text-white text-xs font-semibold cursor-pointer shadow-sm hover:border-cyan-500 focus:outline-none"
              aria-label="Language"
            >
              <option value="en">🇺🇸 EN</option>
              <option value="hi">🇮🇳 हिन्दी</option>
              <option value="es">🇪🇸 ES</option>
            </select>
          </div>

          {/* Outbreak Alert Bell */}
          <button
            onClick={onOpenAlerts}
            title={`${alertCount} Outbreak Alerts`}
            className="relative p-2 rounded-xl border border-[#1a3352] bg-[#0c1a2c] text-slate-300 hover:text-white hover:border-cyan-500 transition"
          >
            <Bell className="w-4 h-4" />
            {alertCount > 0 && (
              <span className="absolute -top-1 -right-1 px-1.5 py-0.2 rounded-full text-[9px] font-black bg-rose-500 text-white shadow-md shadow-rose-500/50">
                {alertCount}
              </span>
            )}
          </button>

          {/* User Profile Avatar / Sign In */}
          <button
            onClick={onOpenAuth}
            className="flex items-center space-x-2 p-1.5 pr-2.5 rounded-xl border border-[#1a3352] bg-[#0c1a2c] hover:border-cyan-500 text-white transition"
          >
            <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white text-xs font-black shadow-inner">
              {userSession ? userSession.username[0].toUpperCase() : <User className="w-3.5 h-3.5" />}
            </div>
            <span className="text-xs font-bold hidden sm:inline">
              {userSession ? userSession.username : "Login"}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};
