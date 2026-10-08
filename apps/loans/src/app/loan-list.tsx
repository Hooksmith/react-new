"use client";

import {
  formatMoney,
  LOAN_STATUSES,
  LoanStatusSchema,
  PRODUCT_RULES,
  type LoanStatus,
} from "@nexbank/api";
import { useLoans } from "@nexbank/api/client";
import {
  Button,
  Card,
  creditScoreTone,
  EmptyState,
  ErrorState,
  loanStatusLabel,
  LoanStatusBadge,
  SelectField,
  Skeleton,
  TextField,
} from "@nexbank/ui";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useListPreferences } from "@/stores/list-preferences-store";

/**
 * Filters live in the URL (not component state) so views are shareable, bookmarkable and
 * survive refresh / back-forward navigation.
 */
export function LoanList() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const pageSize = useListPreferences((s) => s.pageSize);
  const setPageSize = useListPreferences((s) => s.setPageSize);

  const statusParam = LoanStatusSchema.safeParse(params.get("status"));
  const status: LoanStatus | undefined = statusParam.success ? statusParam.data : undefined;
  const page = Math.max(1, Number(params.get("page")) || 1);

  useEffect(() => {
    void useListPreferences.persist.rehydrate();
  }, []);

  const [searchInput, setSearchInput] = useState(params.get("q") ?? "");
  const search = useDebouncedValue(searchInput.trim(), 300);

  const updateParams = (patch: Record<string, string | undefined>) => {
    const next = new URLSearchParams(params);
    for (const [k, v] of Object.entries(patch)) {
      if (v) next.set(k, v);
      else next.delete(k);
    }
    router.replace(`${pathname}?${next.toString()}`, { scroll: false });
  };

  // Sync the debounced search box to the URL, resetting to page 1.
  useEffect(() => {
    if ((params.get("q") ?? "") !== search)
      updateParams({ q: search || undefined, page: undefined });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only react to the debounced value
  }, [search]);

  const { data, isPending, isError, error, refetch, isPlaceholderData } = useLoans({
    status,
    search: search || undefined,
    page,
    pageSize,
  });
  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  return (
    <Card className="p-0">
      <div className="border-border grid gap-4 border-b p-5 sm:grid-cols-[1fr_200px_140px]">
        <TextField
          label="Search"
          type="search"
          placeholder="Applicant name or reference"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
        <SelectField
          label="Status"
          value={status ?? ""}
          onChange={(e) => updateParams({ status: e.target.value || undefined, page: undefined })}
        >
          <option value="">All statuses</option>
          {LOAN_STATUSES.map((s) => (
            <option key={s} value={s}>
              {loanStatusLabel(s)}
            </option>
          ))}
        </SelectField>
        <SelectField
          label="Rows per page"
          value={pageSize}
          onChange={(e) => {
            setPageSize(Number(e.target.value));
            updateParams({ page: undefined });
          }}
        >
          {[10, 20, 50].map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </SelectField>
      </div>

      {isError ? (
        <div className="p-5">
          <ErrorState message={error.message} onRetry={() => refetch()} />
        </div>
      ) : isPending ? (
        <div className="space-y-2 p-5" aria-busy="true">
          <span className="sr-only">Loading loans…</span>
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-10" />
          ))}
        </div>
      ) : data.items.length === 0 ? (
        <div className="p-5">
          <EmptyState
            title="No loans match your filters"
            description="Try a different search or status."
          />
        </div>
      ) : (
        <div className="overflow-x-auto" aria-busy={isPlaceholderData}>
          <table className="w-full text-left text-sm">
            <caption className="sr-only">
              Loan applications, page {page} of {totalPages}, {data.total} results
            </caption>
            <thead className="bg-surface-muted text-fg-muted">
              <tr>
                <th scope="col" className="px-5 py-3 font-medium">
                  Reference
                </th>
                <th scope="col" className="px-5 py-3 font-medium">
                  Applicant
                </th>
                <th scope="col" className="px-5 py-3 font-medium">
                  Product
                </th>
                <th scope="col" className="px-5 py-3 text-right font-medium">
                  Amount
                </th>
                <th scope="col" className="px-5 py-3 text-right font-medium">
                  Credit score
                </th>
                <th scope="col" className="px-5 py-3 font-medium">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className={`divide-border divide-y ${isPlaceholderData ? "opacity-60" : ""}`}>
              {data.items.map((loan) => (
                <tr key={loan.id} className="hover:bg-surface-muted/50">
                  <td className="px-5 py-3">
                    <Link
                      href={`/${loan.id}`}
                      className="text-brand-600 font-medium hover:underline"
                    >
                      {loan.reference}
                    </Link>
                  </td>
                  <td className="px-5 py-3">{loan.applicantName}</td>
                  <td className="text-fg-muted px-5 py-3">{PRODUCT_RULES[loan.product].label}</td>
                  <td className="px-5 py-3 text-right tabular-nums">
                    {formatMoney(loan.amount, loan.currency)}
                  </td>
                  <td
                    className={`px-5 py-3 text-right font-medium tabular-nums ${creditScoreTone(loan.creditScore)}`}
                  >
                    {loan.creditScore}
                  </td>
                  <td className="px-5 py-3">
                    <LoanStatusBadge status={loan.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {data && data.total > 0 && (
        <nav
          aria-label="Pagination"
          className="border-border flex items-center justify-between border-t p-4 text-sm"
        >
          <p className="text-fg-muted">
            Page <span className="text-fg font-medium">{page}</span> of {totalPages} · {data.total}{" "}
            results
          </p>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              disabled={page <= 1}
              onClick={() => updateParams({ page: String(page - 1) })}
            >
              Previous
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => updateParams({ page: String(page + 1) })}
            >
              Next
            </Button>
          </div>
        </nav>
      )}
    </Card>
  );
}
