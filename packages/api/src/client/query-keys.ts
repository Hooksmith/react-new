import type { LoanListQuery } from "../schemas/loan";

/**
 * Hierarchical query-key factory. Invalidating `loanKeys.all` refreshes every loan query,
 * while `loanKeys.detail(id)` targets a single record.
 */
export const loanKeys = {
  all: ["loans"] as const,
  lists: () => [...loanKeys.all, "list"] as const,
  list: (query: LoanListQuery) => [...loanKeys.lists(), query] as const,
  details: () => [...loanKeys.all, "detail"] as const,
  detail: (id: string) => [...loanKeys.details(), id] as const,
};

export const analyticsKeys = {
  all: ["analytics"] as const,
  overview: () => [...analyticsKeys.all, "overview"] as const,
  creditBands: () => [...analyticsKeys.all, "credit-bands"] as const,
};

export const authKeys = {
  me: ["auth", "me"] as const,
};
