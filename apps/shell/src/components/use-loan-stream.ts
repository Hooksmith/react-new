"use client";

import { LoanEventSchema } from "@nexbank/api";
import { analyticsKeys, patchLoanInCache } from "@nexbank/api/client";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useActivityStore } from "@/stores/activity-store";

/**
 * Subscribes to the SSE stream and fans each event out to:
 *  - the TanStack Query cache (so any visible table/detail updates in place), and
 *  - the Zustand activity store (for the live feed).
 */
export function useLoanStream() {
  const queryClient = useQueryClient();
  const push = useActivityStore((s) => s.push);
  const setConnection = useActivityStore((s) => s.setConnection);

  useEffect(() => {
    const source = new EventSource("/api/loans/stream");
    let invalidateTimer: ReturnType<typeof setTimeout> | undefined;

    source.onopen = () => setConnection("open");
    source.onerror = () =>
      setConnection(source.readyState === EventSource.CLOSED ? "error" : "connecting");

    source.addEventListener("loan", (message) => {
      const parsed = LoanEventSchema.safeParse(JSON.parse((message as MessageEvent<string>).data));
      if (!parsed.success) return; // ignore malformed events rather than crash the dashboard
      const event = parsed.data;

      patchLoanInCache(queryClient, event.loanId, { status: event.to, updatedAt: event.at });
      push(event);

      // Debounce aggregate refreshes so a burst of events triggers a single refetch.
      clearTimeout(invalidateTimer);
      invalidateTimer = setTimeout(() => {
        void queryClient.invalidateQueries({ queryKey: analyticsKeys.all });
      }, 1_000);
    });

    return () => {
      clearTimeout(invalidateTimer);
      source.close();
    };
  }, [queryClient, push, setConnection]);
}
