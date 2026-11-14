import React, { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Search, ChevronDown, Check } from "lucide-react";
import { CROP_METADATA } from "@/lib/parseClassName";
import { useClassesQuery } from "@/api/hooks";

interface CropSelectProps {
  selectedCrop: string;
  onSelectCrop: (cropId: string) => void;
}

export const CropSelect: React.FC<CropSelectProps> = ({
  selectedCrop,
  onSelectCrop,
}) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const { data: classesData } = useClassesQuery();

  // Extract unique crops from backend classes or fallback metadata
  const cropsList = React.useMemo(() => {
    const cropsMap = new Map<string, { id: string; name: string; hindi: string; emoji: string }>();

    // Seed from known metadata
    Object.entries(CROP_METADATA).forEach(([key, val]) => {
      cropsMap.set(key, { id: key, name: val.name, hindi: val.hindi, emoji: val.emoji });
    });

    // If backend provided classes, ensure all crops are present
    if (classesData?.classes) {
      classesData.classes.forEach((cls) => {
        if (cls.includes("___")) {
          const rawCrop = cls.split("___")[0];
          if (!cropsMap.has(rawCrop)) {
            cropsMap.set(rawCrop, {
              id: rawCrop,
              name: rawCrop.replace(/_/g, " "),
              hindi: rawCrop,
              emoji: "🌿",
            });
          }
        }
      });
    }

    return Array.from(cropsMap.values());
  }, [classesData]);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Focus search input when opening
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const filteredCrops = cropsList.filter((c) => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return (
      c.name.toLowerCase().includes(q) ||
      c.hindi.toLowerCase().includes(q) ||
      c.id.toLowerCase().includes(q)
    );
  });

  const currentSelection =
    selectedCrop === "all"
      ? null
      : cropsList.find((c) => c.id === selectedCrop);

  return (
    <div className="space-y-1.5" ref={containerRef}>
      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">
        🌱 {t("cropSelect.label")}
      </label>

      {/* Main trigger button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full py-2.5 px-3.5 rounded-xl border border-[#1b4d32] bg-[#0c2417] text-left flex items-center justify-between text-xs sm:text-sm font-semibold text-white hover:border-[#22c55e] focus:outline-none focus:ring-2 focus:ring-[#22c55e] transition min-h-[44px]"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="flex items-center space-x-2 truncate">
          <span className="text-base">{currentSelection?.emoji || "🔍"}</span>
          <span className="truncate">
            {currentSelection
              ? `${currentSelection.name} (${currentSelection.hindi})`
              : t("cropSelect.autoDetect")}
          </span>
        </span>
        <ChevronDown
          className={`w-4 h-4 text-emerald-400 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Combobox Dropdown Popover */}
      {isOpen && (
        <div className="relative z-30">
          <div className="absolute top-1 left-0 right-0 bg-[#0a2215] border border-[#1b4d32] rounded-2xl shadow-2xl p-2 space-y-2 max-h-72 flex flex-col animate-in fade-in zoom-in-95 duration-150">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-emerald-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("cropSelect.searchPlaceholder")}
                className="w-full pl-9 pr-3 py-2 rounded-xl text-xs font-medium border border-[#1b4d32] bg-[#05140a] text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#22c55e]"
              />
            </div>

            {/* List */}
            <div className="overflow-y-auto flex-1 space-y-1 pr-1">
              {/* Option: Auto-Detect */}
              <button
                type="button"
                onClick={() => {
                  onSelectCrop("all");
                  setIsOpen(false);
                  setSearch("");
                }}
                className={`w-full py-2 px-3 rounded-lg text-left text-xs font-semibold flex items-center justify-between transition min-h-[38px] ${
                  selectedCrop === "all"
                    ? "bg-[#143d26] text-[#4ade80] border border-[#235f3d]"
                    : "hover:bg-[#113521] text-gray-200"
                }`}
              >
                <span className="flex items-center space-x-2">
                  <span>🔍</span>
                  <span>{t("cropSelect.autoDetect")}</span>
                </span>
                {selectedCrop === "all" && <Check className="w-3.5 h-3.5 text-[#22c55e]" />}
              </button>

              {/* Crop Items */}
              {filteredCrops.length > 0 ? (
                filteredCrops.map((crop) => {
                  const isSelected = selectedCrop === crop.id;
                  return (
                    <button
                      key={crop.id}
                      type="button"
                      onClick={() => {
                        onSelectCrop(crop.id);
                        setIsOpen(false);
                        setSearch("");
                      }}
                      className={`w-full py-2 px-3 rounded-lg text-left text-xs font-medium flex items-center justify-between transition min-h-[38px] ${
                        isSelected
                          ? "bg-[#143d26] text-[#4ade80] font-bold border border-[#235f3d]"
                          : "hover:bg-[#113521] text-gray-200"
                      }`}
                    >
                      <span className="flex items-center space-x-2 truncate">
                        <span>{crop.emoji}</span>
                        <span className="font-semibold text-white">
                          {crop.name}
                        </span>
                        <span className="text-emerald-400/80 text-[11px]">
                          ({crop.hindi})
                        </span>
                      </span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-[#22c55e]" />}
                    </button>
                  );
                })
              ) : (
                <div className="py-4 text-center text-xs text-gray-400">
                  {t("cropSelect.noMatch")}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Localized hint */}
      <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-snug">
        💡 {t("cropSelect.hint")}
      </p>
    </div>
  );
};

