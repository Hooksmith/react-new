"use client";

import { useState } from "react";
import { THEME_COOKIE, type Theme } from "./theme";

/**
 * Theme preference is stored in a cookie rather than localStorage because it must be visible
 * to every zone *and* to the server renderer of each zone.
 */
export function ThemeToggle({ initial }: { initial: Theme }) {
  const [theme, setTheme] = useState<Theme>(initial);

  const toggle = () => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.dataset.theme = next;
    document.cookie = `${THEME_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={theme === "dark"}
      className="text-fg-muted hover:bg-surface-muted rounded-lg p-2"
    >
      <span className="sr-only">Dark mode</span>
      <span aria-hidden="true">{theme === "dark" ? "☾" : "☀"}</span>
    </button>
  );
}
