import React from "react";
import { UploadCard } from "./UploadCard";
import { ResultCard } from "./ResultCard";
import { GradCamViewer } from "./GradCamViewer";
import { AdvicePanel } from "./AdvicePanel";
import { FeedbackBox } from "./FeedbackBox";
import { PhotoTips } from "./PhotoTips";
import { ErrorState } from "./ErrorState";
import { ResultSkeleton } from "./Skeletons";
import { StickyBottomBar } from "./StickyBottomBar";
import { PredictionResponse } from "../api/types";
import { parseClassName } from "../lib/parseClassName";
import { PATHOGEN_DETAILS } from "../data/cropKnowledge";
import { Sprout, Sparkles, Zap } from "lucide-react";

interface DiagnosticViewProps {
  selectedCrop: string;
  onSelectCrop: (crop: string) => void;
  selectedFile: File | Blob | null;
  previewUrl: string | null;
  isLoading: boolean;
  onFileSelect: (file: File | Blob) => void;
  onClearFile: () => void;
  onAnalyze: () => void;
  onCancelAnalyze: () => void;
  onError: (msg: string) => void;
  currentPrediction: PredictionResponse | null;
  onReset: () => void;
  error: Error | null;
  onDismissError: () => void;
}

export const DiagnosticView: React.FC<DiagnosticViewProps> = ({
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
  currentPrediction,
  onReset,
  error,
  onDismissError,
}) => {
  const parsedCurrent = currentPrediction ? parseClassName(currentPrediction.label) : null;
  const currentKnowledge = currentPrediction ? PATHOGEN_DETAILS[currentPrediction.label] : null;

  return (
    <div className="space-y-6">
      {/* Station Diagnostic Header Pill */}
      <div className="p-4 rounded-2xl border border-[#173050] bg-gradient-to-r from-[#0c1a2e] to-[#091728] shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-950/80 border border-cyan-800 flex items-center justify-center text-cyan-400 flex-shrink-0">
            <Sprout className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-base font-black text-white flex items-center gap-2">
              <span>Foliar Disease & Pest Neural Classifier</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-950 text-cyan-300 border border-cyan-800">
                EfficientNetV2-S ONNX
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Upload or snap a photo of any leaf, stem, or fruit for temperature-calibrated diagnosis & Grad-CAM explainability.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-xs text-slate-400">
          <span className="px-2.5 py-1 rounded-xl bg-[#081220] border border-[#142640] text-emerald-400 font-semibold flex items-center space-x-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>99.88% Accuracy</span>
          </span>
          <span className="px-2.5 py-1 rounded-xl bg-[#081220] border border-[#142640] text-cyan-400 font-semibold flex items-center space-x-1">
            <Zap className="w-3.5 h-3.5" />
            <span>~110ms Latency</span>
          </span>
        </div>
      </div>

      {/* Error state if any */}
      {error && (
        <ErrorState
          error={error}
          onRetry={onAnalyze}
          onDismiss={onDismissError}
        />
      )}

      {/* Upload card / Scanning skeleton / Results view */}
      {isLoading ? (
        <ResultSkeleton />
      ) : currentPrediction && previewUrl ? (
        <div className="space-y-6 animate-in fade-in duration-300 pb-16 sm:pb-4">
          {/* Result Card */}
          <ResultCard
            prediction={currentPrediction}
            onReset={onReset}
          />

          {/* Deep Pathogen Agronomic Guide (if available) */}
          {currentKnowledge && (
            <div className="w-full max-w-xl mx-auto p-5 sm:p-6 rounded-3xl border border-cyan-900/60 bg-gradient-to-br from-[#0c2035] to-[#071322] shadow-xl text-slate-100 space-y-3">
              <div className="flex items-center space-x-2 text-cyan-400">
                <Sparkles className="w-4 h-4" />
                <span className="text-xs font-black uppercase tracking-wider">
                  Verified Agronomic Diagnosis
                </span>
              </div>
              <div className="text-xs text-cyan-200/90 font-mono italic">
                Pathogen: {currentKnowledge.pathogen}
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {currentKnowledge.diagnosis}
              </p>
              <div className="p-3.5 rounded-2xl bg-[#06101c]/90 border border-cyan-800/40 text-xs text-emerald-300">
                <strong>👨‍🌾 Farmer's Immediate Advisory: </strong>
                {currentKnowledge.farmersAdvice}
              </div>
            </div>
          )}

          {/* Grad-CAM Viewer */}
          <GradCamViewer
            originalSrc={previewUrl}
            gradcamBase64={currentPrediction.gradcam}
          />

          {/* Treatment Advice Panel */}
          {currentPrediction.advice && (
            <AdvicePanel
              advice={currentPrediction.advice}
              cropDisplayName={parsedCurrent?.displayName || "Crop Leaf"}
              isHealthy={parsedCurrent?.isHealthy ?? false}
              farmersAdvice={currentKnowledge?.farmersAdvice}
            />
          )}

          {/* Feedback Form */}
          <FeedbackBox
            requestId={currentPrediction.request_id}
            predictedLabel={currentPrediction.label}
          />

          {/* Sticky Bottom Action Bar on Mobile */}
          <StickyBottomBar
            onScanAnother={onReset}
            title={parsedCurrent?.displayName || "Crop"}
          />
        </div>
      ) : (
        <div className="space-y-6">
          <UploadCard
            selectedCrop={selectedCrop}
            onSelectCrop={onSelectCrop}
            selectedFile={selectedFile}
            previewUrl={previewUrl}
            isLoading={isLoading}
            onFileSelect={onFileSelect}
            onClearFile={onClearFile}
            onAnalyze={onAnalyze}
            onCancelAnalyze={onCancelAnalyze}
            onError={onError}
          />

          {/* Best Practice Photo Tips */}
          <PhotoTips />
        </div>
      )}
    </div>
  );
};
