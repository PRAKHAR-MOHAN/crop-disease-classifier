import React, { useState } from "react";
import {
  Thermometer,
  Droplets,
  Gauge,
  Activity,
  ArrowRight,
  MapPin,
  TrendingUp,
  Info,
  Layers,
} from "lucide-react";
import { StationInfo, TELEMETRY_HISTORY } from "../data/stationData";

interface StationOverviewProps {
  station: StationInfo;
  onNavigateToDiagnostic: () => void;
}

export const StationOverview: React.FC<StationOverviewProps> = ({
  station,
  onNavigateToDiagnostic,
}) => {
  const [timeRange, setTimeRange] = useState<"15m" | "1h" | "6h" | "24h">("1h");
  const [mapType, setMapType] = useState<"satellite" | "terrain">("satellite");

  const telemetry = TELEMETRY_HISTORY[timeRange] || TELEMETRY_HISTORY["1h"];

  // SVG dimensions for trend chart
  const chartWidth = 560;
  const chartHeight = 160;
  const padding = 20;

  // Compute SVG polyline points for Temperature and Humidity
  const tempMin = 15;
  const tempMax = 32;
  const humMin = 30;
  const humMax = 100;

  const getPoints = (values: number[], min: number, max: number) => {
    return values
      .map((val, idx) => {
        const x = padding + (idx / (values.length - 1)) * (chartWidth - padding * 2);
        const y = chartHeight - padding - ((val - min) / (max - min)) * (chartHeight - padding * 2);
        return `${x},${y}`;
      })
      .join(" ");
  };

  const tempPoints = getPoints(
    telemetry.map((t) => t.temp),
    tempMin,
    tempMax
  );
  const humPoints = getPoints(
    telemetry.map((t) => t.humidity),
    humMin,
    humMax
  );

  return (
    <div className="space-y-5">
      {/* Informational Alert Banner (SkyGuard style) */}
      <div className="p-4 rounded-2xl border border-[#173050] bg-gradient-to-r from-[#0a182c] to-[#0d223d] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
        <div className="flex items-start space-x-3">
          <div className="p-2 rounded-xl bg-cyan-950/80 border border-cyan-800 text-cyan-400 flex-shrink-0 mt-0.5">
            <Info className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-white flex items-center space-x-2">
              <span>Telemetry source: Open-Agro Microclimate Mesh & Station Pods</span>
              <span className="text-[10px] px-2 py-0.2 rounded-full bg-cyan-900/60 text-cyan-300 font-medium">
                Live Synced
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
              Station observations monitor foliar temperature and relative humidity to model pathogen spore pressure. Early diagnosis before visual necrosis prevents widespread crop loss.
            </p>
          </div>
        </div>

        <button
          onClick={onNavigateToDiagnostic}
          className="px-4 py-2 rounded-xl font-bold text-xs text-slate-950 bg-gradient-to-r from-cyan-400 to-emerald-400 hover:brightness-110 active:scale-95 transition flex items-center justify-center space-x-2 flex-shrink-0 shadow-md shadow-cyan-500/20"
        >
          <span>Run AI Leaf Scan</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 4 Core Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Crop Health Index Gauge */}
        <div className="p-5 rounded-2xl border border-[#142640] bg-[#0c182a] shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-bold text-white">Canopy Status</span>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
              ● Monitoring
            </span>
          </div>

          <div className="flex items-center justify-between mt-2">
            {/* SVG Circular Progress Gauge */}
            <div className="relative w-24 h-24 flex items-center justify-center flex-shrink-0">
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
                  className="stroke-cyan-400 transition-all duration-1000"
                  strokeWidth="8"
                  strokeDasharray={251.2}
                  strokeDashoffset={251.2 - (251.2 * station.healthIndex) / 100}
                  strokeLinecap="round"
                  fill="transparent"
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-xl font-black text-white">{station.healthIndex}%</span>
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Health</span>
              </div>
            </div>

            {/* Threshold Breakdown */}
            <div className="space-y-1.5 text-xs">
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="text-slate-400 text-[11px]">Optimal:</span>
                <span className="font-bold text-white text-[11px]">82%</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span className="text-slate-400 text-[11px]">Watch:</span>
                <span className="font-bold text-white text-[11px]">18%</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-rose-400" />
                <span className="text-slate-400 text-[11px]">Critical:</span>
                <span className="font-bold text-white text-[11px]">0%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Metric 2: Temperature */}
        <div className="p-5 rounded-2xl border border-[#142640] bg-[#0c182a] shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center space-x-2 text-cyan-400">
              <Thermometer className="w-4 h-4" />
              <span className="text-xs font-bold text-white">Canopy Temp</span>
            </div>
            <span className="text-[10px] text-slate-400">Target 20-26°C</span>
          </div>

          <div className="my-2">
            <div className="text-3xl font-black text-white tracking-tight">
              {station.temp.toFixed(1)} <span className="text-lg font-bold text-slate-400">°C</span>
            </div>
            <div className="text-[11px] text-emerald-400 font-semibold mt-0.5">
              Foliar vegetative zone
            </div>
          </div>

          {/* Mini Sparkline */}
          <div className="h-6 w-full pt-1">
            <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 100 20">
              <path
                d="M 0,15 Q 25,5 50,12 T 100,8"
                fill="none"
                stroke="#38bdf8"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>

        {/* Metric 3: Relative Humidity */}
        <div className="p-5 rounded-2xl border border-[#142640] bg-[#0c182a] shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center space-x-2 text-sky-400">
              <Droplets className="w-4 h-4" />
              <span className="text-xs font-bold text-white">Foliar Humidity</span>
            </div>
            <span className="text-[10px] text-slate-400">Spore trigger &gt;75%</span>
          </div>

          <div className="my-2">
            <div className="text-3xl font-black text-white tracking-tight">
              {station.humidity} <span className="text-lg font-bold text-slate-400">%</span>
            </div>
            <div className="text-[11px] text-cyan-400 font-semibold mt-0.5">
              Low fungal germination
            </div>
          </div>

          {/* Mini Sparkline */}
          <div className="h-6 w-full pt-1">
            <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 100 20">
              <path
                d="M 0,18 Q 30,10 60,14 T 100,6"
                fill="none"
                stroke="#06b6d4"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>

        {/* Metric 4: Barometric Pressure */}
        <div className="p-5 rounded-2xl border border-[#142640] bg-[#0c182a] shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center space-x-2 text-indigo-400">
              <Gauge className="w-4 h-4" />
              <span className="text-xs font-bold text-white">Pressure</span>
            </div>
            <span className="text-[10px] text-slate-400">Barometer</span>
          </div>

          <div className="my-2">
            <div className="text-3xl font-black text-white tracking-tight">
              {station.pressure.toFixed(1)} <span className="text-lg font-bold text-slate-400">hPa</span>
            </div>
            <div className="text-[11px] text-slate-400 font-semibold mt-0.5">
              Stable atmospheric front
            </div>
          </div>

          {/* Mini Sparkline */}
          <div className="h-6 w-full pt-1">
            <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 100 20">
              <path
                d="M 0,10 Q 30,12 60,8 T 100,11"
                fill="none"
                stroke="#818cf8"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Lower Section: Telemetry Trends + Station Location Map */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Weather & Microclimate Trends Card (Matching SkyGuard) */}
        <div className="lg:col-span-7 p-5 rounded-2xl border border-[#142640] bg-[#0c182a] shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                  <TrendingUp className="w-4 h-4 text-cyan-400" />
                  <span>Microclimate & Spore Pressure Trends</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {station.name} · Live sensor pod telemetry
                </p>
              </div>

              {/* Time Range Switcher */}
              <div className="flex items-center space-x-1 p-1 rounded-xl bg-[#070e19] border border-[#142640] self-start sm:self-auto">
                {(["15m", "1h", "6h", "24h"] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => setTimeRange(r)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                      timeRange === r
                        ? "bg-blue-600 text-white shadow"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {/* Legend */}
            <div className="flex items-center space-x-4 text-xs text-slate-400 mb-2">
              <div className="flex items-center space-x-1.5">
                <span className="w-3 h-1 rounded-full bg-cyan-400" />
                <span className="text-[11px]">Temperature (°C)</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-3 h-1 rounded-full bg-emerald-400" />
                <span className="text-[11px]">Humidity (%)</span>
              </div>
            </div>

            {/* SVG Curved Trends Chart */}
            <div className="relative w-full h-44 bg-[#070e19] rounded-xl border border-[#132238] p-3 overflow-hidden">
              <svg className="w-full h-full" viewBox={`0 0 ${chartWidth} ${chartHeight}`} preserveAspectRatio="none">
                {/* Horizontal grid lines */}
                <line x1="0" y1="40" x2={chartWidth} y2="40" stroke="#101e32" strokeWidth="1" strokeDasharray="3 3" />
                <line x1="0" y1="80" x2={chartWidth} y2="80" stroke="#101e32" strokeWidth="1" strokeDasharray="3 3" />
                <line x1="0" y1="120" x2={chartWidth} y2="120" stroke="#101e32" strokeWidth="1" strokeDasharray="3 3" />

                {/* Humidity line (Emerald) */}
                <polyline
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={humPoints}
                />

                {/* Temperature line (Cyan) */}
                <polyline
                  fill="none"
                  stroke="#06b6d4"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={tempPoints}
                />
              </svg>

              {/* Time stamps */}
              <div className="flex justify-between text-[10px] text-slate-400 pt-1 px-1">
                {telemetry.map((t, i) => (
                  <span key={i}>{t.time}</span>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-[#132238] flex items-center justify-between text-xs text-slate-400">
            <span>Spore Germination Index: <strong className="text-emerald-400">Low (Safe)</strong></span>
            <span>Next model cycle: <strong>12 min</strong></span>
          </div>
        </div>

        {/* Station Location & Field Map Card (Matching SkyGuard) */}
        <div className="lg:col-span-5 p-5 rounded-2xl border border-[#142640] bg-[#0c182a] shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                  <MapPin className="w-4 h-4 text-cyan-400" />
                  <span>Station Location</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Map and satellite telemetry of {station.name}
                </p>
              </div>

              <div className="flex items-center space-x-1">
                <button
                  onClick={() => setMapType(mapType === "satellite" ? "terrain" : "satellite")}
                  className="p-1.5 rounded-lg bg-[#070e19] border border-[#142640] text-slate-400 hover:text-white text-xs font-bold"
                  title="Toggle Map Style"
                >
                  <Layers className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Map Canvas / Simulated Satellite Preview */}
            <div className="relative w-full h-44 rounded-xl overflow-hidden border border-[#132238] bg-slate-900 group">
              {/* Satellite Terrain Texture Simulation */}
              <div
                className={`absolute inset-0 bg-cover bg-center transition-all duration-700 ${
                  mapType === "satellite"
                    ? "bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-950 via-slate-900 to-black opacity-90"
                    : "bg-slate-950"
                }`}
              >
                {/* Field Grid Overlay */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.1)_1px,transparent_1px)] bg-[size:24px_24px]" />
              </div>

              {/* Station Node Marker in Center */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                <div className="relative">
                  <span className="w-5 h-5 rounded-full bg-cyan-400/40 animate-ping absolute inset-0" />
                  <div className="w-5 h-5 rounded-full bg-cyan-500 border-2 border-white flex items-center justify-center shadow-lg shadow-cyan-500/50">
                    <span className="w-1.5 h-1.5 rounded-full bg-white" />
                  </div>
                </div>
                <div className="mt-1 px-2 py-0.5 rounded-md bg-black/80 border border-cyan-500/50 text-[10px] font-bold text-white shadow">
                  Pod #01 ({station.crop.split(" ")[0]})
                </div>
              </div>

              {/* Zone Coordinates Tag */}
              <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-black/70 text-[10px] text-slate-300 font-mono">
                {station.coordinates.lat.toFixed(4)}°N, {station.coordinates.lng.toFixed(4)}°E
              </div>

              {/* Area Pill */}
              <div className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-cyan-950/80 border border-cyan-800 text-[10px] text-cyan-300 font-bold">
                {station.areaHectares} Hectares
              </div>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-[#132238] flex items-center justify-between text-xs text-slate-400">
            <span>Region: <strong className="text-white">{station.region}</strong></span>
            <span>Target Crop: <strong className="text-emerald-400">{station.crop}</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
};
