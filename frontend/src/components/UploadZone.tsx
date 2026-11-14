import React, { useRef, useState } from "react";
import { useTranslation } from "react-i18next";

interface UploadZoneProps {
  onImageSelected: (file: File) => void;
  isLoading: boolean;
}

const SUPPORTED_CROPS = [
  { name: "Tomato", emoji: "🍅" },
  { name: "Potato", emoji: "🥔" },
  { name: "Apple", emoji: "🍎" },
  { name: "Corn", emoji: "🌽" },
  { name: "Grape", emoji: "🍇" },
  { name: "Pepper", emoji: "🫑" },
  { name: "Strawberry", emoji: "🍓" },
  { name: "Squash", emoji: "🎃" },
];

export const UploadZone: React.FC<UploadZoneProps> = ({ onImageSelected, isLoading }) => {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onImageSelected(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onImageSelected(e.dataTransfer.files[0]);
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`relative overflow-hidden rounded-3xl p-8 sm:p-12 text-center transition-all duration-300 border-2 ${
        isDragOver
          ? "border-brand-500 bg-brand-500/10 scale-[1.01] shadow-2xl shadow-brand-500/20"
          : "border-dashed border-gray-300 dark:border-gray-700/80 bg-white/70 dark:bg-gray-900/60 backdrop-blur-md shadow-lg hover:border-brand-400 dark:hover:border-brand-500"
      }`}
    >
      {/* Ambient background decoration */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-gradient-to-b from-brand-400/10 via-transparent to-transparent blur-2xl pointer-events-none" />

      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/bmp"
        className="hidden"
        onChange={handleFileChange}
        disabled={isLoading}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileChange}
        disabled={isLoading}
      />

      {isLoading ? (
        <div className="py-10 flex flex-col items-center justify-center space-y-4">
          <div className="relative">
            <div className="w-14 h-14 border-4 border-brand-500/20 border-t-brand-500 rounded-full animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center text-xl">
              🌱
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-base font-bold text-gray-900 dark:text-white">
              {t("upload.analyzing")}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">
              Running ONNX EfficientNetV2-S + Grad-CAM saliency...
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center space-y-5">
          {/* Pulsing Icon */}
          <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-brand-500 to-teal-400 p-0.5 shadow-xl shadow-brand-500/20 group-hover:scale-105 transition-transform duration-300">
              <div className="w-full h-full bg-white dark:bg-gray-900 rounded-[14px] flex items-center justify-center text-4xl">
                📷
              </div>
            </div>
            <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-brand-500 text-white text-xs flex items-center justify-center font-bold shadow-md">
              +
            </span>
          </div>

          {/* Heading */}
          <div className="max-w-md">
            <h3 className="text-lg sm:text-xl font-extrabold text-gray-900 dark:text-white tracking-tight">
              {t("upload.dropzoneText")}
            </h3>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1.5 leading-relaxed">
              Upload a clear leaf close-up or take a live photo in the field.
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-3 justify-center pt-1">
            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold bg-gradient-to-r from-brand-600 to-emerald-600 hover:from-brand-500 hover:to-emerald-500 text-white shadow-lg shadow-brand-600/30 transition-all duration-200 active:scale-95"
            >
              <span>📸</span>
              <span>{t("upload.cameraBtn")}</span>
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750 text-gray-800 dark:text-gray-100 border border-gray-200 dark:border-gray-700 shadow-sm transition-all duration-200 active:scale-95"
            >
              <span>📁</span>
              <span>{t("upload.browseBtn")}</span>
            </button>
          </div>

          {/* Supported crops strip */}
          <div className="pt-4 border-t border-gray-200/60 dark:border-gray-800/80 w-full max-w-lg">
            <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2.5">
              Supported Crop Pathologies (38 Classes)
            </p>
            <div className="flex flex-wrap items-center justify-center gap-1.5">
              {SUPPORTED_CROPS.map((crop) => (
                <span
                  key={crop.name}
                  className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-gray-100/80 dark:bg-gray-800/80 text-gray-700 dark:text-gray-300 border border-gray-200/60 dark:border-gray-700/60"
                >
                  <span>{crop.emoji}</span>
                  <span>{crop.name}</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
