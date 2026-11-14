import React from "react";

export const CropAiHero: React.FC = () => {
  return (
    <div className="text-center space-y-6 pt-4 pb-2 max-w-2xl mx-auto px-4">
      {/* Live Detection Pill */}
      <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-bold bg-[#0c2417] text-[#22c55e] border border-[#1b4d32] shadow-sm">
        <span className="w-2 h-2 rounded-full bg-[#22c55e] animate-ping" />
        <span className="tracking-wider uppercase text-[11px]">LIVE DETECTION</span>
      </div>

      {/* Main Headline */}
      <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-[1.08] font-sans">
        Diagnose<br />
        Your<br />
        <span className="text-[#22c55e] drop-shadow-[0_0_25px_rgba(34,197,94,0.35)]">
          Crop Disease
        </span><br />
        Instantly
      </h1>

      {/* Subtitle */}
      <p className="text-xs sm:text-sm text-gray-300 max-w-md mx-auto leading-relaxed">
        Upload a photo of your plant — our AI analyzes it in seconds and gives you a full treatment plan.
      </p>

      {/* Feature Pills */}
      <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
        <span className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-full text-xs font-semibold bg-[#0c2417] text-gray-200 border border-[#1b4d32]">
          <span>🤖</span>
          <span>AI-Powered</span>
        </span>
        <span className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-full text-xs font-semibold bg-[#0c2417] text-gray-200 border border-[#1b4d32]">
          <span>⚡</span>
          <span>Instant Results</span>
        </span>
        <span className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-full text-xs font-semibold bg-[#0c2417] text-gray-200 border border-[#1b4d32]">
          <span className="text-[#22c55e]">●</span>
          <span>30+ Crop Diseases</span>
        </span>
        <span className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-full text-xs font-semibold bg-[#0c2417] text-gray-200 border border-[#1b4d32]">
          <span>🆓</span>
          <span>Free to Use</span>
        </span>
      </div>
    </div>
  );
};

