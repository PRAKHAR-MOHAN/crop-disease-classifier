import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { ThumbsUp, ThumbsDown, Check, Send } from "lucide-react";
import { useFeedbackMutation, useClassesQuery } from "@/api/hooks";

interface FeedbackBoxProps {
  requestId: string;
  predictedLabel: string;
}

export const FeedbackBox: React.FC<FeedbackBoxProps> = ({
  requestId,
  predictedLabel,
}) => {
  const { t } = useTranslation();
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [correctedClass, setCorrectedClass] = useState<string>("");
  const [comment, setComment] = useState("");

  const { data: classesData } = useClassesQuery();
  const mutation = useFeedbackMutation();

  const handlePositive = async () => {
    setIsCorrect(true);
    await mutation.mutateAsync({
      request_id: requestId,
      is_correct: true,
    });
    setFeedbackSent(true);
  };

  const handleNegativeClick = () => {
    setIsCorrect(false);
  };

  const handleSubmitNegative = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!correctedClass) return;

    await mutation.mutateAsync({
      request_id: requestId,
      is_correct: false,
      corrected_class: correctedClass,
      comment: comment.trim() || undefined,
    });
    setFeedbackSent(true);
  };

  if (feedbackSent) {
    return (
      <div className="p-4 rounded-2xl bg-[#0e2c1c] border border-[#235f3d] text-center space-y-1 text-emerald-200 animate-in fade-in">
        <div className="w-8 h-8 rounded-full bg-[#143d26] border border-[#235f3d] mx-auto flex items-center justify-center text-[#22c55e] font-bold">
          <Check className="w-4 h-4" />
        </div>
        <p className="text-xs font-bold">{t("feedback.thankYou")}</p>
      </div>
    );
  }

  return (
    <div className="bg-[#0c2417] border border-[#1b4d32] rounded-3xl p-5 shadow-lg space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400">
          {t("feedback.question")}
        </h4>
        <span className="text-[10px] font-mono text-emerald-400/70">ID: {requestId.slice(0, 8)}</span>
      </div>

      {isCorrect === null && (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handlePositive}
            className="flex-1 py-2.5 px-3 rounded-xl text-xs font-bold bg-[#143d26] hover:bg-[#1c5434] text-emerald-200 border border-[#235f3d] flex items-center justify-center space-x-1.5 transition active:scale-95 min-h-[44px]"
          >
            <ThumbsUp className="w-3.5 h-3.5 text-[#22c55e]" />
            <span>{t("feedback.yes")}</span>
          </button>
          <button
            type="button"
            onClick={handleNegativeClick}
            className="flex-1 py-2.5 px-3 rounded-xl text-xs font-bold bg-[#143d26] hover:bg-[#1c5434] text-emerald-200 border border-[#235f3d] flex items-center justify-center space-x-1.5 transition active:scale-95 min-h-[44px]"
          >
            <ThumbsDown className="w-3.5 h-3.5 text-amber-400" />
            <span>{t("feedback.no")}</span>
          </button>
        </div>
      )}

      {isCorrect === false && (
        <form onSubmit={handleSubmitNegative} className="space-y-3 animate-in fade-in">
          <div>
            <label className="block text-[11px] font-semibold text-emerald-300 mb-1">
              {t("feedback.selectCorrection")}
            </label>
            <select
              value={correctedClass}
              onChange={(e) => setCorrectedClass(e.target.value)}
              required
              className="w-full py-2 px-3 rounded-xl text-xs font-medium border border-[#1b4d32] bg-[#05140a] text-white focus:ring-2 focus:ring-[#22c55e]"
            >
              <option value="">-- {t("feedback.selectCorrection")} --</option>
              {classesData?.classes
                ?.filter((c) => c !== predictedLabel)
                .map((cls) => (
                  <option key={cls} value={cls}>
                    {cls.replace("___", ": ").replace(/_/g, " ")}
                  </option>
                ))}
            </select>
          </div>

          <div>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={t("feedback.commentPlaceholder")}
              rows={2}
              maxLength={500}
              className="w-full p-2.5 rounded-xl text-xs border border-[#1b4d32] bg-[#05140a] text-white focus:ring-2 focus:ring-[#22c55e]"
            />
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsCorrect(null)}
              className="py-1.5 px-3 rounded-xl text-xs font-semibold text-emerald-300 hover:text-white hover:bg-[#143d26] min-h-[36px]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!correctedClass || mutation.isPending}
              className="py-1.5 px-4 rounded-xl text-xs font-bold bg-[#16a34a] hover:bg-[#15803d] text-white flex items-center space-x-1.5 transition active:scale-95 disabled:opacity-50 min-h-[36px]"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{mutation.isPending ? t("feedback.submitting") : t("feedback.submit")}</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

