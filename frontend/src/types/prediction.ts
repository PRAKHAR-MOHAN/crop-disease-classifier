export interface Top3Entry {
  rank: number;
  class_id: string;
  confidence: number;
}

export interface AdviceEntry {
  severity: "healthy" | "low" | "moderate" | "high" | "critical";
  symptoms: string;
  organic_treatment: string[];
  chemical_treatment: string[];
  prevention: string[];
}

export interface PredictionResponse {
  request_id: string;
  label: string;
  confidence: number;
  top3: Top3Entry[];
  gradcam?: string | null;
  advice?: AdviceEntry | null;
  is_uncertain: boolean;
  is_ood: boolean;
  latency_ms: number;
}

export interface HealthResponse {
  status: "healthy" | "degraded";
  model_loaded: boolean;
  num_classes: number;
  backend_version: string;
}

export interface ClassListResponse {
  num_classes: number;
  classes: string[];
}

export interface FeedbackRequest {
  request_id: string;
  is_correct: boolean;
  corrected_class?: string;
  comment?: string;
}

export interface FeedbackResponse {
  status: string;
  message: string;
}

export interface HistoryItem {
  id: string;
  timestamp: number;
  thumbnail: string;
  prediction: PredictionResponse;
}

