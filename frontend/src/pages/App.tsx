import React, { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Sidebar, NavTab } from "../components/Sidebar";
import { TopHeader } from "../components/TopHeader";
import { StationOverview } from "../components/StationOverview";
import { DiagnosticView } from "../components/DiagnosticView";
import { FieldStationsView } from "../components/FieldStationsView";
import { DiseaseAlertsView } from "../components/DiseaseAlertsView";
import { PathogenLibraryView } from "../components/PathogenLibraryView";
import { ScanHistoryView } from "../components/ScanHistoryView";
import { StationConfigView } from "../components/StationConfigView";
import { AuthModal, UserSession } from "../components/AuthModal";
import { STATIONS, StationInfo, RECENT_ALERTS } from "../data/stationData";
import { usePredictMutation, useHealthQuery } from "../api/hooks";
import { PredictionResponse, HistoryItem } from "../api/types";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const MAX_HISTORY = 15;

const CropGuardMain: React.FC = () => {
  const { t } = useTranslation();

  // Navigation and Station Selection State
  const [currentTab, setCurrentTab] = useState<NavTab>("overview");
  const [selectedStation, setSelectedStation] = useState<StationInfo>(STATIONS[0]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // User session state
  const [userSession, setUserSession] = useState<UserSession | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const stored = localStorage.getItem("cropguard_user");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  // Diagnostic / Classifier State
  const [selectedCrop, setSelectedCrop] = useState<string>("all");
  const [selectedFile, setSelectedFile] = useState<File | Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [currentPrediction, setCurrentPrediction] = useState<PredictionResponse | null>(null);
  const [clientError, setClientError] = useState<string | null>(null);

  // History State
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
  const healthQuery = useHealthQuery();

  // Lock dark palette to document element
  useEffect(() => {
    document.documentElement.classList.add("dark");
    document.documentElement.style.backgroundColor = "#070e19";
    document.body.style.backgroundColor = "#070e19";
  }, []);

  const handleLogin = (session: UserSession) => {
    setUserSession(session);
    try {
      localStorage.setItem("cropguard_user", JSON.stringify(session));
    } catch {
      // Storage error
    }
  };

  const handleLogout = () => {
    setUserSession(null);
    localStorage.removeItem("cropguard_user");
  };

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
    }
  };

  const handleCancelAnalyze = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  };

  const handleResetDiagnostic = () => {
    handleClearFile();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSelectHistoryItem = (item: HistoryItem) => {
    setPreviewUrl(item.thumbnail);
    setCurrentPrediction(item.prediction);
    setSelectedFile(null);
    setClientError(null);
    setCurrentTab("diagnostic");
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

  // Tab Title & Subtitle Mapping
  const tabMetadata: Record<NavTab, { title: string; subtitle: string }> = {
    overview: {
      title: "Station Intelligence",
      subtitle: "Monitor foliar telemetry, canopy microclimates, and evaluate crop disease risk index.",
    },
    diagnostic: {
      title: "Leaf Diagnostic & Neural Classifier",
      subtitle: "High-precision AI foliar pathology screening with calibrated temperature scaling and Grad-CAM.",
    },
    stations: {
      title: "Field Stations & Sensor Mesh",
      subtitle: "Active telemetry pods distributed across agricultural plots and polyhouses.",
    },
    alerts: {
      title: "Disease Anomaly & Outbreak Feed",
      subtitle: "Live feed of detected fungal, bacterial, and viral crop pathologies.",
    },
    analytics: {
      title: "Microclimate & Spore Analytics",
      subtitle: "Multi-axis time-series correlating foliar wetness and temperature with pathogen pressure.",
    },
    library: {
      title: "Pathogen Encyclopedia",
      subtitle: "Clinical pathology profiles, Latin taxon references, and agronomic treatment guides.",
    },
    history: {
      title: "Field Diagnostic Audit Logs",
      subtitle: "Complete archive of scanned crop samples, confidence scores, and action plans.",
    },
    settings: {
      title: "Station & Inference Configuration",
      subtitle: "Telemetry poll frequencies, model uncertainty thresholds, and alert dispatches.",
    },
  };

  return (
    <div className="min-h-screen bg-[#070e19] text-slate-100 font-sans selection:bg-cyan-500 selection:text-slate-950 flex">
      {/* Sidebar Navigation */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        alertCount={RECENT_ALERTS.length}
        userSession={userSession}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onLogout={handleLogout}
        isOpenMobile={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64 transition-all">
        {/* Top Header */}
        <TopHeader
          currentTabName={tabMetadata[currentTab].title}
          currentSubtitle={tabMetadata[currentTab].subtitle}
          selectedStation={selectedStation}
          onSelectStation={setSelectedStation}
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          alertCount={RECENT_ALERTS.length}
          onOpenAlerts={() => setCurrentTab("alerts")}
          userSession={userSession}
          onOpenAuth={() => setIsAuthModalOpen(true)}
          backendOnline={Boolean(healthQuery.data?.model_loaded)}
        />

        {/* Tab View Routing */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {currentTab === "overview" && (
            <StationOverview
              station={selectedStation}
              onNavigateToDiagnostic={() => setCurrentTab("diagnostic")}
            />
          )}

          {currentTab === "diagnostic" && (
            <DiagnosticView
              selectedCrop={selectedCrop}
              onSelectCrop={setSelectedCrop}
              selectedFile={selectedFile}
              previewUrl={previewUrl}
              isLoading={predictMutation.isPending}
              onFileSelect={handleFileSelect}
              onClearFile={handleClearFile}
              onAnalyze={handleAnalyze}
              onCancelAnalyze={handleCancelAnalyze}
              onError={(msg) => setClientError(msg)}
              currentPrediction={currentPrediction}
              onReset={handleResetDiagnostic}
              error={predictMutation.error || (clientError ? new Error(clientError) : null)}
              onDismissError={() => {
                setClientError(null);
                predictMutation.reset();
              }}
            />
          )}

          {currentTab === "stations" && (
            <FieldStationsView
              selectedStation={selectedStation}
              onSelectStation={setSelectedStation}
              onNavigateToDiagnostic={() => setCurrentTab("diagnostic")}
            />
          )}

          {currentTab === "alerts" && (
            <DiseaseAlertsView
              onDiagnoseClass={() => setCurrentTab("diagnostic")}
            />
          )}

          {currentTab === "analytics" && (
            <StationOverview
              station={selectedStation}
              onNavigateToDiagnostic={() => setCurrentTab("diagnostic")}
            />
          )}

          {currentTab === "library" && <PathogenLibraryView />}

          {currentTab === "history" && (
            <ScanHistoryView
              history={history}
              onSelectHistoryItem={handleSelectHistoryItem}
              onClearHistory={handleClearHistory}
            />
          )}

          {currentTab === "settings" && <StationConfigView />}
        </main>
      </div>

      {/* Operator Authentication Modal (SkyGuard Sign In) */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLogin={handleLogin}
        currentUser={userSession}
      />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <CropGuardMain />
    </QueryClientProvider>
  );
};

export default App;
