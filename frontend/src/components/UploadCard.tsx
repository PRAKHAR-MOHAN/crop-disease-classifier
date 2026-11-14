import React, { useRef } from "react";
import { useTranslation } from "react-i18next";
import { UploadCloud, FolderOpen } from "lucide-react";
import { CropSelect } from "./CropSelect";
import { CameraButton } from "./CameraButton";
import { ImagePreview } from "./ImagePreview";
import { EmptyState } from "./EmptyState";
import { validateImageFile, compressImage } from "@/lib/imageCompress";

interface UploadCardProps {
  selectedCrop: string;
  onSelectCrop: (cropId: string) => void;
  selectedFile: File | Blob | null;
  previewUrl: string | null;
  isLoading: boolean;
  onFileSelect: (file: File | Blob) => void;
  onClearFile: () => void;
  onAnalyze: () => void;
  onCancelAnalyze?: () => void;
  onError: (msg: string) => void;
}

export const UploadCard: React.FC<UploadCardProps> = ({
  selectedCrop,
  onSelectCrop,
  selectedFile,
  previewUrl,
  isLoading,
  onFileSelect,
  onClearFile,
  onAnalyze,
  onCancelAnalyze,
  onError,
}) => {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processAndSetFile = async (rawFile: File | Blob) => {
    const val = validateImageFile(rawFile);
    if (!val.valid) {
      onError(val.errorMessage || t("errors.unsupportedFile"));
      return;
    }

    try {
      // Client-side resize and compression to max 1280px
      const compressed = await compressImage(rawFile, 1280, 0.88);
      onFileSelect(compressed);
    } catch {
      onFileSelect(rawFile);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processAndSetFile(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processAndSetFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto rounded-3xl overflow-hidden shadow-2xl border border-gray-200 dark:border-[#1b4d32] bg-white dark:bg-[#0c2417] transition-all">
      {/* Header Container */}
      <div className="p-4 sm:p-5 flex items-center space-x-3 text-white border-b border-emerald-900/40 bg-gradient-to-r from-[#092215] to-[#0e301e]">
        <div className="w-10 h-10 rounded-xl bg-[#143d26] border border-[#235f3d] flex items-center justify-center text-xl shadow-inner flex-shrink-0">
          🖼️
        </div>
        <div>
          <h2 className="text-base sm:text-lg font-black tracking-tight text-white">
            {t("upload.headerTitle")}
          </h2>
          <p className="text-[11px] sm:text-xs text-emerald-300/80">
            {t("upload.headerSubtitle")}
          </p>
        </div>
      </div>

      {/* Inner Body */}
      <div className="p-5 sm:p-7 space-y-5 text-gray-900 dark:text-gray-100">
        {/* Crop Selector */}
        <CropSelect selectedCrop={selectedCrop} onSelectCrop={onSelectCrop} />

        {/* Hidden File Picker */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleInputChange}
          disabled={isLoading}
        />

        {/* Image Preview or Dropzone */}
        {previewUrl ? (
          <ImagePreview
            imageSrc={previewUrl}
            isLoading={isLoading}
            onRemove={onClearFile}
            onRetake={() => fileInputRef.current?.click()}
            onCancelAnalyze={onCancelAnalyze}
          />
        ) : (
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-gray-300 dark:border-gray-700 hover:border-[#22c55e] dark:hover:border-[#22c55e] rounded-2xl p-6 sm:p-8 text-center cursor-pointer transition-colors bg-gray-50/70 dark:bg-gray-900/40 hover:bg-emerald-50/40 dark:hover:bg-emerald-950/20 space-y-3 select-none"
          >
            <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center text-2xl mx-auto text-[#16a34a]">
              <UploadCloud className="w-6 h-6" />
            </div>

            <div>
              <p className="text-xs sm:text-sm font-bold text-gray-800 dark:text-gray-200">
                {t("upload.dropzoneText")}
              </p>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
                {t("upload.fileHint")}
              </p>
            </div>

            {/* Action Buttons: Native Camera & Browse File */}
            <div
              className="flex justify-center gap-2 pt-2"
              onClick={(e) => e.stopPropagation()}
            >
              <CameraButton onCapture={processAndSetFile} disabled={isLoading} />
              <button
                type="button"
                disabled={isLoading}
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center space-x-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200 shadow-sm transition active:scale-95 min-h-[44px]"
              >
                <FolderOpen className="w-4 h-4" />
                <span>{t("upload.browseBtn")}</span>
              </button>
            </div>
          </div>
        )}

        {/* Empty state sample selector if no image yet */}
        {!selectedFile && (
          <EmptyState onSelectSample={processAndSetFile} disabled={isLoading} />
        )}

        {/* Big Green CTA Analyze Button */}
        {selectedFile && !isLoading && (
          <button
            type="button"
            onClick={onAnalyze}
            disabled={isLoading}
            className="w-full py-4 px-6 rounded-2xl text-base font-extrabold text-white bg-[#16a34a] hover:bg-[#22c55e] transition-all duration-200 shadow-lg shadow-emerald-600/30 flex items-center justify-center space-x-2 active:scale-[0.99] min-h-[48px] cursor-pointer"
          >
            <span>🔍</span>
            <span>{t("upload.analyzeAction")}</span>
          </button>
        )}
      </div>
    </div>
  );
};
