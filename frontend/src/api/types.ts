/**
 * TypeScript definitions strictly aligned with FastAPI backend schemas.
 * (backend/app/schemas/__init__.py)
 */

export interface Top3Entry {
  rank: number; // 1-3
  class_id: string; // "Crop___Disease"
  confidence: number; // 0.0 - 1.0 calibrated probability
}

export type SeverityLevel = "healthy" | "low" | "moderate" | "high" | "critical";

export interface AdviceEntry {
  severity: SeverityLevel;
  symptoms: string;
  organic_treatment: string[];
  chemical_treatment: string[];
  prevention: string[];
}

export interface PredictionResponse {
  request_id: string;
  label: string; // "Crop___Disease" or "Unknown"
  confidence: number; // 0.0 - 1.0
  top3: Top3Entry[];
  gradcam?: string | null; // Base64 PNG Grad-CAM
  advice?: AdviceEntry | null;
  is_uncertain: boolean;
  is_ood: boolean;
  latency_ms: number;
}

export interface FeedbackRequest {
  request_id: string;
  is_correct: boolean;
  corrected_class?: string | null;
  comment?: string | null;
}

export interface FeedbackResponse {
  status: string;
  message: string;
}

export interface HealthResponse {
  status: "healthy" | "degraded";
  model_loaded: boolean;
  num_classes: number;
  backend_version?: string;
}

export interface ClassListResponse {
  num_classes: number;
  classes: string[];
}

export interface ErrorResponse {
  error: string;
  detail: string;
  request_id?: string | null;
}

export interface HistoryItem {
  id: string;
  timestamp: number;
  prediction: PredictionResponse;
  thumbnail: string;
}

