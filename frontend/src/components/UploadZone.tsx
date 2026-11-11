import React, { useRef, useState } from "react";
import { useTranslation } from "react-i18next";

interface UploadZoneProps {
  onImageSelected: (file: File) => void;
  isLoading: boolean;
}

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
      className={`border-2 border-dashed rounded-2xl p-6 sm:p-10 text-center transition ${
        isDragOver
          ? "border-brand-500 bg-brand-50/50 dark:bg-brand-950/20"
          : "border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900"
      }`}
    >
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
        <div className="py-8 flex flex-col items-center justify-center space-y-3">
          <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
            {t("upload.analyzing")}
          </p>
        </div>
      ) : (
        <div className="flex flex-col items-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-brand-100 dark:bg-brand-900/40 flex items-center justify-center text-3xl">
            📷
          </div>
          <div>
            <p className="text-base font-semibold text-gray-800 dark:text-gray-200">
              {t("upload.dropzoneText")}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {t("upload.fileHint")}
            </p>
          </div>

          {/* Action buttons (accessible on mobile & desktop) */}
          <div className="flex flex-wrap gap-2 justify-center pt-2">
            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              className="inline-flex items-center px-4 py-2 rounded-xl text-xs font-semibold bg-brand-600 hover:bg-brand-700 text-white shadow-sm transition active:scale-95"
            >
              📸 {t("upload.cameraBtn")}
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center px-4 py-2 rounded-xl text-xs font-semibold border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200 transition active:scale-95"
            >
              📁 {t("upload.browseBtn")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

