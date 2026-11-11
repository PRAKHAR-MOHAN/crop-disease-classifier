import React, { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { UploadZone } from "@/components/UploadZone";
import { GradCamViewer } from "@/components/GradCamViewer";
import { ResultCard } from "@/components/ResultCard";
import { AdviceCard } from "@/components/AdviceCard";
import { FeedbackWidget } from "@/components/FeedbackWidget";
import { HistoryDrawer } from "@/components/HistoryDrawer";
import { useDarkMode } from "@/hooks/useDarkMode";
import { usePredictionHistory } from "@/hooks/usePredictionHistory";
import { api, ApiError } from "@/api/client";
import { PredictionResponse, HistoryItem } from "@/types/prediction";

export const App: React.FC = () => {
  const { isDark, toggle: toggleDark } = useDarkMode();
  const { history, addEntry, clearHistory } = usePredictionHistory();

  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [currentImageSrc, setCurrentImageSrc] = useState<string | null>(null);
  const [currentPrediction, setCurrentPrediction] = useState<PredictionResponse | null>(null);
  const [availableClasses, setAvailableClasses] = useState<string[]>([]);

  // Fetch available classes once on load for the feedback dropdown
  useEffect(() => {
    api
      .getClasses()
      .then((res) => setAvailableClasses(res.classes))
      .catch((err) => console.warn("Could not fetch classes list:", err));
  }, []);

  const handleImageSelected = async (file: File) => {
    setErrorMessage(null);
    setIsLoading(true);

    // Create local object URL for preview
    const previewUrl = URL.createObjectURL(file);
    setCurrentImageSrc(previewUrl);

    try {
      const pred = await api.predict(file);
      setCurrentPrediction(pred);

      // Create a small data URL thumbnail for history
      const reader = new FileReader();
      reader.onload = () => {
        addEntry(pred, reader.result as string);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      if (err instanceof ApiError) {
        setErrorMessage(err.detail);
      } else {
        setErrorMessage("Upload or prediction failed. Please try again.");
      }
      setCurrentPrediction(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectHistory = (item: HistoryItem) => {
    setCurrentImageSrc(item.thumbnail);
    setCurrentPrediction(item.prediction);
    setErrorMessage(null);
  };

  const isHealthy =
    currentPrediction?.label.toLowerCase().includes("healthy") ?? false;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-gray-100 transition-colors">
      <Header
        isDark={isDark}
        onToggleDark={toggleDark}
        onOpenHistory={() => setIsHistoryOpen(true)}
        historyCount={history.length}
      />

      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Upload Zone */}
        <UploadZone onImageSelected={handleImageSelected} isLoading={isLoading} />

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs sm:text-sm font-medium flex items-center justify-between">
            <span>❌ {errorMessage}</span>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-rose-500 hover:text-rose-700 text-xs px-2"
            >
              ✕
            </button>
          </div>
        )}

        {/* Prediction Results & Grad-CAM */}
        {currentPrediction && currentImageSrc && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            {/* Visual Column: Original + Grad-CAM Heatmap Overlay */}
            <div className="space-y-4">
              <GradCamViewer
                originalSrc={currentImageSrc}
                gradcamBase64={currentPrediction.gradcam}
              />
              <FeedbackWidget
                requestId={currentPrediction.request_id}
                predictedLabel={currentPrediction.label}
                availableClasses={availableClasses}
              />
            </div>

            {/* Info Column: Diagnosis Card + Treatment Advice */}
            <div className="space-y-4">
              <ResultCard prediction={currentPrediction} />
              <AdviceCard
                advice={currentPrediction.advice}
                isHealthy={isHealthy}
              />
            </div>
          </div>
        )}
      </main>

      {/* History Slide-over Drawer */}
      <HistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={history}
        onSelect={handleSelectHistory}
        onClear={clearHistory}
      />

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-gray-800 py-4 text-center text-xs text-gray-400">
        Crop Disease & Pest Classifier &bull; PyTorch + timm + ONNX Runtime + FastAPI + React
      </footer>
    </div>
  );
};

export default App;

