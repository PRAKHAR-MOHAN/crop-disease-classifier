import React, { useState } from "react";
import {
  ShieldAlert,
  Filter,
  Search,
  Sprout,
  Clock,
  MapPin,
} from "lucide-react";
import { RECENT_DISEASE_INCIDENTS } from "../data/cropDiseaseData";

interface DiseaseAlertsViewProps {
  onDiagnoseClass?: (className: string) => void;
}

export const DiseaseAlertsView: React.FC<DiseaseAlertsViewProps> = () => {
  const [filterSeverity, setFilterSeverity] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = RECENT_DISEASE_INCIDENTS.filter((alt) => {
    const matchesSev = filterSeverity === "all" || alt.severity === filterSeverity;
    const matchesSearch =
      alt.pathogenName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      alt.cropName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      alt.zoneName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      alt.scientificName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSev && matchesSearch;
  });

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Header Overview Banner */}
      <div className="p-5 rounded-2xl border border-amber-900/40 bg-gradient-to-r from-[#17130a] via-[#1c1407] to-[#0c182a] shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <span className="p-2.5 rounded-xl bg-amber-950/80 border border-amber-700/60 text-amber-400 shadow-md">
              <ShieldAlert className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white">
                Foliar Disease & Pathogen Incident Feed
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Real-time active alerts flagged by leaf neural scanning and spore incubation models.
              </p>
            </div>
          </div>
        </div>

        {/* Severity Count Pills */}
        <div className="flex items-center space-x-2 text-xs">
          <span className="px-3 py-1 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-300 font-bold">
            2 Critical Outbreaks
          </span>
          <span className="px-3 py-1 rounded-xl bg-amber-950/80 border border-amber-800 text-amber-300 font-bold">
            3 Warnings Monitored
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
            placeholder="Search by crop, disease, or plot..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-[#1c3656] bg-[#081220] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-bold text-slate-400">Severity:</span>
          {(["all", "critical", "warning", "healthy"] as const).map((sev) => (
            <button
              key={sev}
              onClick={() => setFilterSeverity(sev)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition ${
                filterSeverity === sev
                  ? "bg-[#22c55e] text-slate-950 font-black shadow-md shadow-emerald-500/20"
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
                          : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                      }`}
                    >
                      {alt.severity}
                    </span>

                    <span className="text-xs font-bold text-white flex items-center space-x-1">
                      <Sprout className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{alt.cropName}</span>
                    </span>

                    <span className="text-slate-500 text-xs">·</span>

                    <span className="text-xs text-slate-300 font-semibold flex items-center space-x-1">
                      <MapPin className="w-3 h-3 text-cyan-400" />
                      <span>{alt.zoneName}</span>
                    </span>

                    <span className="text-slate-500 text-xs">·</span>

                    <span className="text-[11px] text-slate-400 flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>{alt.detectedAt}</span>
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-bold text-white tracking-tight">
                      {alt.pathogenName}
                    </h3>
                    <span className="text-xs italic text-emerald-300 font-mono">
                      ({alt.scientificName})
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-md bg-[#132640] text-cyan-300 font-mono">
                      {(alt.confidence * 100).toFixed(1)}% Calibrated Confidence
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 pt-0.5">
                    <strong>Symptoms: </strong> {alt.symptomsSummary}
                  </p>

                  <p className="text-xs text-emerald-200 bg-[#061910] p-2.5 rounded-xl border border-emerald-800/40 leading-relaxed mt-2">
                    <strong className="text-[#22c55e]">Prescribed Treatment Plan: </strong>
                    {alt.prescribedTreatment}
                  </p>
                </div>
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="p-8 text-center rounded-2xl border border-[#142640] bg-[#0c182a] text-slate-400">
            No disease incidents matching your current search criteria.
          </div>
        )}
      </div>
    </div>
  );
};
