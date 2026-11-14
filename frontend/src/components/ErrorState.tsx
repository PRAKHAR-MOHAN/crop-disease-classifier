import React, { useEffect, useState } from "react";
import { AlertTriangle, Clock, RefreshCw, WifiOff, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { ApiError } from "@/api/client";

interface ErrorStateProps {
  error: Error | ApiError | null;
  onRetry?: () => void;
  onDismiss?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  error,
  onRetry,
  onDismiss,
}) => {
  const { t } = useTranslation();
  const [countdown, setCountdown] = useState<number>(0);

  const apiError = error instanceof ApiError ? error : null;
  const isRateLimit = apiError?.status === 429;
  const isNetwork = !apiError || apiError.status === 0;

  useEffect(() => {
    if (isRateLimit && apiError?.retryAfterSeconds) {
      setCountdown(apiError.retryAfterSeconds);
    } else if (isRateLimit) {
      setCountdown(60);
    }
  }, [isRateLimit, apiError]);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  if (!error) return null;

  return (
    <div className="w-full max-w-xl mx-auto p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200 shadow-md space-y-3 animate-in fade-in zoom-in-95 duration-200">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start space-x-3">
          <div className="p-2 rounded-xl bg-rose-100 dark:bg-rose-900/60 text-rose-600 dark:text-rose-300 flex-shrink-0 mt-0.5">
            {isRateLimit ? (
              <Clock className="w-5 h-5" />
            ) : isNetwork ? (
              <WifiOff className="w-5 h-5" />
            ) : (
              <AlertTriangle className="w-5 h-5" />
            )}
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-bold">
              {isRateLimit
                ? "Rate Limit Exceeded"
                : isNetwork
                ? "Connection Error"
                : "Analysis Failed"}
            </h4>
            <p className="text-xs leading-relaxed opacity-90">
              {isRateLimit
                ? t("errors.rateLimit", { seconds: countdown })
                : error.message || t("errors.serverError")}
            </p>
          </div>
        </div>

        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className="p-1 rounded-lg text-rose-400 hover:text-rose-700 dark:hover:text-white"
            aria-label="Dismiss error"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {onRetry && (
        <div className="flex justify-end pt-1">
          <button
            type="button"
            disabled={countdown > 0}
            onClick={onRetry}
            className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-sm flex items-center space-x-1.5 transition active:scale-95 disabled:opacity-50 min-h-[36px]"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>
              {countdown > 0
                ? `Wait ${countdown}s`
                : t("errors.retry")}
            </span>
          </button>
        </div>
      )}
    </div>
  );
};

