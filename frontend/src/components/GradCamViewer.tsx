import React, { useState } from "react";
import { useTranslation } from "react-i18next";

interface GradCamViewerProps {
  originalSrc: string;
  gradcamBase64?: string | null;
}

export const GradCamViewer: React.FC<GradCamViewerProps> = ({ originalSrc, gradcamBase64 }) => {
  const { t } = useTranslation();
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [opacity, setOpacity] = useState(0.5);

  const heatmapSrc = gradcamBase64 ? `data:image/png;base64,${gradcamBase64}` : null;

  return (
    <div className="flex flex-col items-center space-y-3">
      {/* Image container with layered overlay */}
      <div className="relative w-full max-w-sm aspect-square rounded-xl overflow-hidden bg-black shadow-md border border-gray-200 dark:border-gray-800">
        {/* Original photo */}
        <img
          src={originalSrc}
          alt="Uploaded crop"
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* Grad-CAM heatmap overlay */}
        {heatmapSrc && showHeatmap && (
          <img
            src={heatmapSrc}
            alt="Grad-CAM attention heatmap"
            className="absolute inset-0 w-full h-full object-cover mix-blend-screen transition-opacity duration-150"
            style={{ opacity }}
          />
        )}
      </div>

      {/* Heatmap controls */}
      {heatmapSrc && (
        <div className="w-full max-w-sm bg-gray-50 dark:bg-gray-800/60 p-3 rounded-xl border border-gray-200 dark:border-gray-700 space-y-2">
          <div className="flex items-center justify-between text-xs font-medium">
            <label className="flex items-center space-x-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showHeatmap}
                onChange={(e) => setShowHeatmap(e.target.checked)}
                className="rounded border-gray-300 text-brand-600 focus:ring-brand-500"
              />
              <span>{t("result.heatmapToggle")}</span>
            </label>
            <span className="text-gray-500 dark:text-gray-400">
              {Math.round(opacity * 100)}%
            </span>
          </div>

          {showHeatmap && (
            <input
              type="range"
              min="0.1"
              max="1.0"
              step="0.05"
              value={opacity}
              onChange={(e) => setOpacity(parseFloat(e.target.value))}
              aria-label={t("result.heatmapOpacity")}
              className="w-full accent-brand-600 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-lg cursor-pointer"
            />
          )}
        </div>
      )}
    </div>
  );
};

