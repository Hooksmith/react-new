"use client";

import { AppShell, ThemeToggle, type Theme } from "@nexbank/ui";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentProps, ReactNode } from "react";

export const BASE_PATH = "/loans";

/**
 * Shared nav items use public URLs (`/loans/apply`). next/link in this zone auto-prefixes the
 * basePath, so strip it first to avoid `/loans/loans/apply`.
 */
export function ZoneLink({ href, ...props }: ComponentProps<typeof Link> & { href: string }) {
  const local = href.startsWith(BASE_PATH) ? href.slice(BASE_PATH.length) || "/" : href;
  return <Link href={local} {...props} />;
}

export function LoansChrome({
  user,
  theme,
  children,
}: {
  user: { name: string; role: string } | null;
  theme: Theme;
  children: ReactNode;
}) {
  // usePathname() omits the basePath; nav items are keyed by public URL.
  const pathname = usePathname();
  const activeHref = pathname === "/" ? BASE_PATH : `${BASE_PATH}${pathname}`;
  return (
    <AppShell
      currentZone="loans"
      activeHref={activeHref}
      LinkComponent={ZoneLink}
      user={user}
      headerSlot={<ThemeToggle initial={theme} />}
    >
      {children}
    </AppShell>
  );
}
