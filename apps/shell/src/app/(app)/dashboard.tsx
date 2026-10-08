"use client";

import { formatMoney, formatPercent } from "@nexbank/api";
import { useAnalytics, useLoans } from "@nexbank/api/client";
import { Card, CardHeader, ErrorState, LoanStatusBadge, Skeleton, StatCard } from "@nexbank/ui";
import { LiveActivity } from "@/components/live-activity";
import { StatusChart, VolumeChart } from "@/components/lazy-charts";
import { RECENT_LOANS_QUERY } from "./queries";

export function Dashboard() {
  const analytics = useAnalytics();
  const recent = useLoans(RECENT_LOANS_QUERY);

  if (analytics.isError)
    return <ErrorState message={analytics.error.message} onRetry={() => analytics.refetch()} />;
  const data = analytics.data;

  return (
    <div className="space-y-6">
      <section aria-label="Key metrics">
        {data ? (
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Outstanding portfolio"
              value={formatMoney(data.summary.totalOutstanding, "USD", true)}
              footnote={`${data.summary.activeLoans} active loans`}
            />
            <StatCard
              label="Approval rate"
              value={formatPercent(data.summary.approvalRate)}
              footnote="Of decided applications"
            />
            <StatCard
              label="Avg. credit score"
              value={data.summary.averageCreditScore}
              footnote="Across all applicants"
            />
            <StatCard
              label="Non-performing ratio"
              value={formatPercent(data.summary.nonPerformingRatio)}
              footnote={`${data.summary.pendingReview} awaiting review`}
            />
          </dl>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} className="h-28" />
            ))}
          </div>
        )}
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2" aria-labelledby="volume-title">
          <CardHeader
            titleId="volume-title"
            title="Loan volume"
            description="Disbursed vs repaid, last 12 months"
          />
          {data ? <VolumeChart data={data.monthlyVolume} /> : <Skeleton className="h-72" />}
        </Card>
        <Card aria-labelledby="pipeline-title">
          <CardHeader
            titleId="pipeline-title"
            title="Pipeline"
            description="Applications by status"
          />
          {data ? <StatusChart data={data.statusBreakdown} /> : <Skeleton className="h-72" />}
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2" aria-labelledby="recent-title">
          <CardHeader
            titleId="recent-title"
            title="Recent applications"
            action={
              <a href="/loans" className="text-brand-600 text-sm font-medium hover:underline">
                View all
              </a>
            }
          />
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-fg-muted">
                <tr>
                  <th scope="col" className="pb-2 font-medium">
                    Reference
                  </th>
                  <th scope="col" className="pb-2 font-medium">
                    Applicant
                  </th>
                  <th scope="col" className="pb-2 text-right font-medium">
                    Amount
                  </th>
                  <th scope="col" className="pb-2 font-medium">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-border divide-y">
                {recent.data?.items.map((loan) => (
                  <tr key={loan.id}>
                    <td className="py-3">
                      <a
                        href={`/loans/${loan.id}`}
                        className="text-brand-600 font-medium hover:underline"
                      >
                        {loan.reference}
                      </a>
                    </td>
                    <td className="py-3">{loan.applicantName}</td>
                    <td className="py-3 text-right tabular-nums">
                      {formatMoney(loan.amount, loan.currency)}
                    </td>
                    <td className="py-3">
                      <LoanStatusBadge status={loan.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
        <LiveActivity />
      </div>
    </div>
  );
}
