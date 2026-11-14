import React, { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { UploadCloud, Images, Plus, Trash2 } from "lucide-react";
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

  // Multi-image batch queue
  const [fileQueue, setFileQueue] = useState<{ file: File | Blob; preview: string; name: string }[]>([]);
  const [activeIndex, setActiveIndex] = useState<number>(0);

  const processAndQueueFiles = async (fileList: FileList | File[]) => {
    const newItems: { file: File | Blob; preview: string; name: string }[] = [];

    for (let i = 0; i < fileList.length; i++) {
      const rawFile = fileList[i];
      const val = validateImageFile(rawFile);
      if (!val.valid) {
        onError(val.errorMessage || t("errors.unsupportedFile"));
        continue;
      }

      try {
        const compressed = await compressImage(rawFile, 1280, 0.88);
        const url = URL.createObjectURL(compressed);
        newItems.push({
          file: compressed,
          preview: url,
          name: rawFile.name || `image_${i + 1}.jpg`,
        });
      } catch {
        const url = URL.createObjectURL(rawFile);
        newItems.push({
          file: rawFile,
          preview: url,
          name: rawFile.name || `image_${i + 1}.jpg`,
        });
      }
    }

    if (newItems.length > 0) {
      setFileQueue((prev) => {
        const updated = [...prev, ...newItems];
        // Select the newly added first item if none active
        return updated;
      });
      // Set active file immediately
      onFileSelect(newItems[0].file);
      setActiveIndex(fileQueue.length);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processAndQueueFiles(e.target.files);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processAndQueueFiles(e.dataTransfer.files);
    }
  };

  const handleSingleCapture = (file: File) => {
    processAndQueueFiles([file]);
  };

  const handleRemoveQueueItem = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = fileQueue.filter((_, i) => i !== index);
    setFileQueue(updated);

    if (updated.length === 0) {
      onClearFile();
      setActiveIndex(0);
    } else {
      const nextIdx = Math.max(0, index - 1);
      setActiveIndex(nextIdx);
      onFileSelect(updated[nextIdx].file);
    }
  };

  const handleSelectQueuedImage = (index: number) => {
    setActiveIndex(index);
    onFileSelect(fileQueue[index].file);
  };

  return (
    <div className="w-full max-w-xl mx-auto rounded-3xl overflow-hidden shadow-2xl border border-[#1b4d32] bg-[#0c2417] transition-all">
      {/* Header Container */}
      <div className="p-4 sm:p-5 flex items-center justify-between text-white border-b border-[#1b4d32] bg-gradient-to-r from-[#092215] to-[#0e301e]">
        <div className="flex items-center space-x-3">
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

        {/* Multi-image counter pill */}
        {fileQueue.length > 1 && (
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#16a34a] text-white shadow-sm">
            <Images className="w-3.5 h-3.5" />
            <span>{fileQueue.length} Images</span>
          </span>
        )}
      </div>

      {/* Inner Body (Dark Emerald Sunk Theme) */}
      <div className="p-5 sm:p-7 space-y-5 bg-[#081e13] text-gray-100">
        {/* Crop Selector */}
        <CropSelect selectedCrop={selectedCrop} onSelectCrop={onSelectCrop} />

        {/* Hidden Multiple File Picker */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="hidden"
          onChange={handleInputChange}
          disabled={isLoading}
        />

        {/* Multi-Image Thumbnail Carousel Reel */}
        {fileQueue.length > 1 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-emerald-300">
              <span>Queue ({fileQueue.length} photos ready)</span>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-emerald-400 hover:text-white flex items-center space-x-1 text-[11px]"
              >
                <Plus className="w-3 h-3" />
                <span>Add More</span>
              </button>
            </div>
            <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none">
              {fileQueue.map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => handleSelectQueuedImage(idx)}
                  className={`relative w-16 h-16 rounded-xl overflow-hidden border-2 cursor-pointer flex-shrink-0 transition-transform ${
                    activeIndex === idx
                      ? "border-[#22c55e] scale-105 shadow-md shadow-emerald-500/30"
                      : "border-gray-700 opacity-70 hover:opacity-100"
                  }`}
                >
                  <img src={item.preview} alt="queued" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={(e) => handleRemoveQueueItem(idx, e)}
                    className="absolute top-0.5 right-0.5 p-0.5 rounded-full bg-black/70 hover:bg-rose-600 text-white"
                  >
                    <Trash2 className="w-2.5 h-2.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Active Image Preview or Dropzone */}
        {previewUrl ? (
          <ImagePreview
            imageSrc={previewUrl}
            isLoading={isLoading}
            onRemove={() => {
              if (fileQueue.length > 0) {
                handleRemoveQueueItem(activeIndex, { stopPropagation: () => {} } as React.MouseEvent);
              } else {
                onClearFile();
              }
            }}
            onRetake={() => fileInputRef.current?.click()}
            onCancelAnalyze={onCancelAnalyze}
          />
        ) : (
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-[#1b4d32] hover:border-[#22c55e] rounded-2xl p-6 sm:p-8 text-center cursor-pointer transition-colors bg-[#0c281a]/50 hover:bg-[#0c281a]/90 space-y-3 select-none"
          >
            <div className="w-12 h-12 rounded-full bg-[#143d26] flex items-center justify-center text-2xl mx-auto text-[#22c55e]">
              <UploadCloud className="w-6 h-6" />
            </div>

            <div>
              <p className="text-xs sm:text-sm font-bold text-gray-200">
                {t("upload.dropzoneText")}
              </p>
              <p className="text-[11px] text-emerald-300/70 mt-1">
                Upload single or multiple images (JPEG, PNG, WebP up to 10 MB each)
              </p>
            </div>

            {/* Action Buttons: Native Camera & Multi-File Browse */}
            <div
              className="flex justify-center gap-2 pt-2"
              onClick={(e) => e.stopPropagation()}
            >
              <CameraButton onCapture={handleSingleCapture} disabled={isLoading} />
              <button
                type="button"
                disabled={isLoading}
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center space-x-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold border border-[#235f3d] bg-[#113521] hover:bg-[#1a4a2f] text-white shadow-sm transition active:scale-95 min-h-[44px]"
              >
                <Images className="w-4 h-4 text-[#22c55e]" />
                <span>Select Photos (Any Amount)</span>
              </button>
            </div>
          </div>
        )}

        {/* Empty state sample selector & dataset download links */}
        {!selectedFile && (
          <EmptyState
            onSelectSample={(sample) => processAndQueueFiles([sample])}
            disabled={isLoading}
          />
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
            <span>
              {fileQueue.length > 1
                ? `Analyze Image (${activeIndex + 1} of ${fileQueue.length})`
                : t("upload.analyzeAction")}
            </span>
          </button>
        )}
      </div>
    </div>
  );
};
