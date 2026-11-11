import { useEffect, useState } from "react";
import { HistoryItem, PredictionResponse } from "@/types/prediction";

const STORAGE_KEY = "crop_pred_history_v1";
const MAX_HISTORY = 20;

export function usePredictionHistory() {
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    } catch (e) {
      console.warn("Failed to persist history to localStorage", e);
    }
  }, [history]);

  const addEntry = (prediction: PredictionResponse, thumbnailDataUrl: string) => {
    const item: HistoryItem = {
      id: prediction.request_id || `hist_${Date.now()}`,
      timestamp: Date.now(),
      thumbnail: thumbnailDataUrl,
      prediction,
    };
    setHistory((prev) => [item, ...prev.filter((x) => x.id !== item.id)].slice(0, MAX_HISTORY));
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  return { history, addEntry, clearHistory };
}

