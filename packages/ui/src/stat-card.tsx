import type { ReactNode } from "react";
import { cn } from "./cn";

export function StatCard({
  label,
  value,
  delta,
  trend = "flat",
  footnote,
}: {
  label: string;
  value: ReactNode;
  delta?: string;
  trend?: "up" | "down" | "flat";
  footnote?: string;
}) {
  return (
    <div className="border-border bg-surface rounded-xl border p-5 shadow-sm">
      <dt className="text-fg-muted text-sm font-medium">{label}</dt>
      <dd className="mt-2">
        <div className="flex items-baseline gap-2">
          <span className="text-fg text-2xl font-semibold tabular-nums tracking-tight">
            {value}
          </span>
          {delta && (
            <span
              className={cn(
                "text-xs font-medium",
                trend === "up" && "text-success",
                trend === "down" && "text-danger",
                trend === "flat" && "text-fg-muted",
              )}
            >
              <span aria-hidden="true">{trend === "up" ? "▲" : trend === "down" ? "▼" : "–"}</span>{" "}
              <span className="sr-only">
                {trend === "up" ? "up" : trend === "down" ? "down" : "unchanged"}
              </span>
              {delta}
            </span>
          )}
        </div>
        {footnote && <p className="text-fg-muted mt-1 text-xs">{footnote}</p>}
      </dd>
    </div>
  );
}
