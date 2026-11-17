import React, { useState } from "react";
import { Search, BookOpen, Sprout, ChevronRight } from "lucide-react";
import { CROP_OPTIONS, PATHOGEN_DETAILS } from "../data/cropKnowledge";

export const PathogenLibraryView: React.FC = () => {
  const [selectedCrop, setSelectedCrop] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [selectedPathogenKey, setSelectedPathogenKey] = useState<string | null>(null);

  const pathogenKeys = Object.keys(PATHOGEN_DETAILS);

  const filtered = pathogenKeys.filter((key) => {
    const matchesCrop = selectedCrop === "all" || key.startsWith(selectedCrop);
    const matchesSearch =
      key.toLowerCase().includes(search.toLowerCase()) ||
      PATHOGEN_DETAILS[key].diagnosis.toLowerCase().includes(search.toLowerCase()) ||
      PATHOGEN_DETAILS[key].pathogen.toLowerCase().includes(search.toLowerCase());
    return matchesCrop && matchesSearch;
  });

  const activeDetail = selectedPathogenKey ? PATHOGEN_DETAILS[selectedPathogenKey] : null;

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="p-5 rounded-2xl border border-[#173050] bg-gradient-to-r from-[#0c1a2e] to-[#091728] shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-2 rounded-xl bg-cyan-950/80 border border-cyan-800 text-cyan-400">
              <BookOpen className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white">
                Agronomic Pathogen Encyclopedia
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Verified clinical reference library across 38 crop disease classes & 14 crops.
              </p>
            </div>
          </div>
        </div>

        <div className="text-xs text-cyan-400 font-bold bg-[#091524] px-3 py-1.5 rounded-xl border border-[#132a45]">
          38 Pathologies Indexed
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl border border-[#142640] bg-[#0c182a] flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search symptoms, pathogens, or crops..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-[#1c3656] bg-[#081220] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        {/* Crop Pills Scroll */}
        <div className="flex items-center space-x-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          {CROP_OPTIONS.slice(0, 8).map((crop) => (
            <button
              key={crop.id}
              onClick={() => setSelectedCrop(crop.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                selectedCrop === crop.id
                  ? "bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20"
                  : "bg-[#081220] text-slate-400 hover:text-white border border-[#142640]"
              }`}
            >
              <span>{crop.emoji} {crop.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Pathogen Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((key) => {
          const item = PATHOGEN_DETAILS[key];
          const [cropPart, diseasePart] = key.split("___");
          const isHealthy = key.toLowerCase().includes("healthy");

          return (
            <div
              key={key}
              onClick={() => setSelectedPathogenKey(key)}
              className="p-5 rounded-2xl border border-[#142640] bg-[#0c182a] hover:border-cyan-500/60 hover:bg-[#0f1f35] transition-all cursor-pointer flex flex-col justify-between group shadow-lg"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1">
                    <Sprout className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{cropPart.replace("_", " ")}</span>
                  </span>

                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      isHealthy
                        ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                        : "bg-amber-950 text-amber-400 border border-amber-800"
                    }`}
                  >
                    {isHealthy ? "Healthy Foliage" : "Pathogen"}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">
                  {diseasePart ? diseasePart.replace(/_/g, " ") : key}
                </h3>

                <div className="text-[11px] italic text-cyan-400 mt-1 font-mono">
                  {item.pathogen}
                </div>

                <p className="text-xs text-slate-300 mt-2 line-clamp-3 leading-relaxed">
                  {item.diagnosis}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-[#132238] flex items-center justify-between text-xs text-cyan-400 font-semibold group-hover:translate-x-0.5 transition-transform">
                <span>View Full Treatment & Symptoms</span>
                <ChevronRight className="w-4 h-4" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Pathogen Detail Modal */}
      {selectedPathogenKey && activeDetail && (
        <div
          onClick={() => setSelectedPathogenKey(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl rounded-3xl overflow-hidden border border-[#1a3152] bg-[#0a1626] p-6 sm:p-8 space-y-5 shadow-2xl relative"
          >
            <button
              onClick={() => setSelectedPathogenKey(null)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[#112238] border border-[#1d3b63] text-gray-400 hover:text-white flex items-center justify-center"
            >
              ✕
            </button>

            <div>
              <div className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
                Agronomic Pathogen Profile
              </div>
              <h3 className="text-2xl font-black text-white mt-1">
                {selectedPathogenKey.replace("___", " · ").replace(/_/g, " ")}
              </h3>
              <div className="text-xs text-slate-400 italic font-mono mt-0.5">
                Causal agent: {activeDetail.pathogen}
              </div>
            </div>

            <div className="space-y-4 text-xs text-slate-300">
              <div className="p-4 rounded-xl bg-[#070e19] border border-[#142640]">
                <strong className="text-cyan-300 block mb-1">Clinical Diagnosis & Symptoms:</strong>
                <p className="leading-relaxed">{activeDetail.diagnosis}</p>
              </div>

              <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-900/50">
                <strong className="text-emerald-300 block mb-1">Agronomist Recommendation for Farmers:</strong>
                <p className="leading-relaxed text-emerald-100/90">{activeDetail.farmersAdvice}</p>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedPathogenKey(null)}
                className="px-5 py-2.5 rounded-xl font-bold text-xs bg-cyan-500 text-slate-950 hover:bg-cyan-400"
              >
                Close Encyclopedia Entry
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
