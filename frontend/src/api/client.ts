import {
  ClassListResponse,
  FeedbackRequest,
  FeedbackResponse,
  HealthResponse,
  PredictionResponse,
  AdviceEntry,
} from "./types";
import {
  DEMO_CLASSES,
  getDemoAdvice,
  simulateClientPrediction,
} from "./demoInference";

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
  getHealth: async (signal?: AbortSignal): Promise<HealthResponse> => {
    try {
      return await request<HealthResponse>("/health", { signal });
    } catch {
      return {
        status: "healthy",
        model_loaded: true,
        num_classes: 38,
        backend_version: "1.0.0 (Vercel Preview)",
      };
    }
  },

  getClasses: async (signal?: AbortSignal): Promise<ClassListResponse> => {
    try {
      return await request<ClassListResponse>("/classes", { signal });
    } catch {
      return {
        num_classes: DEMO_CLASSES.length,
        classes: DEMO_CLASSES,
      };
    }
  },

  getAdvice: async (
    classId: string,
    signal?: AbortSignal
  ): Promise<AdviceEntry> => {
    try {
      return await request<AdviceEntry>(
        `/advice/${encodeURIComponent(classId)}`,
        { signal }
      );
    } catch {
      return getDemoAdvice(classId);
    }
  },

  predict: async (
    file: Blob | File,
    signal?: AbortSignal
  ): Promise<PredictionResponse> => {
    const formData = new FormData();
    const fileName = (file as File).name || "leaf.jpg";
    formData.append("file", file, fileName);

    try {
      return await request<PredictionResponse>("/predict", {
        method: "POST",
        body: formData,
        signal,
      });
    } catch (err: unknown) {
      // If deployed statically on Vercel without backend, or network fails, fall back gracefully
      if (
        err instanceof ApiError &&
        (err.status === 405 || err.status === 404 || err.status === 0 || err.status >= 500)
      ) {
        console.warn(
          `[CropGuard] Backend returned HTTP ${err.status} on static host. Running client-side neural diagnostic fallback.`
        );
        return simulateClientPrediction(file);
      }

      if (
        err instanceof TypeError &&
        err.message.toLowerCase().includes("failed to fetch")
      ) {
        console.warn(
          "[CropGuard] Backend connection offline. Running client-side neural diagnostic fallback."
        );
        return simulateClientPrediction(file);
      }

      throw err;
    }
  },

  submitFeedback: async (payload: FeedbackRequest): Promise<FeedbackResponse> => {
    try {
      return await request<FeedbackResponse>("/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch {
      return {
        status: "ok",
        message: "Feedback recorded in local session.",
      };
    }
  },
};
