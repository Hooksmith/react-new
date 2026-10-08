"use client";

import {
  ALLOWED_TRANSITIONS,
  canTransition,
  creditRating,
  formatMoney,
  formatPercent,
  monthlyInstallment,
  PRODUCT_RULES,
  type LoanStatus,
} from "@nexbank/api";
import { ApiError, useCurrentUser, useLoan, useUpdateLoanStatus } from "@nexbank/api/client";
import {
  Button,
  Card,
  CardHeader,
  creditScoreTone,
  EmptyState,
  ErrorState,
  loanStatusLabel,
  LoanStatusBadge,
  PageHeader,
  Skeleton,
} from "@nexbank/ui";
import Link from "next/link";
import { useState, type ReactNode } from "react";

const ACTION_LABEL: Record<LoanStatus, string> = {
  SUBMITTED: "Submit",
  UNDER_REVIEW: "Start review",
  APPROVED: "Approve",
  REJECTED: "Reject",
  DISBURSED: "Disburse funds",
};

export function LoanDetail({ id }: { id: string }) {
  const loan = useLoan(id);
  const me = useCurrentUser();
  const update = useUpdateLoanStatus(id);
  const [announcement, setAnnouncement] = useState("");

  if (loan.isPending) {
    return (
      <div className="space-y-4" aria-busy="true">
        <span className="sr-only">Loading loan…</span>
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-64" />
      </div>
    );
  }
  if (loan.isError) {
    return loan.error instanceof ApiError && loan.error.status === 404 ? (
      <EmptyState
        title="Loan not found"
        action={
          <Link href="/" className="text-brand-600 hover:underline">
            Back to loans
          </Link>
        }
      />
    ) : (
      <ErrorState message={loan.error.message} onRetry={() => loan.refetch()} />
    );
  }

  const l = loan.data;
  const rule = PRODUCT_RULES[l.product];
  const installment = monthlyInstallment(l.amount, l.interestRate, l.termMonths);
  const dsr = installment / l.monthlyIncome;
  const actions = me.data
    ? ALLOWED_TRANSITIONS[l.status].filter((to) => canTransition(me.data.role, l.status, to))
    : [];
  const restricted = me.data && ALLOWED_TRANSITIONS[l.status].length > actions.length;

  const changeStatus = (to: LoanStatus) => {
    update.mutate(
      { status: to },
      {
        onSuccess: () => setAnnouncement(`Loan ${l.reference} is now ${loanStatusLabel(to)}`),
        onError: (err) => setAnnouncement(`Update failed: ${err.message}`),
      },
    );
  };

  return (
    <>
      <nav aria-label="Breadcrumb" className="mb-4 text-sm">
        <Link href="/" className="text-fg-muted hover:text-fg">
          Loans
        </Link>
        <span aria-hidden="true" className="text-fg-muted mx-2">
          /
        </span>
        <span aria-current="page">{l.reference}</span>
      </nav>

      <PageHeader
        title={l.applicantName}
        description={`${l.reference} · ${rule.label} · applied ${new Date(l.createdAt).toLocaleDateString("en-GB")}`}
        actions={<LoanStatusBadge status={l.status} />}
      />

      <p role="status" aria-live="polite" className="sr-only">
        {announcement}
      </p>
      {update.isError && (
        <div className="mb-6">
          <ErrorState message={update.error.message} />
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2" aria-labelledby="terms-title">
          <CardHeader titleId="terms-title" title="Loan terms" />
          <dl className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm sm:grid-cols-3">
            <Detail label="Principal" value={formatMoney(l.amount, l.currency)} />
            <Detail label="Term" value={`${l.termMonths} months`} />
            <Detail label="Interest rate (p.a.)" value={formatPercent(l.interestRate, 2)} />
            <Detail label="Monthly installment" value={formatMoney(installment, l.currency)} />
            <Detail
              label="Total repayable"
              value={formatMoney(installment * l.termMonths, l.currency)}
            />
            <Detail label="National ID" value={l.nationalIdMasked} />
          </dl>
        </Card>

        <Card aria-labelledby="risk-title">
          <CardHeader titleId="risk-title" title="Risk assessment" />
          <dl className="space-y-4 text-sm">
            <div>
              <dt className="text-fg-muted">Credit score</dt>
              <dd
                className={`text-3xl font-semibold tabular-nums ${creditScoreTone(l.creditScore)}`}
              >
                {l.creditScore}{" "}
                <span className="text-base font-medium">({creditRating(l.creditScore)})</span>
              </dd>
            </div>
            <Detail label="Monthly income" value={formatMoney(l.monthlyIncome)} />
            <Detail
              label="Debt-service ratio"
              value={
                <span
                  className={
                    dsr > 0.5 ? "text-danger" : dsr > 0.35 ? "text-warning" : "text-success"
                  }
                >
                  {formatPercent(dsr)} {dsr > 0.5 ? "(exceeds policy)" : "(within policy)"}
                </span>
              }
            />
          </dl>
        </Card>
      </div>

      <Card className="mt-6" aria-labelledby="decision-title">
        <CardHeader
          titleId="decision-title"
          title="Decision"
          description={
            actions.length
              ? "Actions available for your role."
              : ALLOWED_TRANSITIONS[l.status].length
                ? "Your role cannot action this application at its current stage."
                : "This application is in a final state."
          }
        />
        <div className="flex flex-wrap gap-3">
          {actions.map((to) => (
            <Button
              key={to}
              variant={to === "REJECTED" ? "danger" : "primary"}
              loading={update.isPending && update.variables?.status === to}
              disabled={update.isPending}
              onClick={() => changeStatus(to)}
            >
              {ACTION_LABEL[to]}
            </Button>
          ))}
        </div>
        {restricted && (
          <p className="text-fg-muted mt-3 text-xs">
            Approval and rejection require a credit analyst (segregation of duties).
          </p>
        )}
      </Card>
    </>
  );
}

function Detail({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <dt className="text-fg-muted">{label}</dt>
      <dd className="text-fg mt-0.5 font-medium tabular-nums">{value}</dd>
    </div>
  );
}
