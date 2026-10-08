import type { Currency } from "./schemas/loan";

/** Standard amortised installment: P·r / (1 − (1 + r)^−n), with r the monthly rate. */
export function monthlyInstallment(principal: number, annualRate: number, months: number): number {
  if (months <= 0) return Number.NaN;
  const r = annualRate / 12;
  if (r === 0) return principal / months;
  return (principal * r) / (1 - Math.pow(1 + r, -months));
}

const formatters = new Map<string, Intl.NumberFormat>();

export function formatMoney(amount: number, currency: Currency = "USD", compact = false): string {
  const key = `${currency}:${compact}`;
  let fmt = formatters.get(key);
  if (!fmt) {
    fmt = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      notation: compact ? "compact" : "standard",
      maximumFractionDigits: currency === "KHR" || compact ? 0 : 2,
    });
    formatters.set(key, fmt);
  }
  return fmt.format(amount);
}

export function formatPercent(ratio: number, digits = 1): string {
  return `${(ratio * 100).toFixed(digits)}%`;
}

export type CreditRating = "Excellent" | "Good" | "Fair" | "Poor";

export function creditRating(score: number): CreditRating {
  if (score >= 750) return "Excellent";
  if (score >= 670) return "Good";
  if (score >= 580) return "Fair";
  return "Poor";
}
