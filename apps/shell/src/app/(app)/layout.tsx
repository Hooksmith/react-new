import { parseTheme, THEME_COOKIE } from "@nexbank/ui";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { ShellChrome } from "@/components/shell-chrome";
import { getSession } from "@/server/auth";

export default async function AuthenticatedLayout({ children }: { children: ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");
  const theme = parseTheme((await cookies()).get(THEME_COOKIE)?.value);

  return (
    <ShellChrome user={{ name: session.name, role: session.role }} theme={theme}>
      {children}
    </ShellChrome>
  );
}
