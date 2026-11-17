import React from "react";
import { Radio, MapPin, ArrowRight } from "lucide-react";
import { STATIONS, StationInfo } from "../data/stationData";

interface FieldStationsViewProps {
  selectedStation: StationInfo;
  onSelectStation: (st: StationInfo) => void;
  onNavigateToDiagnostic: () => void;
}

export const FieldStationsView: React.FC<FieldStationsViewProps> = ({
  selectedStation,
  onSelectStation,
  onNavigateToDiagnostic,
}) => {
  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="p-5 rounded-2xl border border-[#173050] bg-gradient-to-r from-[#0c1a2e] to-[#091728] shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-2 rounded-xl bg-cyan-950/80 border border-cyan-800 text-cyan-400">
              <Radio className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white">
                Field Station & Sensor Mesh
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Active sensor nodes tracking crop microclimates, canopy leaf wetness, and disease risk.
              </p>
            </div>
          </div>
        </div>

        <div className="text-xs text-emerald-400 font-bold bg-[#091524] px-3 py-1.5 rounded-xl border border-[#132a45]">
          4 Active Station Pods
        </div>
      </div>

      {/* Grid of Stations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {STATIONS.map((st) => {
          const isSelected = selectedStation.id === st.id;
          const isWarning = st.status === "warning";

          return (
            <div
              key={st.id}
              onClick={() => onSelectStation(st)}
              className={`p-5 rounded-2xl border transition-all cursor-pointer shadow-lg flex flex-col justify-between ${
                isSelected
                  ? "border-cyan-500 bg-[#0f2139] shadow-cyan-950/50"
                  : "border-[#142640] bg-[#0c182a] hover:border-[#1d3c64]"
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${isWarning ? "bg-amber-400 animate-pulse" : "bg-emerald-400"}`} />
                    <span className="text-xs font-bold text-white">{st.name}</span>
                  </div>

                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      isWarning
                        ? "bg-amber-950 text-amber-400 border border-amber-800"
                        : "bg-emerald-950 text-emerald-400 border border-emerald-800"
                    }`}
                  >
                    {isWarning ? "Spore Warning" : "Optimal"}
                  </span>
                </div>

                <div className="text-xs text-cyan-300 font-medium">
                  {st.crop} · {st.areaHectares} ha
                </div>

                <div className="text-[11px] text-slate-400 mt-1 flex items-center space-x-1 font-mono">
                  <MapPin className="w-3 h-3 text-slate-500" />
                  <span>{st.region} ({st.coordinates.lat}°N, {st.coordinates.lng}°E)</span>
                </div>

                {/* Live Telemetry Readings */}
                <div className="grid grid-cols-3 gap-2 mt-4 p-3 rounded-xl bg-[#070e19] border border-[#12243d] text-center">
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase font-bold">Temp</div>
                    <div className="text-sm font-black text-white mt-0.5">{st.temp}°C</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase font-bold">Humidity</div>
                    <div className="text-sm font-black text-cyan-400 mt-0.5">{st.humidity}%</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase font-bold">Health</div>
                    <div className="text-sm font-black text-emerald-400 mt-0.5">{st.healthIndex}%</div>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-[#132238] flex items-center justify-between">
                <span className="text-xs text-slate-400">
                  {isSelected ? "● Currently Monitoring" : "Click to monitor this zone"}
                </span>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectStation(st);
                    onNavigateToDiagnostic();
                  }}
                  className="px-3 py-1.5 rounded-lg bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 text-xs font-bold hover:bg-cyan-500 hover:text-slate-950 transition flex items-center space-x-1"
                >
                  <span>Scan Crop</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
