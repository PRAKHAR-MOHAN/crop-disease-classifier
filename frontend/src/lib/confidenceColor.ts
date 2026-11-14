export interface ConfidenceTier {
  tier: "high" | "moderate" | "low";
  percent: number;
  labelKey: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  barGradient: string;
  dotColor: string;
  textColor: string;
}

export function getConfidenceTier(confidence: number): ConfidenceTier {
  const clamped = Math.max(0, Math.min(1, confidence));
  const percent = Math.round(clamped * 100);

  if (clamped >= 0.8) {
    return {
      tier: "high",
      percent,
      labelKey: "result.confidenceHigh",
      badgeBg: "bg-emerald-500/15 dark:bg-emerald-500/20",
      badgeText: "text-emerald-700 dark:text-emerald-300",
      badgeBorder: "border-emerald-500/30",
      barGradient: "from-emerald-500 via-teal-500 to-emerald-400",
      dotColor: "bg-emerald-500",
      textColor: "text-emerald-600 dark:text-emerald-400",
    };
  }

  if (clamped >= 0.5) {
    return {
      tier: "moderate",
      percent,
      labelKey: "result.confidenceModerate",
      badgeBg: "bg-amber-500/15 dark:bg-amber-500/20",
      badgeText: "text-amber-800 dark:text-amber-300",
      badgeBorder: "border-amber-500/30",
      barGradient: "from-amber-500 via-orange-400 to-yellow-400",
      dotColor: "bg-amber-500",
      textColor: "text-amber-600 dark:text-amber-400",
    };
  }

  return {
    tier: "low",
    percent,
    labelKey: "result.confidenceLow",
    badgeBg: "bg-rose-500/15 dark:bg-rose-500/20",
    badgeText: "text-rose-700 dark:text-rose-300",
    badgeBorder: "border-rose-500/30",
    barGradient: "from-rose-500 via-pink-500 to-red-400",
    dotColor: "bg-rose-500",
    textColor: "text-rose-600 dark:text-rose-400",
  };
}

