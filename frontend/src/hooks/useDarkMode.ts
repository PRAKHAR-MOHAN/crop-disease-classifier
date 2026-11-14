import { useEffect, useState } from "react";

type Theme = "dark" | "light";

export function useDarkMode() {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === "undefined") return "dark";
    // Always default to deep emerald dark theme
    const saved = localStorage.getItem("cropai_theme") as Theme | null;
    return saved === "light" ? "light" : "dark";
  });

  useEffect(() => {
    const root = document.documentElement;
    // Keep dark class consistently active for full emerald sinking
    root.classList.add("dark");
    if (theme === "dark") {
      root.classList.remove("light-mode");
    } else {
      root.classList.add("light-mode");
    }
    localStorage.setItem("cropai_theme", theme);
  }, [theme]);

  const toggle = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  return {
    theme,
    isDark: theme === "dark",
    toggle,
    setTheme,
  };
}
