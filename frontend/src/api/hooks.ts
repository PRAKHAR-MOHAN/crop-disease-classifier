import { useQuery, useMutation } from "@tanstack/react-query";
import { api, ApiError } from "./client";
import { FeedbackRequest, PredictionResponse } from "./types";

export const QUERY_KEYS = {
  health: ["health"] as const,
  classes: ["classes"] as const,
  advice: (id: string) => ["advice", id] as const,
};

export function useHealthQuery() {
  return useQuery({
    queryKey: QUERY_KEYS.health,
    queryFn: ({ signal }) => api.getHealth(signal),
    staleTime: 30_000,
    refetchInterval: 60_000,
    retry: 1,
  });
}

export function useClassesQuery() {
  return useQuery({
    queryKey: QUERY_KEYS.classes,
    queryFn: ({ signal }) => api.getClasses(signal),
    staleTime: 1000 * 60 * 60, // 1 hour
    gcTime: 1000 * 60 * 120,
    retry: 2,
  });
}

export function useAdviceQuery(classId: string | undefined | null) {
  return useQuery({
    queryKey: QUERY_KEYS.advice(classId || ""),
    queryFn: ({ signal }) => api.getAdvice(classId!, signal),
    enabled: Boolean(classId && classId !== "Unknown"),
    staleTime: 1000 * 60 * 60,
  });
}

export function usePredictMutation() {
  return useMutation<
    PredictionResponse,
    ApiError,
    { file: Blob | File; signal?: AbortSignal }
  >({
    mutationFn: ({ file, signal }) => api.predict(file, signal),
  });
}

export function useFeedbackMutation() {
  return useMutation({
    mutationFn: (payload: FeedbackRequest) => api.submitFeedback(payload),
    onSuccess: () => {
      // Feedback successfully logged
    },
  });
}
