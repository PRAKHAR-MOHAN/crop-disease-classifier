import React, { useState } from "react";
import {
  Sprout,
  ShieldCheck,
  Activity,
  ArrowRight,
  TrendingUp,
  MapPin,
  Bug,
  Sparkles,
} from "lucide-react";
import { CropZone, CROP_ZONES, DISEASE_TRENDS, RECENT_DISEASE_INCIDENTS } from "../data/cropDiseaseData";

interface CropDiseaseDashboardProps {
  selectedZone: CropZone;
  onSelectZone: (zone: CropZone) => void;
  onNavigateToDiagnostic: () => void;
}

export const CropDiseaseDashboard: React.FC<CropDiseaseDashboardProps> = ({
  selectedZone,
  onSelectZone,
  onNavigateToDiagnostic,
}) => {
  const [trendRange, setTrendRange] = useState<"7d" | "30d" | "season">("7d");

  const trendData = DISEASE_TRENDS[trendRange] || DISEASE_TRENDS["7d"];

  // SVG Chart Dimensions
  const chartWidth = 560;
  const chartHeight = 160;
  const padding = 20;

  // Max value for scaling
  const maxVal = 40;
  const getPoints = (values: number[]) => {
    return values
      .map((val, idx) => {
        const x = padding + (idx / (values.length - 1)) * (chartWidth - padding * 2);
        const y = chartHeight - padding - (val / maxVal) * (chartHeight - padding * 2);
        return `${x},${y}`;
      })
      .join(" ");
  };

  const fungalPoints = getPoints(trendData.map((d) => d.fungalBlight));
  const bacterialPoints = getPoints(trendData.map((d) => d.bacterialSpot));
  const viralPoints = getPoints(trendData.map((d) => d.viralPest));

  return (
    <div className="space-y-6">
      {/* Top Banner: Core Crop Disease Platform Focus */}
      <div className="p-5 rounded-2xl border border-emerald-800/40 bg-gradient-to-r from-[#071910] via-[#092215] to-[#0d2a1b] shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start space-x-3.5">
          <div className="p-2.5 rounded-xl bg-emerald-950 border border-emerald-700/60 text-[#22c55e] flex-shrink-0 mt-0.5 shadow-md shadow-emerald-950/80">
            <Sprout className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-sm sm:text-base font-black text-white tracking-tight">
                AI Crop Disease & Foliar Pathology Command Center
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#143d26] text-emerald-300 border border-emerald-600/50">
                38 Diseases Covered
              </span>
            </div>
            <p className="text-xs text-emerald-100/70 mt-1 max-w-2xl leading-relaxed">
              Real-time deep learning screening for fungal blights, bacterial spots, viral mosaics, and leaf pests across 14 major agricultural crops with calibrated confidence.
            </p>
          </div>
        </div>

        <button
          onClick={onNavigateToDiagnostic}
          className="px-5 py-2.5 rounded-xl font-bold text-xs text-slate-950 bg-gradient-to-r from-[#22c55e] via-emerald-400 to-cyan-400 hover:brightness-110 active:scale-95 transition flex items-center justify-center space-x-2 flex-shrink-0 shadow-lg shadow-emerald-600/25"
        >
          <span>Diagnose Leaf Photo</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* 4 Core Crop Pathology Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Overall Canopy Health Index */}
        <div className="p-5 rounded-2xl border border-[#142640] bg-[#0c182a] shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2 text-cyan-400">
              <Activity className="w-4 h-4" />
              <span className="text-xs font-bold text-white">Canopy Health</span>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
              ● Healthy
            </span>
          </div>

          <div className="flex items-center justify-between mt-2">
            {/* SVG Circular Progress Gauge */}
            <div className="relative w-20 h-20 flex items-center justify-center flex-shrink-0">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  className="stroke-[#132842]"
                  strokeWidth="8"
                  fill="transparent"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  className="stroke-[#22c55e] transition-all duration-1000"
                  strokeWidth="8"
                  strokeDasharray={251.2}
                  strokeDashoffset={251.2 - (251.2 * selectedZone.healthIndex) / 100}
                  strokeLinecap="round"
                  fill="transparent"
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-lg font-black text-white">{selectedZone.healthIndex}%</span>
                <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider">Index</span>
              </div>
            </div>

            {/* Breakdown */}
            <div className="space-y-1 text-xs">
              <div className="flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="text-slate-400 text-[11px]">Healthy:</span>
                <span className="font-bold text-white text-[11px]">82%</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span className="text-slate-400 text-[11px]">Watch:</span>
                <span className="font-bold text-white text-[11px]">18%</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-400" />
                <span className="text-slate-400 text-[11px]">Diseased:</span>
                <span className="font-bold text-white text-[11px]">0%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Metric 2: Dominant Pathogen Alert */}
        <div className="p-5 rounded-2xl border border-[#142640] bg-[#0c182a] shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center space-x-2 text-amber-400">
              <Bug className="w-4 h-4" />
              <span className="text-xs font-bold text-white">Pathogen Watch</span>
            </div>
            <span className="text-[10px] text-amber-400 font-bold bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-800">
              Active Watch
            </span>
          </div>

          <div className="my-2">
            <div className="text-sm font-black text-white truncate">
              {selectedZone.dominantPathogen || "No Pathogen Detected"}
            </div>
            <div className="text-xs text-emerald-400 font-medium mt-0.5">
              Host: {selectedZone.crop.split(" ")[0]}
            </div>
          </div>

          <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1 border-t border-[#142640]">
            <span>Last scanned:</span>
            <strong className="text-slate-300">{selectedZone.lastScanTime}</strong>
          </div>
        </div>

        {/* Metric 3: Fungal & Blight Infection Risk */}
        <div className="p-5 rounded-2xl border border-[#142640] bg-[#0c182a] shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center space-x-2 text-emerald-400">
              <Sparkles className="w-4 h-4" />
              <span className="text-xs font-bold text-white">Spore Incubation</span>
            </div>
            <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950 px-2 py-0.5 rounded-full border border-emerald-800">
              Low Risk
            </span>
          </div>

          <div className="my-2">
            <div className="text-2xl font-black text-white tracking-tight">
              18% <span className="text-xs font-normal text-slate-400">Risk Factor</span>
            </div>
            <div className="text-xs text-slate-300 mt-0.5">
              Dry leaf canopy (&lt;3h wetness)
            </div>
          </div>

          <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1 border-t border-[#142640]">
            <span>Preventative Spray:</span>
            <strong className="text-cyan-400">Not Required</strong>
          </div>
        </div>

        {/* Metric 4: Neural Model Precision & Coverage */}
        <div className="p-5 rounded-2xl border border-[#142640] bg-[#0c182a] shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center space-x-2 text-cyan-400">
              <ShieldCheck className="w-4 h-4" />
              <span className="text-xs font-bold text-white">AI Diagnostic Engine</span>
            </div>
            <span className="text-[10px] text-cyan-400 font-bold">ONNX Runtime</span>
          </div>

          <div className="my-2">
            <div className="text-2xl font-black text-white tracking-tight">
              99.88% <span className="text-xs font-normal text-slate-400">Val Acc</span>
            </div>
            <div className="text-xs text-slate-300 mt-0.5">
              EfficientNetV2-S · 110ms latency
            </div>
          </div>

          <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1 border-t border-[#142640]">
            <span>Temperature Calibrated:</span>
            <strong className="text-emerald-400">T = 0.547</strong>
          </div>
        </div>
      </div>

      {/* Middle Section: Disease Infection Spread Trends + Field Crop Zones */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Disease Trend Curves (Crop Disease Specific) */}
        <div className="lg:col-span-7 p-5 rounded-2xl border border-[#142640] bg-[#0c182a] shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                  <TrendingUp className="w-4 h-4 text-[#22c55e]" />
                  <span>Crop Pathology Incident Trends</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Fungal blights, bacterial spots, and viral leaf infections over time
                </p>
              </div>

              {/* Timeframe Selector */}
              <div className="flex items-center space-x-1 p-1 rounded-xl bg-[#070e19] border border-[#142640]">
                {(["7d", "30d", "season"] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => setTrendRange(r)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold capitalize transition ${
                      trendRange === r
                        ? "bg-[#22c55e] text-slate-950 font-black shadow"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    {r === "7d" ? "7 Days" : r === "30d" ? "30 Days" : "Full Season"}
                  </button>
                ))}
              </div>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300 mb-2">
              <div className="flex items-center space-x-1.5">
                <span className="w-3 h-1 rounded-full bg-[#22c55e]" />
                <span className="text-[11px]">Fungal Blights (Alternaria/Phytophthora)</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-3 h-1 rounded-full bg-amber-400" />
                <span className="text-[11px]">Bacterial Spots (Xanthomonas)</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-3 h-1 rounded-full bg-cyan-400" />
                <span className="text-[11px]">Viral & Mites</span>
              </div>
            </div>

            {/* SVG Trend Graph */}
            <div className="relative w-full h-44 bg-[#070e19] rounded-xl border border-[#132238] p-3 overflow-hidden">
              <svg className="w-full h-full" viewBox={`0 0 ${chartWidth} ${chartHeight}`} preserveAspectRatio="none">
                <line x1="0" y1="40" x2={chartWidth} y2="40" stroke="#101e32" strokeWidth="1" strokeDasharray="3 3" />
                <line x1="0" y1="80" x2={chartWidth} y2="80" stroke="#101e32" strokeWidth="1" strokeDasharray="3 3" />
                <line x1="0" y1="120" x2={chartWidth} y2="120" stroke="#101e32" strokeWidth="1" strokeDasharray="3 3" />

                {/* Viral / Pest (Cyan) */}
                <polyline
                  fill="none"
                  stroke="#06b6d4"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={viralPoints}
                />

                {/* Bacterial Spots (Amber) */}
                <polyline
                  fill="none"
                  stroke="#fbbf24"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={bacterialPoints}
                />

                {/* Fungal Blights (Emerald) */}
                <polyline
                  fill="none"
                  stroke="#22c55e"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={fungalPoints}
                />
              </svg>

              {/* Dates */}
              <div className="flex justify-between text-[10px] text-slate-400 pt-1 px-1">
                {trendData.map((d, i) => (
                  <span key={i}>{d.date}</span>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-[#132238] flex items-center justify-between text-xs text-slate-400">
            <span>Agronomic Insight: <strong className="text-emerald-400">Preventative pruning reduced fungal incidents by 38%</strong></span>
            <span>Next inspection: <strong>Tomorrow 08:00 AM</strong></span>
          </div>
        </div>

        {/* Field Crop Zones (Crop Specific) */}
        <div className="lg:col-span-5 p-5 rounded-2xl border border-[#142640] bg-[#0c182a] shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                  <MapPin className="w-4 h-4 text-cyan-400" />
                  <span>Active Crop Plots & Sectors</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Select a zone to inspect foliar pathogen conditions
                </p>
              </div>
            </div>

            {/* List of Crop Zones */}
            <div className="space-y-2">
              {CROP_ZONES.slice(0, 4).map((zone) => {
                const isSelected = selectedZone.id === zone.id;
                const isWarn = zone.severity === "warning";
                const isCrit = zone.severity === "critical";

                return (
                  <div
                    key={zone.id}
                    onClick={() => onSelectZone(zone)}
                    className={`p-3 rounded-xl border transition cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? "border-[#22c55e] bg-emerald-950/20"
                        : "border-[#142640] bg-[#070e19] hover:border-slate-600"
                    }`}
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center space-x-2">
                        <span className={`w-2 h-2 rounded-full ${isCrit ? "bg-rose-500 animate-ping" : isWarn ? "bg-amber-400" : "bg-emerald-400"}`} />
                        <span className="text-xs font-bold text-white">{zone.name}</span>
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {zone.crop.split(" ")[0]} · {zone.dominantPathogen || "Healthy Canopy"}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-xs font-black text-emerald-400">{zone.healthIndex}%</div>
                      <div className="text-[9px] uppercase tracking-wider text-slate-400">{zone.severity}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#132238] flex items-center justify-between">
            <span className="text-xs text-slate-400">Total Monitored Area: <strong>65.7 Acres</strong></span>
            <button
              onClick={onNavigateToDiagnostic}
              className="text-xs font-bold text-[#22c55e] hover:underline flex items-center space-x-1"
            >
              <span>Scan Active Sector</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Section: Recent Verified Foliar Diagnoses Feed */}
      <div className="p-5 rounded-2xl border border-[#142640] bg-[#0c182a] shadow-lg space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <Sprout className="w-4 h-4 text-emerald-400" />
              <span>Recent Foliar Diagnoses & Treatment Prescriptions</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Verified leaf samples evaluated by EfficientNetV2-S with agronomic remediation plans
            </p>
          </div>
          <button
            onClick={onNavigateToDiagnostic}
            className="text-xs text-cyan-400 font-bold hover:underline flex items-center space-x-1"
          >
            <span>Scan New Leaf</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
          {RECENT_DISEASE_INCIDENTS.slice(0, 3).map((inc) => (
            <div
              key={inc.id}
              className="p-4 rounded-xl border border-[#13243d] bg-[#070e19] flex flex-col justify-between space-y-2 hover:border-emerald-600/40 transition"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-white flex items-center space-x-1.5">
                    <span>{inc.cropName}</span>
                    <span className="text-slate-500">·</span>
                    <span className="text-emerald-400">{inc.pathogenName}</span>
                  </span>
                  <span className="text-[10px] font-mono text-cyan-300 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
                    {(inc.confidence * 100).toFixed(0)}% Conf
                  </span>
                </div>

                <div className="text-[11px] italic text-slate-400 font-mono mt-0.5">
                  {inc.scientificName}
                </div>

                <p className="text-xs text-slate-300 mt-1 line-clamp-2 leading-relaxed">
                  {inc.symptomsSummary}
                </p>
              </div>

              <div className="p-2.5 rounded-lg bg-emerald-950/30 border border-emerald-900/40 text-[11px] text-emerald-200">
                <strong>Remedy: </strong> {inc.prescribedTreatment}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
