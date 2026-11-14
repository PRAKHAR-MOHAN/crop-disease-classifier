import React, { useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Header } from "@/components/Header";
import { UploadCard } from "@/components/UploadCard";
import { ResultCard } from "@/components/ResultCard";
import { GradCamViewer } from "@/components/GradCamViewer";
import { AdvicePanel } from "@/components/AdvicePanel";
import { FeedbackBox } from "@/components/FeedbackBox";
import { HistoryDrawer } from "@/components/HistoryDrawer";
import { PhotoTips } from "@/components/PhotoTips";
import { ErrorState } from "@/components/ErrorState";
import { ResultSkeleton } from "@/components/Skeletons";
import { StickyBottomBar } from "@/components/StickyBottomBar";
import { useDarkMode } from "@/hooks/useDarkMode";
import { usePredictMutation } from "@/api/hooks";
import { PredictionResponse, HistoryItem } from "@/api/types";
import { parseClassName } from "@/lib/parseClassName";
import { PATHOGEN_DETAILS } from "@/data/cropKnowledge";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const MAX_HISTORY = 10;

const CropAiApp: React.FC = () => {
  const { t } = useTranslation();
  const { isDark, toggle: toggleTheme } = useDarkMode();

  const [selectedCrop, setSelectedCrop] = useState<string>("all");
  const [selectedFile, setSelectedFile] = useState<File | Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [currentPrediction, setCurrentPrediction] = useState<PredictionResponse | null>(null);
  const [clientError, setClientError] = useState<string | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // Scan history stored in localStorage
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const stored = localStorage.getItem("cropai_history");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const abortControllerRef = useRef<AbortController | null>(null);
  const predictMutation = usePredictMutation();

  const handleFileSelect = (file: File | Blob) => {
    setSelectedFile(file);
    setClientError(null);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const handleClearFile = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    setCurrentPrediction(null);
    setClientError(null);
  };

  const handleAnalyze = async () => {
    if (!selectedFile) return;

    setClientError(null);
    abortControllerRef.current = new AbortController();

    try {
      const result = await predictMutation.mutateAsync({
        file: selectedFile,
        signal: abortControllerRef.current.signal,
      });

      setCurrentPrediction(result);

      // Save to history with small thumbnail
      if (previewUrl) {
        const historyEntry: HistoryItem = {
          id: result.request_id || String(Date.now()),
          timestamp: Date.now(),
          prediction: result,
          thumbnail: previewUrl,
        };
        setHistory((prev) => {
          const updated = [historyEntry, ...prev.filter((h) => h.id !== historyEntry.id)].slice(
            0,
            MAX_HISTORY
          );
          try {
            localStorage.setItem("cropai_history", JSON.stringify(updated));
          } catch {
            // Storage quota
          }
          return updated;
        });
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") {
        setClientError(t("errors.aborted"));
      }
      // Mutation handles ApiError
    }
  };

  const handleCancelAnalyze = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  };

  const handleReset = () => {
    handleClearFile();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSelectHistory = (item: HistoryItem) => {
    setPreviewUrl(item.thumbnail);
    setCurrentPrediction(item.prediction);
    setSelectedFile(null);
    setClientError(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleClearHistory = () => {
    setHistory([]);
    try {
      localStorage.removeItem("cropai_history");
    } catch {
      // Storage error
    }
  };

  const parsedCurrent = currentPrediction ? parseClassName(currentPrediction.label) : null;
  const currentKnowledge = currentPrediction ? PATHOGEN_DETAILS[currentPrediction.label] : null;

  return (
    <div className="min-h-screen bg-cropai-grid text-gray-100 flex flex-col justify-between font-sans selection:bg-[#22c55e] selection:text-black transition-colors">
      {/* Header */}
      <Header
        isDark={isDark}
        onToggleTheme={toggleTheme}
        onOpenHistory={() => setIsHistoryOpen(true)}
        historyCount={history.length}
      />

      {/* Main Content */}
      <main className="flex-1 w-full max-w-4xl mx-auto px-4 py-5 sm:py-7 space-y-6">
        {/* Compact Hero (Mobile-first, positioned to keep Upload Card above the fold) */}
        {!currentPrediction && (
          <div className="text-center space-y-3 pt-1 pb-1">
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-[#0c2417] text-[#22c55e] border border-[#1b4d32] shadow-xs">
              <span className="w-2 h-2 rounded-full bg-[#22c55e] animate-ping" />
              <span>{t("hero.liveBadge")}</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-[1.1] text-white">
              {t("hero.title1")} {t("hero.title2")}{" "}
              <span className="text-[#22c55e] drop-shadow-[0_0_20px_rgba(34,197,94,0.4)]">
                {t("hero.title3")}
              </span>{" "}
              {t("hero.title4")}
            </h1>

            <p className="text-xs sm:text-sm text-gray-300 max-w-md mx-auto leading-relaxed">
              {t("hero.subtitle")}
            </p>

            {/* Feature Pills */}
            <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1">
              <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-white/80 dark:bg-[#0c2417] border border-gray-200 dark:border-[#1b4d32] text-gray-700 dark:text-gray-300">
                🤖 {t("hero.chipAi")}
              </span>
              <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-white/80 dark:bg-[#0c2417] border border-gray-200 dark:border-[#1b4d32] text-gray-700 dark:text-gray-300">
                ⚡ {t("hero.chipInstant")}
              </span>
              <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-white/80 dark:bg-[#0c2417] border border-gray-200 dark:border-[#1b4d32] text-gray-700 dark:text-gray-300">
                🟢 {t("hero.chipClasses")}
              </span>
              <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-white/80 dark:bg-[#0c2417] border border-gray-200 dark:border-[#1b4d32] text-gray-700 dark:text-gray-300">
                🆓 {t("hero.chipFree")}
              </span>
            </div>
          </div>
        )}

        {/* Error State Banner */}
        {(predictMutation.error || clientError) && (
          <ErrorState
            error={predictMutation.error || new Error(clientError || "")}
            onRetry={handleAnalyze}
            onDismiss={() => {
              setClientError(null);
              predictMutation.reset();
            }}
          />
        )}

        {/* Upload Card or Skeletons or Results View */}
        {predictMutation.isPending ? (
          <ResultSkeleton />
        ) : currentPrediction && previewUrl ? (
          <div className="space-y-6 animate-in fade-in duration-300 pb-16 sm:pb-4">
            {/* 1. Primary Result Diagnosis Card */}
            <ResultCard
              prediction={currentPrediction}
              onReset={handleReset}
            />

            {/* 2. Visual Explainability (Grad-CAM) */}
            <GradCamViewer
              originalSrc={previewUrl}
              gradcamBase64={currentPrediction.gradcam}
            />

            {/* 3. Agronomic Treatment Protocol */}
            <AdvicePanel
              advice={currentPrediction.advice}
              cropDisplayName={parsedCurrent?.displayName || "Crop"}
              isHealthy={parsedCurrent?.isHealthy || false}
              farmersAdvice={currentKnowledge?.farmersAdvice}
            />

            {/* 4. Feedback Mechanism */}
            <FeedbackBox
              requestId={currentPrediction.request_id}
              predictedLabel={currentPrediction.label}
            />
          </div>
        ) : (
          <div className="space-y-4">
            <UploadCard
              selectedCrop={selectedCrop}
              onSelectCrop={setSelectedCrop}
              selectedFile={selectedFile}
              previewUrl={previewUrl}
              isLoading={predictMutation.isPending}
              onFileSelect={handleFileSelect}
              onClearFile={handleClearFile}
              onAnalyze={handleAnalyze}
              onCancelAnalyze={handleCancelAnalyze}
              onError={setClientError}
            />

            {/* Photo taking tips accordion */}
            <PhotoTips />
          </div>
        )}
      </main>

      {/* Sticky Bottom Action Bar for Mobile Thumb Usage */}
      {currentPrediction && (
        <StickyBottomBar
          onScanAnother={handleReset}
          title={parsedCurrent?.displayName || "Crop Diagnosis"}
        />
      )}

      {/* Slide-over Scan History Drawer */}
      <HistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={history}
        onSelect={handleSelectHistory}
        onClear={handleClearHistory}
      />

      {/* Footer */}
      <footer className="w-full py-5 text-center text-xs text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-[#164429]/60 px-4 space-y-1">
        <p className="font-bold text-gray-700 dark:text-gray-300">
          🌾 CropAI &bull; Production Crop Disease & Pest Diagnostic Engine
        </p>
        <p className="text-[11px] text-gray-400 dark:text-gray-500">
          {t("footer.disclaimer")}
        </p>
      </footer>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <CropAiApp />
    </QueryClientProvider>
  );
};

export default App;

