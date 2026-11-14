import React from "react";

export const CropAiNavbar: React.FC = () => {
  return (
    <header className="w-full max-w-4xl mx-auto px-4 pt-6 pb-2 flex items-center justify-between">
      {/* Brand */}
      <div className="flex items-center space-x-2.5">
        <div className="w-9 h-9 rounded-xl bg-[#22c55e] flex items-center justify-center text-lg shadow-lg shadow-emerald-500/20">
          🌱
        </div>
        <span className="text-xl font-black text-white tracking-tight">
          Crop<span className="text-[#22c55e]">AI</span>
        </span>
      </div>

      {/* AI-Powered Badge */}
      <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#0c2417] text-[#4ade80] border border-[#1b4d32] shadow-sm">
        <span className="text-amber-400">✦</span>
        <span>AI-Powered</span>
      </div>
    </header>
  );
};

