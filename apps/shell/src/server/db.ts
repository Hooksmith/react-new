import "server-only";
import {
  LOAN_STATUSES,
  LoanSchema,
  toUsd,
  type Analytics,
  type CreditBand,
  type Loan,
  type LoanApplication,
  type LoanListParams,
  type LoanPage,
  type LoanStatus,
  PRODUCT_RULES,
} from "@nexbank/api";
import { z } from "zod";
import seedLoans from "./data/loans.json";

/**
 * In-memory mock of the core-banking/LOS backend, seeded from `data/loans.json`.
 * In a real deployment the BFF route handlers would call upstream services; keeping this module
 * as the only data access point means that swap touches one file.
 */

/** Shape of a row in `data/loans.json` — what the "backend" stores (the masked ID is derived). */
const LoanRecordSchema = LoanSchema.omit({ nationalIdMasked: true }).extend({
  nationalId: z.string().regex(/^\d{9}$/),
});

interface LoanRecord extends Loan {
  /** Stored server-side only — never serialised to the client. */
  nationalId: string;
}

export function maskId(id: string): string {
  return `•••••${id.slice(-4)}`;
}

/** Validates the JSON at load time so a bad edit fails loudly instead of rendering garbage. */
function seed(): LoanRecord[] {
  return z
    .array(LoanRecordSchema)
    .parse(seedLoans)
    .map((record) => ({ ...record, nationalIdMasked: maskId(record.nationalId) }));
}

// Survive Next.js dev HMR by stashing state on globalThis. Mutations stay in memory only;
// the JSON file is never written back, so a restart resets to the seed.
const globalStore = globalThis as unknown as { __nexbankLoans?: LoanRecord[] };
const loans = (globalStore.__nexbankLoans ??= seed());

function toPublic({ nationalId: _omit, ...loan }: LoanRecord): Loan {
  return loan;
}

export function listLoans(query: LoanListParams): LoanPage {
  const search = query.search?.toLowerCase();
  const filtered = loans
    .filter((l) => !query.status || l.status === query.status)
    .filter(
      (l) =>
        !search ||
        l.applicantName.toLowerCase().includes(search) ||
        l.reference.toLowerCase().includes(search),
    )
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const page = query.page;
  const pageSize = query.pageSize;
  return {
    items: filtered.slice((page - 1) * pageSize, page * pageSize).map(toPublic),
    total: filtered.length,
    page,
    pageSize,
  };
}

export function getLoan(id: string): Loan | undefined {
  const loan = loans.find((l) => l.id === id);
  return loan && toPublic(loan);
}

export function createLoan(input: LoanApplication): Loan {
  const now = new Date();
  const rule = PRODUCT_RULES[input.product];
  const record: LoanRecord = {
    id: `ln_${crypto.randomUUID().slice(0, 8)}`,
    reference: `LN-${now.getFullYear()}-${String(10_000 + loans.length)}`,
    applicantName: input.fullName,
    nationalId: input.nationalId,
    nationalIdMasked: maskId(input.nationalId),
    product: input.product,
    amount: input.amount,
    currency: input.currency,
    termMonths: input.termMonths,
    interestRate: rule.rate,
    monthlyIncome: input.monthlyIncome,
    // A real system would call the credit bureau here.
    creditScore: 600 + Math.floor(Math.random() * 200),
    status: "SUBMITTED",
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };
  loans.push(record);
  return toPublic(record);
}

export function setLoanStatus(id: string, status: LoanStatus): Loan | undefined {
  const loan = loans.find((l) => l.id === id);
  if (!loan) return undefined;
  loan.status = status;
  loan.updatedAt = new Date().toISOString();
  return toPublic(loan);
}

export function randomActiveLoan(): Loan | undefined {
  const active = loans.filter(
    (l) => l.status === "SUBMITTED" || l.status === "UNDER_REVIEW" || l.status === "APPROVED",
  );
  const loan = active[Math.floor(Math.random() * active.length)];
  return loan && toPublic(loan);
}

export function getAnalytics(): Analytics {
  const disbursed = loans.filter((l) => l.status === "DISBURSED");
  const decided = loans.filter((l) => ["APPROVED", "REJECTED", "DISBURSED"].includes(l.status));
  const approved = decided.filter((l) => l.status !== "REJECTED");

  const months = Array.from({ length: 12 }, (_, i) => {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - (11 - i));
    return d;
  });

  return {
    summary: {
      totalOutstanding: disbursed.reduce((sum, l) => sum + toUsd(l.amount, l.currency), 0),
      activeLoans: disbursed.length,
      approvalRate: decided.length ? approved.length / decided.length : 0,
      averageCreditScore: Math.round(loans.reduce((s, l) => s + l.creditScore, 0) / loans.length),
      nonPerformingRatio: disbursed.length
        ? disbursed.filter((l) => l.creditScore < 580).length / disbursed.length
        : 0,
      pendingReview: loans.filter((l) => l.status === "SUBMITTED" || l.status === "UNDER_REVIEW")
        .length,
    },
    monthlyVolume: months.map((d) => {
      const key = d.toISOString().slice(0, 7);
      const inMonth = loans.filter((l) => l.createdAt.startsWith(key) && l.status !== "REJECTED");
      const volume = inMonth.reduce((s, l) => s + toUsd(l.amount, l.currency), 0);
      return {
        month: d.toLocaleString("en-US", { month: "short", year: "2-digit" }),
        disbursed: Math.round(volume),
        repaid: Math.round(volume * 0.62),
      };
    }),
    statusBreakdown: LOAN_STATUSES.map((status) => ({
      status,
      count: loans.filter((l) => l.status === status).length,
    })),
  };
}

const BANDS = [
  { band: "Poor", min: 300, max: 579 },
  { band: "Fair", min: 580, max: 669 },
  { band: "Good", min: 670, max: 749 },
  { band: "Excellent", min: 750, max: 850 },
];

export function getCreditBands(): CreditBand[] {
  return BANDS.map((b, i) => ({
    ...b,
    count: loans.filter((l) => l.creditScore >= b.min && l.creditScore <= b.max).length,
    // Illustrative historical default rates per band.
    defaultRate: [0.18, 0.07, 0.025, 0.008][i]!,
  }));
}

/** Test helper */
export function __resetDb() {
  loans.splice(0, loans.length, ...seed());
}
