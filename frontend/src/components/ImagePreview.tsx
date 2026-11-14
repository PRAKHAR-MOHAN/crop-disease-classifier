import React from "react";
import { X, RefreshCw } from "lucide-react";
import { useTranslation } from "react-i18next";

interface ImagePreviewProps {
  imageSrc: string;
  isLoading: boolean;
  onRemove: () => void;
  onRetake: () => void;
  onCancelAnalyze?: () => void;
}

export const ImagePreview: React.FC<ImagePreviewProps> = ({
  imageSrc,
  isLoading,
  onRemove,
  onRetake,
  onCancelAnalyze,
}) => {
  const { t } = useTranslation();

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-black aspect-[4/3] max-h-80 flex items-center justify-center shadow-inner group">
      {/* Base Image */}
      <img
        src={imageSrc}
        alt="Uploaded leaf"
        className="w-full h-full object-contain"
      />

      {/* Action Buttons Top Bar (when not loading) */}
      {!isLoading && (
        <div className="absolute top-3 right-3 flex items-center space-x-2">
          <button
            type="button"
            onClick={onRetake}
            className="p-2 rounded-xl bg-black/70 hover:bg-black text-white text-xs font-semibold backdrop-blur-md flex items-center space-x-1 shadow-md transition active:scale-95 min-h-[36px]"
            title={t("upload.retakeBtn")}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t("upload.retakeBtn")}</span>
          </button>
          <button
            type="button"
            onClick={onRemove}
            className="w-9 h-9 rounded-xl bg-black/70 hover:bg-rose-600 text-white flex items-center justify-center font-bold text-sm backdrop-blur-md shadow-md transition active:scale-95"
            title={t("upload.removeBtn")}
            aria-label={t("upload.removeBtn")}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Loading Scanning Animation Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex flex-col items-center justify-center p-4 text-center space-y-4">
          {/* Animated Laser Scanning Line */}
          <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-[#22c55e] to-transparent shadow-[0_0_15px_#22c55e] animate-bounce" />

          <div className="relative">
            <div className="w-14 h-14 rounded-full border-4 border-[#22c55e]/20 border-t-[#22c55e] animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center text-xl">
              🌱
            </div>
          </div>

          <div className="space-y-1">
            <p className="text-sm font-bold text-white drop-shadow">
              {t("upload.analyzing")}
            </p>
            <p className="text-xs text-emerald-300 font-mono">
              {t("upload.analyzingSub")}
            </p>
          </div>

          {onCancelAnalyze && (
            <button
              type="button"
              onClick={onCancelAnalyze}
              className="mt-2 px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-200 bg-rose-950/70 border border-rose-800 hover:bg-rose-900 transition active:scale-95"
            >
              {t("upload.cancelBtn")}
            </button>
          )}
        </div>
      )}
    </div>
  );
};
