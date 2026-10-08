// Server-safe theme helpers (kept out of the "use client" toggle module so RSCs can call them).
export const THEME_COOKIE = "nb_theme";
export type Theme = "light" | "dark";

/** Reads the theme cookie on the server so <html data-theme> is correct on first paint. */
export function parseTheme(value: string | undefined): Theme {
  return value === "dark" ? "dark" : "light";
}
