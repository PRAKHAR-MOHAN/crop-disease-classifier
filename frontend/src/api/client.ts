import {
  ClassListResponse,
  FeedbackRequest,
  FeedbackResponse,
  HealthResponse,
  PredictionResponse,
  AdviceEntry,
} from "./types";

const API_BASE =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  "/api";

export class ApiError extends Error {
  status: number;
  detail: string;
  retryAfterSeconds?: number;

  constructor(status: number, detail: string, retryAfterSeconds?: number) {
    super(detail);
    this.name = "ApiError";
    this.status = status;
    this.detail = detail;
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const cleanBase = API_BASE.endsWith("/") ? API_BASE.slice(0, -1) : API_BASE;
  const cleanPath = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const url = `${cleanBase}${cleanPath}`;

  const response = await fetch(url, options);

  if (!response.ok) {
    let detail = `Server responded with HTTP ${response.status}`;
    try {
      const err = await response.json();
      if (err.detail) {
        detail = typeof err.detail === "string" ? err.detail : JSON.stringify(err.detail);
      } else if (err.error) {
        detail = err.error;
      }
    } catch {
      // Body was not JSON
    }

    let retryAfter: number | undefined;
    const retryHeader = response.headers.get("Retry-After");
    if (retryHeader) {
      const parsed = parseInt(retryHeader, 10);
      if (!isNaN(parsed)) retryAfter = parsed;
    }

    throw new ApiError(response.status, detail, retryAfter);
  }

  return response.json();
}

export const api = {
  getHealth: (signal?: AbortSignal): Promise<HealthResponse> =>
    request<HealthResponse>("/health", { signal }),

  getClasses: (signal?: AbortSignal): Promise<ClassListResponse> =>
    request<ClassListResponse>("/classes", { signal }),

  getAdvice: (classId: string, signal?: AbortSignal): Promise<AdviceEntry> =>
    request<AdviceEntry>(`/advice/${encodeURIComponent(classId)}`, { signal }),

  predict: async (
    file: Blob | File,
    signal?: AbortSignal
  ): Promise<PredictionResponse> => {
    const formData = new FormData();
    const fileName = (file as File).name || "leaf.jpg";
    formData.append("file", file, fileName);

    return request<PredictionResponse>("/predict", {
      method: "POST",
      body: formData,
      signal,
    });
  },

  submitFeedback: (payload: FeedbackRequest): Promise<FeedbackResponse> =>
    request<FeedbackResponse>("/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),
};
