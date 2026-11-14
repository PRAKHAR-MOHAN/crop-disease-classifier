import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { RefreshCw, Share2, Check } from "lucide-react";

interface StickyBottomBarProps {
  onScanAnother: () => void;
  title: string;
}

export const StickyBottomBar: React.FC<StickyBottomBarProps> = ({
  onScanAnother,
  title,
}) => {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `CropAI: ${title}`,
          text: `CropAI Diagnosis for ${title}`,
          url: window.location.href,
        });
      } catch {
        // Cancelled
      }
    } else {
      try {
        await navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        // Clipboard error
      }
    }
  };

  return (
    <div className="fixed bottom-0 inset-x-0 z-30 p-3 bg-[#06150c]/95 backdrop-blur-md border-t border-[#164429] shadow-2xl sm:hidden pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      <div className="flex items-center gap-2 max-w-md mx-auto">
        <button
          type="button"
          onClick={onScanAnother}
          className="flex-1 py-3 px-4 rounded-xl text-xs font-bold text-white bg-[#16a34a] hover:bg-[#15803d] shadow-md flex items-center justify-center space-x-2 min-h-[44px] active:scale-95 transition"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>{t("result.scanAnother")}</span>
        </button>

        <button
          type="button"
          onClick={handleShare}
          className="py-3 px-4 rounded-xl text-xs font-bold border border-[#235f3d] bg-[#143d26] hover:bg-[#1c5434] text-emerald-200 shadow-sm flex items-center justify-center space-x-1.5 min-h-[44px] active:scale-95 transition"
          title={t("result.share")}
        >
          {copied ? <Check className="w-4 h-4 text-[#22c55e]" /> : <Share2 className="w-4 h-4 text-emerald-300" />}
          <span>{copied ? "Copied" : t("result.share")}</span>
        </button>
      </div>
    </div>
  );
};

