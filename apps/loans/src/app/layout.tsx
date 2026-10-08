import { parseTheme, THEME_COOKIE } from "@nexbank/ui";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import type { ReactNode } from "react";
import { LoansChrome } from "@/components/loans-chrome";
import { getSession } from "@/server/session";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: { default: "Loans", template: "%s · NexBank Lending" },
  robots: { index: false, follow: false },
};

export default async function LoansRootLayout({ children }: { children: ReactNode }) {
  const [session, cookieStore] = await Promise.all([getSession(), cookies()]);
  const theme = parseTheme(cookieStore.get(THEME_COOKIE)?.value);

  return (
    <html lang="en" data-theme={theme}>
      <body>
        <Providers>
          <LoansChrome user={session && { name: session.name, role: session.role }} theme={theme}>
            {children}
          </LoansChrome>
        </Providers>
      </body>
    </html>
  );
}
