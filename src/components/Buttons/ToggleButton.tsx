"use client";

import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

export default function ToggleButton() {
  const [mounted, setMounted] = useState(false);

  // 1. On mount, check if user has a preference saved or use system default
  // 1. Handle initial mounting
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const [theme, setTheme] = useState<"light" | "dark">(() => {
    // 1. Since this runs during the very first render, we check for 'window'
    // (to prevent Next.js server-side errors)
    if (typeof window !== "undefined") {
      const savedTheme = localStorage.getItem("theme") as
        | "light"
        | "dark"
        | null;
      const systemPrefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)",
      ).matches;
      return savedTheme || (systemPrefersDark ? "dark" : "light");
    }
    return "light"; // Default for Server-Side Rendering
  });

  // 2. Now the useEffect ONLY handles the DOM attribute side-effect
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  // Don't render UI that depends on 'theme' until mounted
  if (!mounted) return null;

  // 2. Function to switch themes
  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
    localStorage.setItem("theme", newTheme);
  };

  return (
    <button
      onClick={toggleTheme}
      style={{
        padding: "0.5rem",
        cursor: "pointer",
        borderRadius: "50%",
        border: "1px solid var(--foreground)",
        background: "var(--background)",
        color: "var(--foreground)",
        transition: "all 0.2s ease",
        height: "2.4rem",
        width: "2.4rem",
        outline: "none",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "fixed",
        bottom: "2rem",
        right: "2rem",
      }}
    >
      {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
    </button>
  );
}
