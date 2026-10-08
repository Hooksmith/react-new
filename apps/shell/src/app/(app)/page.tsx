import { analyticsKeys, loanKeys, makeQueryClient } from "@nexbank/api/client";
import { PageHeader } from "@nexbank/ui";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import type { Metadata } from "next";
import { getAnalytics, listLoans } from "@/server/db";
import { Dashboard } from "./dashboard";
import { RECENT_LOANS_QUERY } from "./queries";

export const metadata: Metadata = { title: "Dashboard" };

/**
 * Server Component: prefetches the dashboard queries in-process (no HTTP hop) and hands the
 * cache to the client via HydrationBoundary. First paint has real numbers; TanStack Query
 * then keeps them fresh on the client.
 */
export default async function DashboardPage() {
  const queryClient = makeQueryClient();
  await Promise.all([
    queryClient.prefetchQuery({ queryKey: analyticsKeys.overview(), queryFn: getAnalytics }),
    queryClient.prefetchQuery({
      queryKey: loanKeys.list(RECENT_LOANS_QUERY),
      queryFn: () => listLoans(RECENT_LOANS_QUERY),
    }),
  ]);

  return (
    <>
      <PageHeader
        title="Portfolio overview"
        description="Real-time view of the lending pipeline and portfolio health."
        actions={
          <a
            href="/loans/apply"
            className="bg-brand-600 hover:bg-brand-700 inline-flex h-10 items-center rounded-lg px-4 text-sm font-medium text-white"
          >
            New application
          </a>
        }
      />
      <HydrationBoundary state={dehydrate(queryClient)}>
        <Dashboard />
      </HydrationBoundary>
    </>
  );
}
