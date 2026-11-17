import React from "react";
import {
  LayoutDashboard,
  Sprout,
  Radio,
  AlertCircle,
  BarChart3,
  BookOpen,
  History,
  Settings,
  ShieldCheck,
  User,
  LogOut,
  Activity,
} from "lucide-react";
import { UserSession } from "./AuthModal";

export type NavTab =
  | "overview"
  | "diagnostic"
  | "stations"
  | "alerts"
  | "analytics"
  | "library"
  | "history"
  | "settings";

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  alertCount: number;
  userSession: UserSession | null;
  onOpenAuth: () => void;
  onLogout: () => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  alertCount,
  userSession,
  onOpenAuth,
  onLogout,
  isOpenMobile,
  onCloseMobile,
}) => {
  const navItems: { id: NavTab; label: string; icon: React.ReactNode; badge?: number }[] = [
    {
      id: "overview",
      label: "Overview",
      icon: <LayoutDashboard className="w-4 h-4" />,
    },
    {
      id: "diagnostic",
      label: "Leaf Diagnostic",
      icon: <Sprout className="w-4 h-4 text-emerald-400" />,
    },
    {
      id: "stations",
      label: "Field Stations",
      icon: <Radio className="w-4 h-4" />,
    },
    {
      id: "alerts",
      label: "Outbreak Alerts",
      icon: <AlertCircle className="w-4 h-4" />,
      badge: alertCount,
    },
    {
      id: "analytics",
      label: "Agro Analytics",
      icon: <BarChart3 className="w-4 h-4" />,
    },
    {
      id: "library",
      label: "Pathogen Library",
      icon: <BookOpen className="w-4 h-4" />,
    },
    {
      id: "history",
      label: "Scan History",
      icon: <History className="w-4 h-4" />,
    },
    {
      id: "settings",
      label: "Station Config",
      icon: <Settings className="w-4 h-4" />,
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-30 lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-[#070e19] border-r border-[#132238] flex flex-col justify-between transition-transform duration-300 ease-in-out ${
          isOpenMobile ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Top Header & Logo */}
        <div>
          <div className="p-5 border-b border-[#132238] flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-emerald-400 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                <Activity className="w-5 h-5 text-gray-950 stroke-[2.5]" />
              </div>
              <div>
                <h1 className="text-base font-black tracking-tight text-white flex items-center">
                  Crop<span className="text-cyan-400">Guard</span>
                </h1>
                <p className="text-[10px] text-slate-400 font-medium tracking-wide">
                  Agro Station Intelligence
                </p>
              </div>
            </div>

            {/* Mobile Close Button */}
            <button
              onClick={onCloseMobile}
              className="lg:hidden text-slate-400 hover:text-white p-1"
            >
              ✕
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1">
            {navItems.map((item) => {
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onSelectTab(item.id);
                    onCloseMobile();
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition group ${
                    isActive
                      ? "bg-blue-600/20 text-cyan-400 border border-blue-500/30 shadow-sm shadow-blue-500/10"
                      : "text-slate-400 hover:text-slate-200 hover:bg-[#0c182a]"
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <span className={isActive ? "text-cyan-400" : "text-slate-400 group-hover:text-slate-200"}>
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </div>

                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 border border-amber-500/40 text-amber-400">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* User Account / Profile Card at bottom */}
        <div className="p-3 border-t border-[#132238] bg-[#060c16]">
          {userSession ? (
            <div className="p-2.5 rounded-xl bg-[#0b1728] border border-[#172e4c] flex items-center justify-between">
              <div className="flex items-center space-x-2.5 overflow-hidden">
                <div className="w-8 h-8 rounded-lg bg-cyan-950 border border-cyan-800 flex items-center justify-center text-cyan-400 flex-shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div className="overflow-hidden">
                  <div className="text-xs font-bold text-white truncate">
                    {userSession.displayName}
                  </div>
                  <div className="text-[10px] text-cyan-400 uppercase font-bold tracking-wider">
                    {userSession.role === "admin" ? "Lead Agronomist" : "Field Scout"}
                  </div>
                </div>
              </div>
              <button
                onClick={onLogout}
                title="Sign out"
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 transition"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-blue-600/30 to-cyan-600/30 border border-cyan-500/40 text-cyan-300 hover:brightness-125 text-xs font-bold flex items-center justify-center space-x-2 transition"
            >
              <User className="w-3.5 h-3.5" />
              <span>Operator Sign In</span>
            </button>
          )}
        </div>
      </aside>
    </>
  );
};
