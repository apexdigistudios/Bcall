"use client";

import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import { useTheme } from "./ThemeProvider";

export function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <AnimatedThemeToggler
      type="button"
      className={`theme-toggle ${className}`}
      theme={theme ?? "light"}
      onThemeChange={setTheme}
      duration={400}
      variant="circle"
      aria-label={`Switch to ${isDark ? "light" : "dark"} theme`}
      title={`Switch to ${isDark ? "light" : "dark"} theme`}
    />
  );
}