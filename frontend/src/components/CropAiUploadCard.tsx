import React, { useRef, useState } from "react";
import { CROP_OPTIONS } from "@/data/cropKnowledge";

interface CropAiUploadCardProps {
  onAnalyze: (file: File) => void;
  isLoading: boolean;
  selectedFile: File | null;
  onClearFile: () => void;
  onFileSelect: (file: File) => void;
}

export const CropAiUploadCard: React.FC<CropAiUploadCardProps> = ({
  onAnalyze,
  isLoading,
  selectedFile,
  onClearFile,
  onFileSelect,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [selectedCrop, setSelectedCrop] = useState<string>("all");
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);

  // Sync preview when selectedFile changes
  React.useEffect(() => {
    if (selectedFile) {
      const url = URL.createObjectURL(selectedFile);
      setPreviewSrc(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setPreviewSrc(null);
    }
  }, [selectedFile]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileSelect(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleAnalyzeClick = () => {
    if (selectedFile) {
      onAnalyze(selectedFile);
    } else {
      fileInputRef.current?.click();
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto rounded-3xl overflow-hidden shadow-2xl border border-[#1b4d32] bg-[#0c2417] transition-all">
      {/* Header Container */}
      <div className="p-5 flex items-center space-x-3 text-white border-b border-[#1b4d32]">
        <div className="w-10 h-10 rounded-xl bg-[#143d26] border border-[#235f3d] flex items-center justify-center text-xl shadow-inner">
          🖼️
        </div>
        <div>
          <h2 className="text-base sm:text-lg font-black tracking-tight text-white">
            Upload Crop Photo
          </h2>
          <p className="text-[11px] sm:text-xs text-emerald-300/80">
            Works with leaves, stems, fruits — any part of the plant
          </p>
        </div>
      </div>

      {/* White Body Card */}
      <div className="bg-white p-5 sm:p-7 space-y-5 text-gray-900">
        {/* Crop Dropdown Section */}
        <div className="space-y-2">
          <label className="flex items-center space-x-1.5 text-xs font-bold text-gray-700 tracking-tight">
            <span>🌿</span>
            <span>SELECT CROP TYPE (OPTIONAL — HELPS IMPROVE ACCURACY)</span>
          </label>
          <div className="relative">
            <select
              value={selectedCrop}
              onChange={(e) => setSelectedCrop(e.target.value)}
              className="w-full py-3 px-4 pr-10 rounded-xl border border-gray-200 bg-gray-50 text-xs sm:text-sm font-semibold text-gray-800 appearance-none focus:outline-none focus:ring-2 focus:ring-[#22c55e] focus:bg-white shadow-sm cursor-pointer"
            >
              {CROP_OPTIONS.map((crop) => (
                <option key={crop.id} value={crop.id}>
                  {crop.emoji} {crop.name} {crop.hindi ? `(${crop.hindi})` : ""}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-gray-500 text-xs">
              ▼
            </div>
          </div>
          <p className="text-[11px] text-gray-500 leading-relaxed bg-amber-50/80 border border-amber-200/60 p-2.5 rounded-lg flex items-start space-x-1.5">
            <span>💡</span>
            <span>
              Pehle dropdown mein apni fasal / ped ka naam dekho (Hindi naam bhi diya hai), phir photo upload karo aur Analyze karo!
            </span>
          </p>
        </div>

        {/* Hidden inputs */}
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

        {/* Upload / Preview View */}
        {previewSrc ? (
          <div className="relative rounded-2xl overflow-hidden border border-gray-200 shadow-sm bg-black group aspect-[4/3] max-h-80 flex items-center justify-center">
            <img
              src={previewSrc}
              alt="Selected crop preview"
              className="w-full h-full object-contain"
            />
            {/* Delete / Clear button */}
            <button
              type="button"
              onClick={onClearFile}
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/70 hover:bg-black text-white flex items-center justify-center font-bold text-sm shadow-md transition active:scale-95"
              title="Remove image"
            >
              ✕
            </button>
          </div>
        ) : (
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-gray-300 hover:border-[#22c55e] rounded-2xl p-6 sm:p-8 text-center cursor-pointer transition-colors bg-gray-50 hover:bg-emerald-50/40 space-y-3"
          >
            <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-2xl mx-auto text-[#16a34a]">
              📷
            </div>
            <div>
              <p className="text-xs sm:text-sm font-bold text-gray-800">
                Click to browse photo or drag & drop here
              </p>
              <p className="text-[11px] text-gray-500 mt-1">
                JPEG, PNG, WebP up to 10 MB
              </p>
            </div>
            <div className="flex justify-center gap-2 pt-1" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[#16a34a] hover:bg-[#15803d] text-white shadow-sm"
              >
                📸 Camera
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold border border-gray-300 hover:bg-gray-100 text-gray-700"
              >
                📁 Browse
              </button>
            </div>
          </div>
        )}

        {/* Big Green Analyze Button */}
        <button
          type="button"
          onClick={handleAnalyzeClick}
          disabled={isLoading}
          className="w-full py-3.5 sm:py-4 px-6 rounded-2xl text-sm sm:text-base font-extrabold text-white bg-[#16a34a] hover:bg-[#22c55e] transition-all duration-200 shadow-lg shadow-emerald-600/30 flex items-center justify-center space-x-2 active:scale-[0.99] disabled:opacity-75 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Analyzing with AI...</span>
            </>
          ) : (
            <>
              <span>🔍</span>
              <span>Analyze with AI</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

