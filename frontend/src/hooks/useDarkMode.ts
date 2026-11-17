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
    const body = document.body;
    if (theme === "dark") {
      root.classList.add("dark");
      root.classList.remove("light");
      root.style.backgroundColor = "#04110a";
      root.style.colorScheme = "dark";
      if (body) {
        body.style.backgroundColor = "#04110a";
      }
    } else {
      root.classList.remove("dark");
      root.classList.add("light");
      root.style.backgroundColor = "#f8fafc";
      root.style.colorScheme = "light";
      if (body) {
        body.style.backgroundColor = "#f8fafc";
      }
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
