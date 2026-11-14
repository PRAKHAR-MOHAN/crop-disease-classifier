import React from "react";

export const ResultSkeleton: React.FC = () => {
  return (
    <div className="w-full max-w-xl mx-auto rounded-3xl overflow-hidden border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#0c2417] shadow-xl p-6 space-y-5 animate-pulse">
      {/* Header bar skeleton */}
      <div className="flex items-center space-x-3">
        <div className="w-14 h-14 rounded-2xl bg-gray-200 dark:bg-gray-800" />
        <div className="space-y-2 flex-1">
          <div className="h-5 bg-gray-200 dark:bg-gray-800 rounded-md w-3/4" />
          <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded-md w-1/2" />
        </div>
      </div>

      {/* Confidence bar skeleton */}
      <div className="space-y-2 p-4 bg-gray-100 dark:bg-gray-900/50 rounded-2xl">
        <div className="flex justify-between">
          <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-28" />
          <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-12" />
        </div>
        <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded-full w-full" />
      </div>

      {/* Diagnosis paragraph skeleton */}
      <div className="space-y-2 pt-2">
        <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-20" />
        <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-full" />
        <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-5/6" />
      </div>

      {/* Treatment skeleton */}
      <div className="space-y-2 pt-2">
        <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-24" />
        <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-full" />
      </div>
    </div>
  );
};

