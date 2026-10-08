import type { LoanStatus } from "@nexbank/api";
import type { ReactNode } from "react";
import { cn } from "./cn";

const tones = {
  neutral: "bg-surface-muted text-fg-muted ring-border",
  info: "bg-blue-50 text-blue-800 ring-blue-200 dark:bg-blue-950 dark:text-blue-200 dark:ring-blue-900",
  warning:
    "bg-amber-50 text-amber-800 ring-amber-200 dark:bg-amber-950 dark:text-amber-200 dark:ring-amber-900",
  success:
    "bg-green-50 text-green-800 ring-green-200 dark:bg-green-950 dark:text-green-200 dark:ring-green-900",
  danger: "bg-red-50 text-red-800 ring-red-200 dark:bg-red-950 dark:text-red-200 dark:ring-red-900",
} as const;

export function Badge({
  tone = "neutral",
  className,
  children,
}: {
  tone?: keyof typeof tones;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

const STATUS_META: Record<LoanStatus, { label: string; tone: keyof typeof tones; icon: string }> = {
  SUBMITTED: { label: "Submitted", tone: "neutral", icon: "○" },
  UNDER_REVIEW: { label: "Under review", tone: "info", icon: "◐" },
  APPROVED: { label: "Approved", tone: "success", icon: "✓" },
  REJECTED: { label: "Rejected", tone: "danger", icon: "✕" },
  DISBURSED: { label: "Disbursed", tone: "warning", icon: "●" },
};

export const loanStatusLabel = (status: LoanStatus) => STATUS_META[status].label;

/** Status is conveyed by text + icon, never colour alone (WCAG 1.4.1). */
export function LoanStatusBadge({ status }: { status: LoanStatus }) {
  const meta = STATUS_META[status];
  return (
    <Badge tone={meta.tone}>
      <span aria-hidden="true">{meta.icon}</span>
      {meta.label}
    </Badge>
  );
}
