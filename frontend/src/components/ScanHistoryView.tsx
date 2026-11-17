import React from "react";
import { History, Download, Trash2, ArrowRight, Clock } from "lucide-react";
import { HistoryItem } from "../api/types";
import { parseClassName } from "../lib/parseClassName";

interface ScanHistoryViewProps {
  history: HistoryItem[];
  onSelectHistoryItem: (item: HistoryItem) => void;
  onClearHistory: () => void;
}

export const ScanHistoryView: React.FC<ScanHistoryViewProps> = ({
  history,
  onSelectHistoryItem,
  onClearHistory,
}) => {
  const exportCsv = () => {
    if (history.length === 0) return;
    const rows = [
      ["Date", "Diagnosed Class", "Confidence", "Status"],
      ...history.map((h) => [
        new Date(h.timestamp).toISOString(),
        h.prediction.label,
        `${(h.prediction.confidence * 100).toFixed(1)}%`,
        h.prediction.is_ood ? "OOD" : h.prediction.is_uncertain ? "Uncertain" : "Verified",
      ]),
    ];
    const csvContent =
      "data:text/csv;charset=utf-8," + rows.map((e) => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `cropguard_diagnostics_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="p-5 rounded-2xl border border-[#173050] bg-gradient-to-r from-[#0c1a2e] to-[#091728] shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-2 rounded-xl bg-cyan-950/80 border border-cyan-800 text-cyan-400">
              <History className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white">
                Foliar Diagnostic Scan History
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Local field audit logs, calibrated confidence scores, and Grad-CAM artifacts.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {history.length > 0 && (
            <>
              <button
                onClick={exportCsv}
                className="px-3 py-2 rounded-xl border border-[#1a3352] bg-[#0c1a2c] text-xs font-bold text-cyan-300 hover:text-white flex items-center space-x-1.5 transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </button>

              <button
                onClick={onClearHistory}
                className="px-3 py-2 rounded-xl border border-rose-900/60 bg-rose-950/20 text-xs font-bold text-rose-300 hover:text-white flex items-center space-x-1.5 transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* History Table / Cards */}
      <div className="space-y-3">
        {history.map((item) => {
          const parsed = parseClassName(item.prediction.label);
          const isHealthy = parsed.isHealthy;
          const dateStr = new Date(item.timestamp).toLocaleString();

          return (
            <div
              key={item.id}
              onClick={() => onSelectHistoryItem(item)}
              className="p-4 rounded-2xl border border-[#142640] bg-[#0c182a] hover:border-cyan-500/50 hover:bg-[#0f2038] transition cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="flex items-center space-x-3.5">
                <img
                  src={item.thumbnail}
                  alt={item.prediction.label}
                  className="w-14 h-14 rounded-xl object-cover border border-[#193352] bg-slate-900 flex-shrink-0"
                />

                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-bold text-white">
                      {parsed.crop} · {parsed.disease}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        isHealthy
                          ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                          : "bg-amber-950 text-amber-400 border border-amber-800"
                      }`}
                    >
                      {isHealthy ? "Healthy" : "Diseased"}
                    </span>
                  </div>

                  <div className="text-xs text-slate-400 mt-1 flex items-center space-x-3">
                    <span className="flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>{dateStr}</span>
                    </span>
                    <span>·</span>
                    <span className="text-cyan-400 font-semibold">
                      {(item.prediction.confidence * 100).toFixed(1)}% Confidence
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2 text-xs text-cyan-400 font-bold self-end sm:self-auto">
                <span>Inspect Result</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          );
        })}

        {history.length === 0 && (
          <div className="p-12 text-center rounded-2xl border border-[#142640] bg-[#0c182a] text-slate-400 space-y-2">
            <History className="w-8 h-8 text-slate-500 mx-auto" />
            <div className="font-bold text-white text-sm">No Scans Recorded Yet</div>
            <p className="text-xs max-w-sm mx-auto">
              Run an AI diagnostic scan on a crop leaf photo to log the prediction and treatment advice here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

