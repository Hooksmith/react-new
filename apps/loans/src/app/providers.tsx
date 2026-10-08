"use client";

import { getQueryClient } from "@nexbank/api/client";
import { QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={getQueryClient()}>{children}</QueryClientProvider>;
}
