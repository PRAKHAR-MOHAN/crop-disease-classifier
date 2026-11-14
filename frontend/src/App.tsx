import React, { useState } from "react";
import { CropAiNavbar } from "@/components/CropAiNavbar";
import { CropAiHero } from "@/components/CropAiHero";
import { CropAiUploadCard } from "@/components/CropAiUploadCard";
import { CropAiResultCard } from "@/components/CropAiResultCard";
import { api, ApiError } from "@/api/client";
import { PredictionResponse } from "@/types/prediction";

export const App: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [currentImageSrc, setCurrentImageSrc] = useState<string | null>(null);
  const [currentPrediction, setCurrentPrediction] = useState<PredictionResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setErrorMessage(null);
  };

  const handleClearFile = () => {
    setSelectedFile(null);
    setCurrentImageSrc(null);
    setCurrentPrediction(null);
    setErrorMessage(null);
  };

  const handleAnalyze = async (file: File) => {
    setErrorMessage(null);
    setIsLoading(true);

    const previewUrl = URL.createObjectURL(file);
    setCurrentImageSrc(previewUrl);

    try {
      const pred = await api.predict(file);
      setCurrentPrediction(pred);
    } catch (err) {
      if (err instanceof ApiError) {
        setErrorMessage(err.detail);
      } else {
        setErrorMessage("Analysis failed. Please check network and try again.");
      }
      setCurrentPrediction(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setCurrentImageSrc(null);
    setCurrentPrediction(null);
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen bg-cropai-grid text-white font-sans flex flex-col justify-between selection:bg-[#22c55e] selection:text-black">
      {/* Top Navbar */}
      <CropAiNavbar />

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-6 space-y-8">
        {/* Hero Section */}
        {!currentPrediction && <CropAiHero />}

        {/* Error Notification */}
        {errorMessage && (
          <div className="max-w-xl mx-auto p-4 rounded-2xl bg-rose-950/80 border border-rose-700 text-rose-200 text-xs sm:text-sm font-semibold flex items-center justify-between shadow-lg">
            <span>❌ {errorMessage}</span>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-rose-400 hover:text-white text-xs px-2"
            >
              ✕
            </button>
          </div>
        )}

        {/* View Mode: Upload Card or Result Card */}
        {currentPrediction && currentImageSrc ? (
          <CropAiResultCard
            prediction={currentPrediction}
            originalImageSrc={currentImageSrc}
            onReset={handleReset}
          />
        ) : (
          <CropAiUploadCard
            onAnalyze={handleAnalyze}
            isLoading={isLoading}
            selectedFile={selectedFile}
            onClearFile={handleClearFile}
            onFileSelect={handleFileSelect}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="w-full py-6 text-center text-xs text-gray-500 border-t border-[#133823]/60">
        <p className="font-semibold text-gray-400">
          🌾 CropAI &bull; AI Plant Pathology Diagnostic System
        </p>
        <p className="text-[11px] text-gray-600 mt-1">
          Trained on 56,000+ Leaf Images &bull; Calibrated ONNX EfficientNetV2-S &bull; Free for Farmers Worldwide
        </p>
      </footer>
    </div>
  );
};

export default App;
