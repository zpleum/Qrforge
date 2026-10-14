"use client";
import { Moon, Sun } from "lucide-react";
import { btnGhost } from "@/lib/ui";
import { useTheme } from "./ThemeProvider";

export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  return (
    <button type="button" className={btnGhost} onClick={toggle} aria-label={theme === "dark" ? "โหมดสว่าง" : "โหมดมืด"}>
      {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}
