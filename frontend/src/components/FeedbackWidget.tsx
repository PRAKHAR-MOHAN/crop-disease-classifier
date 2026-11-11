import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { api } from "@/api/client";

interface FeedbackWidgetProps {
  requestId: string;
  predictedLabel: string;
  availableClasses: string[];
}

export const FeedbackWidget: React.FC<FeedbackWidgetProps> = ({
  requestId,
  predictedLabel,
  availableClasses,
}) => {
  const { t } = useTranslation();
  const [submitted, setSubmitted] = useState(false);
  const [showCorrectionForm, setShowCorrectionForm] = useState(false);
  const [correctedClass, setCorrectedClass] = useState("");
  const [comment, setComment] = useState("");
  const [isSending, setIsSending] = useState(false);

  const handleConfirm = async () => {
    setIsSending(true);
    try {
      await api.submitFeedback({
        request_id: requestId,
        is_correct: true,
      });
      setSubmitted(true);
    } catch (e) {
      console.error("Failed to submit feedback", e);
    } finally {
      setIsSending(false);
    }
  };

  const handleCorrect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!correctedClass) return;

    setIsSending(true);
    try {
      await api.submitFeedback({
        request_id: requestId,
        is_correct: false,
        corrected_class: correctedClass,
        comment: comment.trim() || undefined,
      });
      setSubmitted(true);
    } catch (e) {
      console.error("Failed to submit correction", e);
    } finally {
      setIsSending(false);
    }
  };

  if (submitted) {
    return (
      <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl p-3.5 text-center text-xs font-semibold text-emerald-800 dark:text-emerald-300">
        ✨ {t("feedback.thankYou")}
      </div>
    );
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between text-xs font-semibold text-gray-700 dark:text-gray-300">
        <span>{t("feedback.question")}</span>
        <span className="text-[11px] font-mono text-gray-400">ID: {requestId.slice(0, 8)}</span>
      </div>

      {!showCorrectionForm ? (
        <div className="flex space-x-2">
          <button
            type="button"
            disabled={isSending}
            onClick={handleConfirm}
            className="flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition active:scale-95 disabled:opacity-50"
          >
            👍 {t("feedback.yes")}
          </button>
          <button
            type="button"
            disabled={isSending}
            onClick={() => setShowCorrectionForm(true)}
            className="flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 transition active:scale-95 disabled:opacity-50"
          >
            👎 {t("feedback.no")}
          </button>
        </div>
      ) : (
        <form onSubmit={handleCorrect} className="space-y-2 pt-1">
          <select
            value={correctedClass}
            onChange={(e) => setCorrectedClass(e.target.value)}
            className="w-full text-xs py-1.5 px-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 font-medium"
            required
          >
            <option value="">{t("feedback.correctClassPlaceholder")}</option>
            {availableClasses
              .filter((c) => c !== predictedLabel)
              .map((c) => (
                <option key={c} value={c}>
                  {c.replace("___", ": ")}
                </option>
              ))}
          </select>

          <input
            type="text"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={t("feedback.commentPlaceholder")}
            maxLength={300}
            className="w-full text-xs py-1.5 px-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800"
          />

          <div className="flex space-x-2 pt-1">
            <button
              type="submit"
              disabled={isSending || !correctedClass}
              className="flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold bg-brand-600 hover:bg-brand-700 text-white transition active:scale-95 disabled:opacity-50"
            >
              {t("feedback.submitCorrection")}
            </button>
            <button
              type="button"
              onClick={() => setShowCorrectionForm(false)}
              className="py-1.5 px-3 rounded-lg text-xs border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

