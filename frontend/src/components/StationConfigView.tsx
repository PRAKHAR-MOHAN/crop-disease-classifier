import React, { useState } from "react";
import { Settings, Sliders, Server, Check, RefreshCw } from "lucide-react";

export const StationConfigView: React.FC = () => {
  const [telemetryInterval, setTelemetryInterval] = useState("10");
  const [confThreshold, setConfThreshold] = useState("0.60");
  const [sporeSensitivity, setSporeSensitivity] = useState("high");
  const [autoSync, setAutoSync] = useState(true);
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200 max-w-3xl">
      {/* Header Banner */}
      <div className="p-5 rounded-2xl border border-[#173050] bg-gradient-to-r from-[#0c1a2e] to-[#091728] shadow-lg flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-xl bg-cyan-950/80 border border-cyan-800 text-cyan-400">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black text-white">
              Station & Inference Configuration
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Adjust telemetry poll rates, neural calibration thresholds, and edge device syncing.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-4">
        {/* Model & AI Settings Card */}
        <div className="p-5 rounded-2xl border border-[#142640] bg-[#0c182a] space-y-4">
          <div className="flex items-center space-x-2 text-xs font-bold text-cyan-400 uppercase tracking-wider">
            <Sliders className="w-4 h-4" />
            <span>AI Calibration & OOD Engine</span>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Confidence Rejection Threshold ({confThreshold})
              </label>
              <input
                type="range"
                min="0.30"
                max="0.90"
                step="0.05"
                value={confThreshold}
                onChange={(e) => setConfThreshold(e.target.value)}
                className="w-full accent-cyan-400"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Predictions below this calibrated confidence flag an uncertainty banner for agronomic review.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Spore Germination Sensitivity Model
              </label>
              <select
                value={sporeSensitivity}
                onChange={(e) => setSporeSensitivity(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#1c3656] bg-[#081220] text-xs text-white"
              >
                <option value="low">Low (Requires sustained &gt;85% RH for 8h)</option>
                <option value="medium">Medium (Standard Mills & Smith Pathogen curve)</option>
                <option value="high">High (Early-warning alert on &gt;70% RH)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Telemetry Mesh Card */}
        <div className="p-5 rounded-2xl border border-[#142640] bg-[#0c182a] space-y-4">
          <div className="flex items-center space-x-2 text-xs font-bold text-cyan-400 uppercase tracking-wider">
            <Server className="w-4 h-4" />
            <span>Sensor Pod Telemetry</span>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Station Sync Interval
              </label>
              <select
                value={telemetryInterval}
                onChange={(e) => setTelemetryInterval(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#1c3656] bg-[#081220] text-xs text-white"
              >
                <option value="5">Every 5 Seconds (High resolution)</option>
                <option value="10">Every 10 Seconds (Standard balanced)</option>
                <option value="60">Every 1 Minute (Battery saver mode)</option>
              </select>
            </div>

            <div className="flex items-center justify-between pt-2">
              <div>
                <div className="text-xs font-semibold text-slate-200">Automatic Outbreak Alert Dispatch</div>
                <div className="text-[11px] text-slate-400">Push high-risk anomalies directly to active field scouts.</div>
              </div>
              <input
                type="checkbox"
                checked={autoSync}
                onChange={(e) => setAutoSync(e.target.checked)}
                className="w-4 h-4 accent-cyan-400 rounded"
              />
            </div>
          </div>
        </div>

        {/* Save button */}
        <div className="flex items-center space-x-3">
          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl font-bold text-xs text-slate-950 bg-gradient-to-r from-cyan-400 to-emerald-400 hover:brightness-110 active:scale-95 transition shadow-md shadow-cyan-500/20 flex items-center space-x-2"
          >
            {saved ? <Check className="w-4 h-4 text-emerald-950" /> : <RefreshCw className="w-4 h-4 text-slate-950" />}
            <span>{saved ? "Configuration Saved!" : "Save Configuration"}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
