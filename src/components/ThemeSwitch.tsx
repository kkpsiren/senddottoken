"use client";
import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

export type ThemeMode = "auto" | "light" | "dark";

function getInitial(): ThemeMode {
  if (typeof window === "undefined") return "auto";
  const stored = window.localStorage.getItem("themeMode") as ThemeMode | null;
  return stored ?? "auto";
}

export const ThemeSwitch = () => {
  const [mode, setMode] = useState<ThemeMode>("auto");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setMode(getInitial());
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (mode === "auto") {
      const mql = window.matchMedia("(prefers-color-scheme: dark)");
      const apply = () => {
        document.documentElement.classList.toggle("dark", mql.matches);
      };
      apply();
      mql.addEventListener("change", apply);
      return () => mql.removeEventListener("change", apply);
    }
    document.documentElement.classList.toggle("dark", mode === "dark");
  }, [mode, mounted]);

  useEffect(() => {
    if (mounted) window.localStorage.setItem("themeMode", mode);
  }, [mode, mounted]);

  const options: [ThemeMode, React.ReactNode][] = [
    ["auto", "Auto"],
    ["light", <Sun size={16} key="sun" />],
    ["dark", <Moon size={16} key="moon" />],
  ];

  function next(current: ThemeMode): ThemeMode {
    if (current === "auto") return "light";
    if (current === "light") return "dark";
    return "auto";
  }

  if (!mounted) return null;

  if (typeof window !== "undefined" && window.innerWidth < 300) {
    return (
      <button
        className="btn btn-outline btn-sm"
        onClick={() => setMode(next(mode))}
        aria-label="Cycle theme"
      >
        {mode}
      </button>
    );
  }

  return (
    <div className="theme-switch">
      {options.map(([val, label]) => (
        <button
          key={val}
          onClick={() => setMode(val)}
          className={`seg-btn btn-sm ${mode === val ? "active" : ""}`}
          aria-pressed={mode === val}
        >
          {label}
        </button>
      ))}
    </div>
  );
};
