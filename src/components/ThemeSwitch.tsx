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
  const [mode, setMode] = useState<ThemeMode>(getInitial);

  // apply theme side‑effects
  useEffect(() => {
    if (mode === "auto") {
      // follow system
      const mql = window.matchMedia("(prefers-color-scheme: dark)");
      const apply = () => {
        document.documentElement.classList.toggle("dark", mql.matches);
      };
      apply();
      mql.addEventListener("change", apply);
      return () => mql.removeEventListener("change", apply);
    }
    document.documentElement.classList.toggle("dark", mode === "dark");
  }, [mode]);

  // persist
  useEffect(() => {
    window.localStorage.setItem("themeMode", mode);
  }, [mode]);

  const options: [ThemeMode, React.ReactNode][] = [
    ["auto", "Auto"],
    ["light", <Sun size={16} key="sun" />],
    ["dark", <Moon size={16} key="moon" />],
  ];

  return (
    <div className="theme-switch">
      {options.map(([val, label]) => (
        <button
          key={val}
          onClick={() => setMode(val)}
          className={`seg-btn ${mode === val ? "active" : ""}`}
          aria-pressed={mode === val}
        >
          {label}
        </button>
      ))}
    </div>
  );
};
