import React from "react";
import { useTranslation } from "react-i18next";
import { X, Trash2, Clock, ChevronRight } from "lucide-react";
import { HistoryItem } from "@/api/types";
import { parseClassName } from "@/lib/parseClassName";

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  history: HistoryItem[];
  onSelect: (item: HistoryItem) => void;
  onClear: () => void;
}

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({
  isOpen,
  onClose,
  history,
  onSelect,
  onClear,
}) => {
  const { t } = useTranslation();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-sm bg-white dark:bg-[#0c2417] border-l border-gray-200 dark:border-[#1b4d32] shadow-2xl flex flex-col justify-between">
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-emerald-500" />
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                {t("history.title")}
              </h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* List items */}
          <div className="p-4 flex-1 overflow-y-auto space-y-2">
            {history.length > 0 ? (
              history.map((item) => {
                const parsed = parseClassName(item.prediction.label);
                const percent = Math.round(item.prediction.confidence * 100);
                const dateStr = new Date(item.timestamp).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                });

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      onSelect(item);
                      onClose();
                    }}
                    className="w-full p-2.5 rounded-2xl bg-gray-50 dark:bg-gray-900/40 hover:bg-emerald-50/70 dark:hover:bg-emerald-950/40 border border-gray-100 dark:border-gray-800 text-left flex items-center space-x-3 transition active:scale-[0.98]"
                  >
                    <img
                      src={item.thumbnail}
                      alt="Thumbnail"
                      className="w-12 h-12 rounded-xl object-cover bg-black flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-gray-900 dark:text-white truncate">
                        {parsed.cropEmoji} {parsed.displayName}
                      </p>
                      <div className="flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 font-mono">
                        <span>{percent}% Conf</span>
                        <span>{dateStr}</span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </button>
                );
              })
            ) : (
              <div className="py-12 text-center text-xs text-gray-400 space-y-1">
                <p>🌱</p>
                <p>{t("history.empty")}</p>
              </div>
            )}
          </div>

          {/* Footer Clear Action */}
          {history.length > 0 && (
            <div className="p-4 border-t border-gray-100 dark:border-gray-800">
              <button
                type="button"
                onClick={() => {
                  if (window.confirm(t("history.clearConfirm"))) {
                    onClear();
                  }
                }}
                className="w-full py-2.5 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-center justify-center space-x-1.5 transition active:scale-95"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{t("nav.clearHistory")}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
