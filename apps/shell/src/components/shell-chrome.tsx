"use client";

import { AppShell, ThemeToggle, type Theme } from "@nexbank/ui";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

export function ShellChrome({
  user,
  theme,
  children,
}: {
  user: { name: string; role: string };
  theme: Theme;
  children: ReactNode;
}) {
  const pathname = usePathname();
  return (
    <AppShell
      currentZone="shell"
      activeHref={pathname}
      LinkComponent={Link}
      user={user}
      headerSlot={<ThemeToggle initial={theme} />}
    >
      {children}
    </AppShell>
  );
}
