"use client";

import { useState, type ComponentType, type ReactNode } from "react";
import { cn } from "./cn";

export type Zone = "shell" | "loans";

export interface NavItem {
  href: string;
  label: string;
  /** Which Next.js zone owns this route. */
  zone: Zone;
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Dashboard", zone: "shell" },
  { href: "/analytics", label: "Analytics", zone: "shell" },
  { href: "/loans", label: "Loans", zone: "loans" },
  { href: "/loans/apply", label: "New application", zone: "loans" },
];

type LinkLike = ComponentType<{
  href: string;
  className?: string;
  children: ReactNode;
  "aria-current"?: "page";
}>;

interface AppShellProps {
  currentZone: Zone;
  activeHref: string;
  /** next/link for in-zone links (soft navigation). */
  LinkComponent: LinkLike;
  user?: { name: string; role: string } | null;
  headerSlot?: ReactNode;
  children: ReactNode;
}

/**
 * Shared chrome rendered identically by every zone.
 * Links *within* a zone use next/link (client-side navigation); links *across* zones must be
 * plain <a> tags, because each zone is a separate Next.js app and needs a full page load.
 */
export function AppShell({
  currentZone,
  activeHref,
  LinkComponent,
  user,
  headerSlot,
  children,
}: AppShellProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  const renderLink = (item: NavItem, className: string) => {
    const isActive = item.href === activeHref;
    const props = {
      href: item.href,
      className: cn(
        className,
        isActive && "bg-brand-50 text-brand-700 dark:bg-brand-900 dark:text-brand-100",
      ),
      "aria-current": isActive ? ("page" as const) : undefined,
    };
    return item.zone === currentZone ? (
      <LinkComponent {...props}>{item.label}</LinkComponent>
    ) : (
      <a {...props}>{item.label}</a>
    );
  };

  const linkClass =
    "block rounded-lg px-3 py-2 text-sm font-medium text-fg-muted hover:bg-surface-muted hover:text-fg";

  return (
    <div className="min-h-dvh">
      <a
        href="#main"
        className="focus:bg-brand-600 sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-50 focus:rounded-lg focus:px-4 focus:py-2 focus:text-white"
      >
        Skip to main content
      </a>

      <header className="border-border bg-surface/90 sticky top-0 z-30 border-b backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6">
          <a href="/" className="text-fg flex items-center gap-2 font-semibold">
            <span
              aria-hidden="true"
              className="bg-brand-600 grid size-8 place-items-center rounded-lg text-white"
            >
              N
            </span>
            NexBank <span className="text-fg-muted hidden sm:inline">Lending</span>
          </a>

          <nav aria-label="Primary" className="ml-6 hidden md:block">
            <ul className="flex gap-1">
              {NAV_ITEMS.map((item) => (
                <li key={item.href}>{renderLink(item, linkClass)}</li>
              ))}
            </ul>
          </nav>

          <div className="ml-auto flex items-center gap-3">
            {headerSlot}
            {user && (
              <div className="hidden text-right sm:block">
                <p className="text-fg text-sm font-medium">{user.name}</p>
                <p className="text-fg-muted text-xs capitalize">{user.role.replace("_", " ")}</p>
              </div>
            )}
            <form action="/api/auth/logout" method="post">
              <button
                type="submit"
                className="text-fg-muted hover:bg-surface-muted rounded-lg px-3 py-2 text-sm"
              >
                Sign out
              </button>
            </form>
            <button
              type="button"
              className="text-fg-muted hover:bg-surface-muted rounded-lg p-2 md:hidden"
              aria-expanded={menuOpen}
              aria-controls="mobile-nav"
              onClick={() => setMenuOpen((o) => !o)}
            >
              <span className="sr-only">{menuOpen ? "Close menu" : "Open menu"}</span>
              <svg aria-hidden="true" viewBox="0 0 20 20" className="size-5" fill="currentColor">
                <path d="M3 5h14v2H3zM3 9h14v2H3zM3 13h14v2H3z" />
              </svg>
            </button>
          </div>
        </div>

        {menuOpen && (
          <nav
            id="mobile-nav"
            aria-label="Primary mobile"
            className="border-border border-t px-4 py-2 md:hidden"
          >
            <ul>
              {NAV_ITEMS.map((item) => (
                <li key={item.href}>{renderLink(item, linkClass)}</li>
              ))}
            </ul>
          </nav>
        )}
      </header>

      <main
        id="main"
        tabIndex={-1}
        className="mx-auto max-w-7xl px-4 py-8 focus:outline-none sm:px-6"
      >
        {children}
      </main>
    </div>
  );
}
