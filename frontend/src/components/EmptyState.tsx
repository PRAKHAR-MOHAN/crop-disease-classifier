import React from "react";
import { useTranslation } from "react-i18next";

interface EmptyStateProps {
  onSelectSample: (file: File) => void;
  disabled?: boolean;
}

// Generate high quality synthetic sample leaf SVGs converted to JPEG blobs for instant 1-click test
function createSampleLeafBlob(
  type: "tomato_blight" | "apple_rust" | "corn_rust"
): Promise<File> {
  const canvas = document.createElement("canvas");
  canvas.width = 400;
  canvas.height = 300;
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    return Promise.reject("Canvas not supported");
  }

  // Draw natural leaf background
  const grad = ctx.createLinearGradient(0, 0, 400, 300);
  grad.addColorStop(0, "#2d5a27");
  grad.addColorStop(1, "#1a3818");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 400, 300);

  // Draw Leaf shape
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(200, 150, 150, 100, Math.PI / 12, 0, Math.PI * 2);
  ctx.fillStyle = "#3e7b32";
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = "#4f9841";
  ctx.stroke();

  // Draw characteristic lesions
  if (type === "tomato_blight") {
    // Concentric dark bullseye spots
    [
      { x: 150, y: 130, r: 24 },
      { x: 230, y: 170, r: 30 },
      { x: 180, y: 190, r: 18 },
    ].forEach((spot) => {
      ctx.beginPath();
      ctx.arc(spot.x, spot.y, spot.r + 8, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(234, 179, 8, 0.4)";
      ctx.fill();

      ctx.beginPath();
      ctx.arc(spot.x, spot.y, spot.r, 0, Math.PI * 2);
      ctx.fillStyle = "#451a03";
      ctx.fill();

      ctx.beginPath();
      ctx.arc(spot.x, spot.y, spot.r * 0.5, 0, Math.PI * 2);
      ctx.strokeStyle = "#78350f";
      ctx.lineWidth = 2;
      ctx.stroke();
    });
  } else if (type === "apple_rust") {
    // Orange-yellow rust pustules
    [
      { x: 140, y: 120 },
      { x: 170, y: 160 },
      { x: 210, y: 110 },
      { x: 250, y: 150 },
      { x: 200, y: 200 },
    ].forEach((pt) => {
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 16, 0, Math.PI * 2);
      ctx.fillStyle = "#ea580c";
      ctx.fill();
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 8, 0, Math.PI * 2);
      ctx.fillStyle = "#facc15";
      ctx.fill();
    });
  } else {
    // Corn linear rust streaks
    [
      { x: 130, y: 90, w: 10, h: 45 },
      { x: 180, y: 140, w: 12, h: 55 },
      { x: 230, y: 110, w: 10, h: 50 },
      { x: 270, y: 160, w: 12, h: 40 },
    ].forEach((bar) => {
      ctx.fillStyle = "#b45309";
      ctx.fillRect(bar.x, bar.y, bar.w, bar.h);
    });
  }

  ctx.restore();

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      const file = new File([blob || new Blob()], `${type}.jpg`, {
        type: "image/jpeg",
      });
      resolve(file);
    }, "image/jpeg", 0.9);
  });
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  onSelectSample,
  disabled = false,
}) => {
  const { t } = useTranslation();

  const handleSampleClick = async (type: "tomato_blight" | "apple_rust" | "corn_rust") => {
    if (disabled) return;
    const file = await createSampleLeafBlob(type);
    onSelectSample(file);
  };

  return (
    <div className="pt-2 text-center space-y-2">
      <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
        {t("samples.title")}
      </p>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <button
          type="button"
          disabled={disabled}
          onClick={() => handleSampleClick("tomato_blight")}
          className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700 transition active:scale-95 flex items-center space-x-1.5 min-h-[36px]"
        >
          <span>🍅</span>
          <span>{t("samples.sample1")}</span>
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => handleSampleClick("apple_rust")}
          className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700 transition active:scale-95 flex items-center space-x-1.5 min-h-[36px]"
        >
          <span>🍎</span>
          <span>{t("samples.sample2")}</span>
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => handleSampleClick("corn_rust")}
          className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700 transition active:scale-95 flex items-center space-x-1.5 min-h-[36px]"
        >
          <span>🌽</span>
          <span>{t("samples.sample3")}</span>
        </button>
      </div>
    </div>
  );
};
