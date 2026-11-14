import React from "react";
import { useTranslation } from "react-i18next";
import { ExternalLink, Database } from "lucide-react";

interface EmptyStateProps {
  onSelectSample: (file: File) => void;
  disabled?: boolean;
}

// Generate realistic leaf test patterns as JPEG blobs
function createSampleLeafBlob(
  type: "tomato_blight" | "apple_rust" | "corn_rust" | "potato_blight" | "tomato_healthy" | "squash_mildew"
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
  grad.addColorStop(0, "#234a1e");
  grad.addColorStop(1, "#112610");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 400, 300);

  // Draw Leaf contour
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(200, 150, 155, 105, Math.PI / 14, 0, Math.PI * 2);
  ctx.fillStyle = type === "tomato_healthy" ? "#22c55e" : "#2d6a24";
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = "#3ea330";
  ctx.stroke();

  // Draw specific pathology lesions
  if (type === "tomato_blight" || type === "potato_blight") {
    // Bullseye necrotic rings with yellow halos
    [
      { x: 150, y: 130, r: 24 },
      { x: 230, y: 170, r: 30 },
      { x: 180, y: 190, r: 18 },
    ].forEach((spot) => {
      ctx.beginPath();
      ctx.arc(spot.x, spot.y, spot.r + 9, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(234, 179, 8, 0.45)";
      ctx.fill();

      ctx.beginPath();
      ctx.arc(spot.x, spot.y, spot.r, 0, Math.PI * 2);
      ctx.fillStyle = "#381504";
      ctx.fill();

      ctx.beginPath();
      ctx.arc(spot.x, spot.y, spot.r * 0.5, 0, Math.PI * 2);
      ctx.strokeStyle = "#78350f";
      ctx.lineWidth = 2.5;
      ctx.stroke();
    });
  } else if (type === "apple_rust") {
    // Orange-yellow cedar rust pustules
    [
      { x: 140, y: 120 },
      { x: 175, y: 160 },
      { x: 215, y: 110 },
      { x: 255, y: 150 },
      { x: 195, y: 205 },
    ].forEach((pt) => {
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 18, 0, Math.PI * 2);
      ctx.fillStyle = "#ea580c";
      ctx.fill();
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 9, 0, Math.PI * 2);
      ctx.fillStyle = "#facc15";
      ctx.fill();
    });
  } else if (type === "corn_rust") {
    // Elongated cinnamon rust streaks
    [
      { x: 130, y: 90, w: 10, h: 48 },
      { x: 180, y: 140, w: 12, h: 58 },
      { x: 230, y: 110, w: 10, h: 52 },
      { x: 270, y: 160, w: 12, h: 44 },
    ].forEach((bar) => {
      ctx.fillStyle = "#b45309";
      ctx.fillRect(bar.x, bar.y, bar.w, bar.h);
    });
  } else if (type === "squash_mildew") {
    // Talcum white powdery coating patches
    [
      { x: 160, y: 125, r: 35 },
      { x: 220, y: 165, r: 42 },
      { x: 185, y: 195, r: 28 },
    ].forEach((patch) => {
      ctx.beginPath();
      ctx.arc(patch.x, patch.y, patch.r, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255, 255, 255, 0.65)";
      ctx.fill();
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

  const handleSampleClick = async (
    type: "tomato_blight" | "apple_rust" | "corn_rust" | "potato_blight" | "tomato_healthy" | "squash_mildew"
  ) => {
    if (disabled) return;
    const file = await createSampleLeafBlob(type);
    onSelectSample(file);
  };

  return (
    <div className="pt-3 text-center space-y-4">
      {/* 1-Click Instant Test Samples */}
      <div className="space-y-2">
        <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-300/80">
          🌱 {t("samples.title")}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <button
            type="button"
            disabled={disabled}
            onClick={() => handleSampleClick("tomato_blight")}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#113521] hover:bg-[#1a4a2f] text-emerald-200 border border-[#235f3d] transition active:scale-95 flex items-center space-x-1.5 min-h-[36px]"
          >
            <span>🍅</span>
            <span>Tomato Early Blight</span>
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={() => handleSampleClick("apple_rust")}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#113521] hover:bg-[#1a4a2f] text-emerald-200 border border-[#235f3d] transition active:scale-95 flex items-center space-x-1.5 min-h-[36px]"
          >
            <span>🍎</span>
            <span>Apple Cedar Rust</span>
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={() => handleSampleClick("corn_rust")}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#113521] hover:bg-[#1a4a2f] text-emerald-200 border border-[#235f3d] transition active:scale-95 flex items-center space-x-1.5 min-h-[36px]"
          >
            <span>🌽</span>
            <span>Corn Common Rust</span>
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={() => handleSampleClick("potato_blight")}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#113521] hover:bg-[#1a4a2f] text-emerald-200 border border-[#235f3d] transition active:scale-95 flex items-center space-x-1.5 min-h-[36px]"
          >
            <span>🥔</span>
            <span>Potato Late Blight</span>
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={() => handleSampleClick("squash_mildew")}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#113521] hover:bg-[#1a4a2f] text-emerald-200 border border-[#235f3d] transition active:scale-95 flex items-center space-x-1.5 min-h-[36px]"
          >
            <span>🎃</span>
            <span>Squash Powdery Mildew</span>
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={() => handleSampleClick("tomato_healthy")}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#113521] hover:bg-[#1a4a2f] text-emerald-200 border border-[#235f3d] transition active:scale-95 flex items-center space-x-1.5 min-h-[36px]"
          >
            <span>✅</span>
            <span>Healthy Tomato Leaf</span>
          </button>
        </div>
      </div>

      {/* Dataset Download Links for Bulk / Desired Amount of Images */}
      <div className="p-4 rounded-2xl bg-[#081e13] border border-[#1b4d32] text-left space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-xs font-bold text-emerald-300">
            <Database className="w-4 h-4 text-[#22c55e]" />
            <span>Download Certified Leaf Datasets (54,000+ Photos)</span>
          </div>
          <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-[#143d26] text-[#4ade80] border border-[#235f3d]">
            Free & Open Access
          </span>
        </div>
        <p className="text-[11px] text-emerald-200/80 leading-relaxed">
          Need any desired amount of real leaf photos to test? You can download single leaves or complete batches from these repositories:
        </p>
        <div className="flex flex-wrap gap-2 pt-1">
          <a
            href="https://www.kaggle.com/datasets/emmarex/plantdisease"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-[#133d26] hover:bg-[#1c5434] text-white border border-[#24623e] transition active:scale-95 shadow-sm"
          >
            <span>📊</span>
            <span>Kaggle PlantVillage (54,300+ Images)</span>
            <ExternalLink className="w-3.5 h-3.5 ml-0.5 text-[#22c55e]" />
          </a>
          <a
            href="https://github.com/pratikkayal/PlantDoc-Dataset"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-[#133d26] hover:bg-[#1c5434] text-white border border-[#24623e] transition active:scale-95 shadow-sm"
          >
            <span>🌾</span>
            <span>PlantDoc Real-Field Photos (2,500+ Images)</span>
            <ExternalLink className="w-3.5 h-3.5 ml-0.5 text-[#22c55e]" />
          </a>
          <a
            href="https://data.mendeley.com/datasets/tywbtsjrjv/1"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-[#133d26] hover:bg-[#1c5434] text-white border border-[#24623e] transition active:scale-95 shadow-sm"
          >
            <span>🔬</span>
            <span>Mendeley Plant Pathology Dataset</span>
            <ExternalLink className="w-3.5 h-3.5 ml-0.5 text-[#22c55e]" />
          </a>
        </div>
      </div>
    </div>
  );
};
