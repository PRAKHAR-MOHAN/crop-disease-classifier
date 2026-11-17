import React from "react";
import { Layers, MapPin, ArrowRight, Sprout } from "lucide-react";
import { CROP_ZONES, CropZone } from "../data/cropDiseaseData";

interface CropFieldPlotsViewProps {
  selectedZone: CropZone;
  onSelectZone: (zone: CropZone) => void;
  onNavigateToDiagnostic: () => void;
}

export const CropFieldPlotsView: React.FC<CropFieldPlotsViewProps> = ({
  selectedZone,
  onSelectZone,
  onNavigateToDiagnostic,
}) => {
  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="p-5 rounded-2xl border border-emerald-800/40 bg-gradient-to-r from-[#071910] via-[#092215] to-[#0c182a] shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <span className="p-2.5 rounded-xl bg-emerald-950/80 border border-emerald-700/60 text-emerald-400">
              <Layers className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white">
                Agricultural Plots & Crop Field Sectors
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Active cultivation zones monitored for foliar disease spread, blights, and leaf pathogens.
              </p>
            </div>
          </div>
        </div>

        <div className="text-xs text-emerald-400 font-bold bg-[#071910] px-3.5 py-1.5 rounded-xl border border-emerald-800/50">
          5 Cultivation Sectors Monitored
        </div>
      </div>

      {/* Grid of Plots */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {CROP_ZONES.map((zone) => {
          const isSelected = selectedZone.id === zone.id;
          const isWarn = zone.severity === "warning";
          const isCrit = zone.severity === "critical";

          return (
            <div
              key={zone.id}
              onClick={() => onSelectZone(zone)}
              className={`p-5 rounded-2xl border transition-all cursor-pointer shadow-lg flex flex-col justify-between ${
                isSelected
                  ? "border-[#22c55e] bg-[#0c2417]/80 shadow-emerald-950/50"
                  : "border-[#142640] bg-[#0c182a] hover:border-[#1d3c64]"
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        isCrit ? "bg-rose-500 animate-ping" : isWarn ? "bg-amber-400" : "bg-emerald-400"
                      }`}
                    />
                    <span className="text-sm font-bold text-white">{zone.name}</span>
                  </div>

                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      isCrit
                        ? "bg-rose-950 text-rose-400 border border-rose-800"
                        : isWarn
                        ? "bg-amber-950 text-amber-400 border border-amber-800"
                        : "bg-emerald-950 text-emerald-400 border border-emerald-800"
                    }`}
                  >
                    {isCrit ? "Active Outbreak" : isWarn ? "Pathogen Watch" : "Healthy Foliage"}
                  </span>
                </div>

                <div className="text-xs text-emerald-300 font-semibold flex items-center space-x-1.5">
                  <Sprout className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{zone.crop}</span>
                </div>

                <div className="text-[11px] text-slate-400 mt-1 flex items-center space-x-1">
                  <MapPin className="w-3 h-3 text-cyan-400" />
                  <span>{zone.areaAcres} Acres · GPS: {zone.coordinates.lat.toFixed(3)}°N, {zone.coordinates.lng.toFixed(3)}°E</span>
                </div>

                {/* Pathogen Status Card */}
                <div className="mt-4 p-3 rounded-xl bg-[#070e19] border border-[#12243d] flex items-center justify-between">
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase font-bold">Dominant Pathogen</div>
                    <div className="text-xs font-bold text-white mt-0.5">
                      {zone.dominantPathogen || "No Pathogen Detected (Clean Foliage)"}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-slate-400 uppercase font-bold">Health Score</div>
                    <div className="text-sm font-black text-emerald-400 mt-0.5">{zone.healthIndex}%</div>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-[#132238] flex items-center justify-between">
                <span className="text-xs text-slate-400">
                  Last scanned: <strong>{zone.lastScanTime}</strong>
                </span>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectZone(zone);
                    onNavigateToDiagnostic();
                  }}
                  className="px-3.5 py-1.5 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold hover:bg-[#22c55e] hover:text-slate-950 transition flex items-center space-x-1.5"
                >
                  <span>Diagnose Leaves</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
