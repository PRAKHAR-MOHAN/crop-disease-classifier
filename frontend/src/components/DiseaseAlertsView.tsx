import React, { useState } from "react";
import {
  ShieldAlert,
  Filter,
  Search,
  Sprout,
  Clock,
  MapPin,
} from "lucide-react";
import { RECENT_ALERTS } from "../data/stationData";

interface DiseaseAlertsViewProps {
  onDiagnoseClass?: (className: string) => void;
}

export const DiseaseAlertsView: React.FC<DiseaseAlertsViewProps> = () => {
  const [filterSeverity, setFilterSeverity] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = RECENT_ALERTS.filter((alt) => {
    const matchesSev = filterSeverity === "all" || alt.severity === filterSeverity;
    const matchesSearch =
      alt.disease.toLowerCase().includes(searchQuery.toLowerCase()) ||
      alt.crop.toLowerCase().includes(searchQuery.toLowerCase()) ||
      alt.stationName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSev && matchesSearch;
  });

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Header Overview Banner */}
      <div className="p-5 rounded-2xl border border-[#173050] bg-gradient-to-r from-[#0c1a2e] to-[#091728] shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-2 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-400">
              <ShieldAlert className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white">
                Foliar Disease Anomaly Feed
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Active alerts flagged by station computer vision & microclimate spore models.
              </p>
            </div>
          </div>
        </div>

        {/* Severity Count Pills */}
        <div className="flex items-center space-x-2 text-xs">
          <span className="px-3 py-1 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-300 font-bold">
            1 Critical
          </span>
          <span className="px-3 py-1 rounded-xl bg-amber-950/80 border border-amber-800 text-amber-300 font-bold">
            2 Warnings
          </span>
          <span className="px-3 py-1 rounded-xl bg-emerald-950/80 border border-emerald-800 text-emerald-300 font-bold">
            1 Monitored
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl border border-[#142640] bg-[#0c182a] flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by crop, disease, or station..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-[#1c3656] bg-[#081220] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-bold text-slate-400">Severity:</span>
          {(["all", "critical", "warning", "monitored"] as const).map((sev) => (
            <button
              key={sev}
              onClick={() => setFilterSeverity(sev)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition ${
                filterSeverity === sev
                  ? "bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20"
                  : "bg-[#081220] text-slate-400 hover:text-white border border-[#142640]"
              }`}
            >
              {sev}
            </button>
          ))}
        </div>
      </div>

      {/* Alerts Incident Cards */}
      <div className="space-y-3">
        {filtered.map((alt) => {
          const isCrit = alt.severity === "critical";
          const isWarn = alt.severity === "warning";

          return (
            <div
              key={alt.id}
              className={`p-5 rounded-2xl border transition-all ${
                isCrit
                  ? "border-rose-900/60 bg-gradient-to-r from-rose-950/20 to-[#0c182a]"
                  : isWarn
                  ? "border-amber-900/60 bg-gradient-to-r from-amber-950/15 to-[#0c182a]"
                  : "border-[#142640] bg-[#0c182a]"
              }`}
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        isCrit
                          ? "bg-rose-500/20 text-rose-400 border border-rose-500/40"
                          : isWarn
                          ? "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                          : "bg-cyan-500/20 text-cyan-400 border border-cyan-500/40"
                      }`}
                    >
                      {alt.severity}
                    </span>

                    <span className="text-xs font-bold text-white flex items-center space-x-1">
                      <Sprout className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{alt.crop}</span>
                    </span>

                    <span className="text-slate-400 text-xs">·</span>

                    <span className="text-xs text-slate-300 font-semibold flex items-center space-x-1">
                      <MapPin className="w-3 h-3 text-cyan-400" />
                      <span>{alt.stationName} ({alt.location})</span>
                    </span>

                    <span className="text-slate-400 text-xs">·</span>

                    <span className="text-[11px] text-slate-400 flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>{alt.timestamp}</span>
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white tracking-tight flex items-center space-x-2">
                    <span>{alt.disease}</span>
                    <span className="text-xs px-2 py-0.5 rounded-md bg-[#132640] text-cyan-300 font-mono">
                      {(alt.confidence * 100).toFixed(0)}% AI Calibrated Confidence
                    </span>
                  </h3>

                  <p className="text-xs text-slate-300 pt-1 leading-relaxed bg-[#07111e]/60 p-2.5 rounded-xl border border-[#12243d]">
                    <strong className="text-cyan-400">Action Plan: </strong>
                    {alt.recommendedAction}
                  </p>
                </div>
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="p-8 text-center rounded-2xl border border-[#142640] bg-[#0c182a] text-slate-400">
            No disease anomalies matching your current filters.
          </div>
        )}
      </div>
    </div>
  );
};
