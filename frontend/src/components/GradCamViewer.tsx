import React, { useState } from "react";
import { useTranslation } from "react-i18next";

interface GradCamViewerProps {
  originalSrc: string;
  gradcamBase64?: string | null;
}

export const GradCamViewer: React.FC<GradCamViewerProps> = ({ originalSrc, gradcamBase64 }) => {
  const { t } = useTranslation();
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [opacity, setOpacity] = useState(0.55);

  const heatmapSrc = gradcamBase64 ? `data:image/png;base64,${gradcamBase64}` : null;

  return (
    <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border border-gray-200/80 dark:border-gray-800 rounded-3xl p-5 shadow-xl space-y-4">
      {/* Title & Badge */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-lg">🔬</span>
          <div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">
              Visual Explainability (Grad-CAM)
            </h3>
            <p className="text-[11px] text-gray-500 dark:text-gray-400">
              Neural network attention overlay on infected lesions
            </p>
          </div>
        </div>
        <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
          GAP Conv 1x1
        </span>
      </div>

      {/* Image container with layered overlay */}
      <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-black shadow-inner border border-gray-200/80 dark:border-gray-800 group">
        {/* Original photo */}
        <img
          src={originalSrc}
          alt="Uploaded crop"
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
        />

        {/* Grad-CAM heatmap overlay */}
        {heatmapSrc && showHeatmap && (
          <img
            src={heatmapSrc}
            alt="Grad-CAM attention heatmap"
            className="absolute inset-0 w-full h-full object-cover mix-blend-screen transition-opacity duration-200 pointer-events-none"
            style={{ opacity }}
          />
        )}

        {/* Floating live indicator */}
        <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-bold bg-black/60 backdrop-blur-md text-white border border-white/20 flex items-center space-x-1.5 shadow-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>{showHeatmap && heatmapSrc ? "Heatmap Active" : "Original View"}</span>
        </div>
      </div>

      {/* Heatmap controls */}
      {heatmapSrc && (
        <div className="bg-gray-50 dark:bg-gray-800/50 p-3.5 rounded-2xl border border-gray-100 dark:border-gray-800 space-y-2.5">
          <div className="flex items-center justify-between text-xs font-semibold">
            <label className="flex items-center space-x-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showHeatmap}
                onChange={(e) => setShowHeatmap(e.target.checked)}
                className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 cursor-pointer"
              />
              <span className="text-gray-800 dark:text-gray-200">{t("result.heatmapToggle")}</span>
            </label>
            <span className="font-mono text-xs font-bold text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/40 px-2 py-0.5 rounded-md border border-brand-200 dark:border-brand-800">
              {Math.round(opacity * 100)}% Opacity
            </span>
          </div>

          {showHeatmap && (
            <div className="space-y-1">
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.05"
                value={opacity}
                onChange={(e) => setOpacity(parseFloat(e.target.value))}
                aria-label={t("result.heatmapOpacity")}
                className="w-full accent-brand-500 h-2 bg-gray-200 dark:bg-gray-700 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-gray-400 dark:text-gray-500 font-mono">
                <span>Subtle (10%)</span>
                <span>Balanced (55%)</span>
                <span>Vivid (100%)</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
