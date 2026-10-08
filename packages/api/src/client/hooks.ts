import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { AnalyticsSchema, CreditBandSchema } from "../schemas/analytics";
import type { LoanApplication } from "../schemas/application";
import { CurrentUserSchema } from "../schemas/auth";
import {
  LoanPageSchema,
  LoanSchema,
  type Loan,
  type LoanListQuery,
  type LoanPage,
  type UpdateLoanStatusInput,
} from "../schemas/loan";
import { gql } from "./graphql";
import { apiFetch } from "./http";
import { analyticsKeys, authKeys, loanKeys } from "./query-keys";

const toSearchParams = (query: LoanListQuery) => {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== "") params.set(key, String(value));
  }
  return params.toString();
};

export function useLoans(query: LoanListQuery) {
  return useQuery({
    queryKey: loanKeys.list(query),
    queryFn: ({ signal }) =>
      apiFetch(`/api/loans?${toSearchParams(query)}`, { schema: LoanPageSchema, signal }),
    // Keep showing the previous page while the next one loads — avoids layout jumps when paginating.
    placeholderData: keepPreviousData,
  });
}

export function useLoan(id: string) {
  return useQuery({
    queryKey: loanKeys.detail(id),
    queryFn: ({ signal }) =>
      apiFetch(`/api/loans/${encodeURIComponent(id)}`, { schema: LoanSchema, signal }),
  });
}

export function useCreateLoan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: LoanApplication) =>
      apiFetch("/api/loans", { method: "POST", body: input, schema: LoanSchema }),
    onSuccess: (loan) => {
      queryClient.setQueryData(loanKeys.detail(loan.id), loan);
      void queryClient.invalidateQueries({ queryKey: loanKeys.lists() });
      void queryClient.invalidateQueries({ queryKey: analyticsKeys.all });
    },
  });
}

/** Optimistic status update: UI reflects the change instantly and rolls back on failure. */
export function useUpdateLoanStatus(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateLoanStatusInput) =>
      apiFetch(`/api/loans/${encodeURIComponent(id)}`, {
        method: "PATCH",
        body: input,
        schema: LoanSchema,
      }),
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: loanKeys.detail(id) });
      const previous = queryClient.getQueryData<Loan>(loanKeys.detail(id));
      if (previous)
        queryClient.setQueryData<Loan>(loanKeys.detail(id), { ...previous, status: input.status });
      return { previous };
    },
    onError: (_err, _input, context) => {
      if (context?.previous) queryClient.setQueryData(loanKeys.detail(id), context.previous);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: loanKeys.all });
      void queryClient.invalidateQueries({ queryKey: analyticsKeys.all });
    },
  });
}

export function useAnalytics() {
  return useQuery({
    queryKey: analyticsKeys.overview(),
    queryFn: ({ signal }) => apiFetch("/api/analytics", { schema: AnalyticsSchema, signal }),
    refetchInterval: 60_000,
  });
}

const CREDIT_BANDS_QUERY = /* GraphQL */ `
  query CreditBands {
    creditBands {
      band
      min
      max
      count
      defaultRate
    }
  }
`;

export function useCreditBands() {
  return useQuery({
    queryKey: analyticsKeys.creditBands(),
    queryFn: ({ signal }) =>
      gql(
        CREDIT_BANDS_QUERY,
        {},
        z.object({ creditBands: z.array(CreditBandSchema) }),
        signal,
      ).then((d) => d.creditBands),
  });
}

export function useCurrentUser() {
  return useQuery({
    queryKey: authKeys.me,
    queryFn: ({ signal }) => apiFetch("/api/auth/me", { schema: CurrentUserSchema, signal }),
    staleTime: 5 * 60_000,
  });
}

/** Patches a loan in every cached list page + its detail entry (used by the real-time stream). */
export function patchLoanInCache(
  queryClient: ReturnType<typeof useQueryClient>,
  loanId: string,
  patch: Partial<Loan>,
) {
  queryClient.setQueriesData<LoanPage>({ queryKey: loanKeys.lists() }, (page) =>
    page
      ? { ...page, items: page.items.map((l) => (l.id === loanId ? { ...l, ...patch } : l)) }
      : page,
  );
  queryClient.setQueryData<Loan>(loanKeys.detail(loanId), (loan) =>
    loan ? { ...loan, ...patch } : loan,
  );
}
