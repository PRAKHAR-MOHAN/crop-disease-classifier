import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Eye, EyeOff, Sliders } from "lucide-react";

interface GradCamViewerProps {
  originalSrc: string;
  gradcamBase64?: string | null;
}

export const GradCamViewer: React.FC<GradCamViewerProps> = ({
  originalSrc,
  gradcamBase64,
}) => {
  const { t } = useTranslation();
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [opacity, setOpacity] = useState(0.55);
  const [compareMode, setCompareMode] = useState<"overlay" | "split">("overlay");
  const [splitPos, setSplitPos] = useState(50); // percentage for split view

  const heatmapSrc = gradcamBase64 ? `data:image/png;base64,${gradcamBase64}` : null;

  return (
    <div className="bg-[#0c2417] border border-[#1b4d32] rounded-3xl p-5 shadow-lg space-y-4">
      {/* Title & Controls Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center space-x-2">
          <span className="text-xl">🔬</span>
          <div>
            <h3 className="text-sm font-bold text-white">
              {t("result.heatmapTitle")}
            </h3>
            <p className="text-[11px] text-emerald-300/80">
              {t("result.heatmapExplainer")}
            </p>
          </div>
        </div>

        {/* View Mode Toggle (Overlay vs Split) */}
        {heatmapSrc && (
          <div className="flex items-center space-x-1 bg-[#143d26] border border-[#235f3d] p-1 rounded-xl text-xs">
            <button
              type="button"
              onClick={() => setCompareMode("overlay")}
              className={`px-2.5 py-1 rounded-lg font-bold transition ${
                compareMode === "overlay"
                  ? "bg-[#22c55e] text-black shadow-xs"
                  : "text-emerald-300 hover:text-white"
              }`}
            >
              Overlay
            </button>
            <button
              type="button"
              onClick={() => setCompareMode("split")}
              className={`px-2.5 py-1 rounded-lg font-bold transition ${
                compareMode === "split"
                  ? "bg-[#22c55e] text-black shadow-xs"
                  : "text-emerald-300 hover:text-white"
              }`}
            >
              Split View
            </button>
          </div>
        )}
      </div>

      {/* Visual Canvas / Frame */}
      <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden bg-black shadow-inner border border-[#1b4d32] select-none">
        {/* Base Photo */}
        <img
          src={originalSrc}
          alt="Original leaf"
          className="w-full h-full object-contain"
        />

        {/* Heatmap Overlay Mode */}
        {heatmapSrc && showHeatmap && compareMode === "overlay" && (
          <img
            src={heatmapSrc}
            alt="Grad-CAM saliency"
            className="absolute inset-0 w-full h-full object-contain mix-blend-screen pointer-events-none transition-opacity duration-150"
            style={{ opacity }}
          />
        )}

        {/* Split Compare Mode */}
        {heatmapSrc && compareMode === "split" && (
          <div
            className="absolute inset-0 overflow-hidden pointer-events-none"
            style={{ clipPath: `inset(0 ${100 - splitPos}% 0 0)` }}
          >
            <img
              src={heatmapSrc}
              alt="Grad-CAM saliency split"
              className="w-full h-full object-contain mix-blend-screen"
            />
            {/* Split boundary bar */}
            <div className="absolute right-0 top-0 bottom-0 w-1 bg-[#22c55e] shadow-[0_0_8px_#22c55e]" />
          </div>
        )}

        {/* Interactive Split Slider on bottom if split mode */}
        {compareMode === "split" && (
          <div className="absolute bottom-3 inset-x-6 bg-black/60 backdrop-blur-md p-2 rounded-xl flex items-center space-x-2">
            <span className="text-[10px] text-white font-bold">{t("result.compareOriginal")}</span>
            <input
              type="range"
              min="0"
              max="100"
              value={splitPos}
              onChange={(e) => setSplitPos(parseInt(e.target.value, 10))}
              className="flex-1 accent-[#22c55e] cursor-pointer"
            />
            <span className="text-[10px] text-white font-bold">{t("result.compareHeatmap")}</span>
          </div>
        )}
      </div>

      {/* Heatmap Controls Footer */}
      {heatmapSrc && compareMode === "overlay" && (
        <div className="bg-[#081e13] p-3.5 rounded-2xl border border-[#1b4d32] flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Toggle Button */}
          <button
            type="button"
            onClick={() => setShowHeatmap(!showHeatmap)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 min-h-[38px] ${
              showHeatmap
                ? "bg-[#16a34a] text-white"
                : "bg-[#143d26] text-emerald-200 border border-[#235f3d]"
            }`}
          >
            {showHeatmap ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            <span>{showHeatmap ? "Heatmap Active" : "Heatmap Hidden"}</span>
          </button>

          {/* Opacity Slider */}
          {showHeatmap && (
            <div className="flex items-center space-x-3 w-full sm:w-auto">
              <Sliders className="w-3.5 h-3.5 text-emerald-400" />
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.05"
                value={opacity}
                onChange={(e) => setOpacity(parseFloat(e.target.value))}
                className="w-full sm:w-36 accent-[#22c55e] cursor-pointer"
                aria-label={t("result.heatmapOpacity")}
              />
              <span className="font-mono text-xs font-bold text-emerald-200 min-w-[36px]">
                {Math.round(opacity * 100)}%
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
