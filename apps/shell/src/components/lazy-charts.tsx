"use client";

import { Skeleton } from "@nexbank/ui";
import dynamic from "next/dynamic";

/**
 * Recharts is ~100 KB gz. Loading it lazily keeps it out of the initial JS bundle so the
 * KPI tiles (server-rendered) paint immediately and charts stream in after hydration.
 */
const loading = () => <Skeleton className="h-72 w-full" />;

export const VolumeChart = dynamic(() => import("./charts").then((m) => m.VolumeChart), {
  ssr: false,
  loading,
});
export const StatusChart = dynamic(() => import("./charts").then((m) => m.StatusChart), {
  ssr: false,
  loading,
});
export const CreditBandChart = dynamic(() => import("./charts").then((m) => m.CreditBandChart), {
  ssr: false,
  loading,
});
