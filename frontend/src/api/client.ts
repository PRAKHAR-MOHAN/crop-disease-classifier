import {
  ClassListResponse,
  FeedbackRequest,
  FeedbackResponse,
  HealthResponse,
  PredictionResponse,
} from "@/types/prediction";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "/api";

export class ApiError extends Error {
  status: number;
  detail: string;

  constructor(status: number, detail: string) {
    super(detail);
    this.name = "ApiError";
    this.status = status;
    this.detail = detail;
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;
  const response = await fetch(url, options);

  if (!response.ok) {
    let detail = `Request failed with status ${response.status}`;
    try {
      const err = await response.json();
      detail = err.detail || err.error || detail;
    } catch {
      // Non-JSON response
    }
    throw new ApiError(response.status, detail);
  }

  return response.json();
}

export const api = {
  checkHealth: (): Promise<HealthResponse> => request<HealthResponse>("/health"),

  getClasses: (): Promise<ClassListResponse> => request<ClassListResponse>("/classes"),

  predict: async (file: File): Promise<PredictionResponse> => {
    const formData = new FormData();
    formData.append("file", file);

    const url = `${API_BASE}/predict`;
    const response = await fetch(url, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      let detail = `Inference failed (${response.status})`;
      try {
        const err = await response.json();
        detail = err.detail || err.error || detail;
      } catch {
        // Non-JSON
      }
      throw new ApiError(response.status, detail);
    }

    return response.json();
  },

  submitFeedback: (data: FeedbackRequest): Promise<FeedbackResponse> =>
    request<FeedbackResponse>("/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }),
};

