"use client";

import { Badge, Card, CardHeader, loanStatusLabel, LoanStatusBadge } from "@nexbank/ui";
import { useShallow } from "zustand/react/shallow";
import { useActivityStore } from "@/stores/activity-store";
import { useLoanStream } from "./use-loan-stream";

const timeFormat = new Intl.DateTimeFormat("en-US", {
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

export function LiveActivity() {
  useLoanStream();
  // useShallow: re-render only when these fields change, not on every store update.
  const { events, paused, connection, togglePaused } = useActivityStore(
    useShallow((s) => ({
      events: s.events,
      paused: s.paused,
      connection: s.connection,
      togglePaused: s.togglePaused,
    })),
  );
  const latest = events[0];

  return (
    <Card aria-labelledby="live-activity-title">
      <CardHeader
        titleId="live-activity-title"
        title="Live activity"
        description="Status changes across the portfolio, in real time"
        action={
          <div className="flex items-center gap-2">
            <Badge
              tone={
                connection === "open" ? "success" : connection === "error" ? "danger" : "warning"
              }
            >
              <span aria-hidden="true">●</span>
              {connection === "open" ? "Live" : connection === "error" ? "Offline" : "Connecting"}
            </Badge>
            <button
              type="button"
              onClick={togglePaused}
              aria-pressed={paused}
              className="text-brand-600 hover:bg-surface-muted rounded-md px-2 py-1 text-xs font-medium"
            >
              {paused ? "Resume" : "Pause"}
            </button>
          </div>
        }
      />

      {/* Polite live region: screen readers announce only the newest event, without interrupting. */}
      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {latest && !paused
          ? `${latest.reference} for ${latest.applicantName} moved to ${loanStatusLabel(latest.to)}`
          : ""}
      </p>

      {events.length === 0 ? (
        <p className="text-fg-muted py-8 text-center text-sm">Waiting for activity…</p>
      ) : (
        <ol className="divide-border max-h-96 divide-y overflow-y-auto">
          {events.map((e) => (
            <li key={e.id} className="flex items-center justify-between gap-3 py-3 text-sm">
              <div className="min-w-0">
                <a href={`/loans/${e.loanId}`} className="text-fg font-medium hover:underline">
                  {e.reference}
                </a>
                <p className="text-fg-muted truncate">{e.applicantName}</p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                <LoanStatusBadge status={e.to} />
                <time dateTime={e.at} className="text-fg-muted text-xs tabular-nums">
                  {timeFormat.format(new Date(e.at))}
                </time>
              </div>
            </li>
          ))}
        </ol>
      )}
    </Card>
  );
}
