"use client";

import { Moon, Sun } from "lucide-react";
import { useMeridian } from "@/lib/store";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggleTheme } = useMeridian();
  return (
    <button
      onClick={toggleTheme}
      title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      aria-label="Toggle color theme"
      className={cn(
        "flex size-8 items-center justify-center rounded-full border border-hairline bg-surface-1 text-text-dim hover:border-hairline-strong hover:text-text",
        className,
      )}
    >
      {theme === "dark" ? <Sun size={14.5} /> : <Moon size={14.5} />}
    </button>
  );
}
