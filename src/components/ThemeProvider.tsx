"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type Theme = "light" | "dark";

const ThemeContext = createContext<{
  theme: Theme | null;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
} | null>(null);

function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
  document.documentElement.classList.toggle("light", theme === "light");
  document.documentElement.dataset.theme = theme;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme | null>(null);

  useEffect(() => {
    const savedTheme = window.localStorage.getItem("yelllo-theme");
    const initialTheme: Theme = savedTheme === "light" || savedTheme === "dark"
      ? savedTheme
      : window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    applyTheme(initialTheme);
    setThemeState(initialTheme);

    const syncTheme = (event: StorageEvent) => {
      if (event.key !== "yelllo-theme" || (event.newValue !== "light" && event.newValue !== "dark")) return;
      applyTheme(event.newValue);
      setThemeState(event.newValue);
    };
    window.addEventListener("storage", syncTheme);
    return () => window.removeEventListener("storage", syncTheme);
  }, []);

  function setTheme(nextTheme: Theme) {
    applyTheme(nextTheme);
    window.localStorage.setItem("yelllo-theme", nextTheme);
    setThemeState(nextTheme);
  }

  function toggleTheme() {
    const currentTheme = theme ?? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    setTheme(currentTheme === "dark" ? "light" : "dark");
  }

  return <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within ThemeProvider");
  return context;
}