"use client";

import { formatPercent } from "@nexbank/api";
import { useCreditBands } from "@nexbank/api/client";
import { Card, CardHeader, ErrorState, Skeleton, StatCard } from "@nexbank/ui";
import { CreditBandChart } from "@/components/lazy-charts";

export function CreditAnalytics() {
  const { data, isPending, isError, error, refetch } = useCreditBands();

  if (isError) return <ErrorState message={error.message} onRetry={() => refetch()} />;

  const total = data?.reduce((s, b) => s + b.count, 0) ?? 0;
  const weightedDefault =
    data && total ? data.reduce((s, b) => s + b.defaultRate * b.count, 0) / total : 0;
  const prime = data?.filter((b) => b.min >= 670).reduce((s, b) => s + b.count, 0) ?? 0;

  return (
    <div className="space-y-6">
      {isPending ? (
        <div className="grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      ) : (
        <dl className="grid gap-4 sm:grid-cols-3">
          <StatCard label="Applicants scored" value={total} />
          <StatCard label="Prime share (≥ 670)" value={formatPercent(total ? prime / total : 0)} />
          <StatCard label="Expected default rate" value={formatPercent(weightedDefault, 2)} />
        </dl>
      )}
      <Card aria-labelledby="bands-title">
        <CardHeader
          titleId="bands-title"
          title="Credit score distribution"
          description="Bands follow FICO-style ranges: Poor < 580 ≤ Fair < 670 ≤ Good < 750 ≤ Excellent"
        />
        {data ? <CreditBandChart data={data} /> : <Skeleton className="h-72" />}
      </Card>
    </div>
  );
}
