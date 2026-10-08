import { parseTheme, THEME_COOKIE } from "@nexbank/ui";
import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import type { ReactNode } from "react";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: { default: "NexBank Lending", template: "%s · NexBank Lending" },
  description: "Loan origination, credit decisioning and portfolio analytics.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#1d4ed8",
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const theme = parseTheme((await cookies()).get(THEME_COOKIE)?.value);
  return (
    <html lang="en" data-theme={theme}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
