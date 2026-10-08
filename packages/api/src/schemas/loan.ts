import { z } from "zod";

export const LOAN_STATUSES = [
  "SUBMITTED",
  "UNDER_REVIEW",
  "APPROVED",
  "REJECTED",
  "DISBURSED",
] as const;
export const LoanStatusSchema = z.enum(LOAN_STATUSES);
export type LoanStatus = z.infer<typeof LoanStatusSchema>;

export const LOAN_PRODUCTS = ["PERSONAL", "AUTO", "MORTGAGE", "SME"] as const;
export const LoanProductSchema = z.enum(LOAN_PRODUCTS);
export type LoanProduct = z.infer<typeof LoanProductSchema>;

export const CurrencySchema = z.enum(["USD", "KHR"]);
export type Currency = z.infer<typeof CurrencySchema>;

/** Which status transitions a reviewer may perform — enforced on both client and server. */
export const ALLOWED_TRANSITIONS: Record<LoanStatus, LoanStatus[]> = {
  SUBMITTED: ["UNDER_REVIEW", "REJECTED"],
  UNDER_REVIEW: ["APPROVED", "REJECTED"],
  APPROVED: ["DISBURSED"],
  REJECTED: [],
  DISBURSED: [],
};

export type StaffRole = "loan_officer" | "credit_analyst" | "admin";

/**
 * Segregation of duties: officers originate and route to review, only analysts/admins decide.
 * The UI uses this to hide actions; the API uses it to authorise them.
 */
export function canTransition(role: StaffRole, from: LoanStatus, to: LoanStatus): boolean {
  if (!ALLOWED_TRANSITIONS[from].includes(to)) return false;
  if ((to === "APPROVED" || to === "REJECTED") && role === "loan_officer") return false;
  return true;
}

export const LoanSchema = z.object({
  id: z.string(),
  reference: z.string(),
  applicantName: z.string(),
  /** Always masked by the API — the full ID never reaches the browser. */
  nationalIdMasked: z.string(),
  product: LoanProductSchema,
  amount: z.number().nonnegative(),
  currency: CurrencySchema,
  termMonths: z.number().int().positive(),
  interestRate: z.number().nonnegative(),
  monthlyIncome: z.number().nonnegative(),
  creditScore: z.number().int().min(300).max(850),
  status: LoanStatusSchema,
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});
export type Loan = z.infer<typeof LoanSchema>;

export const LoanListQuerySchema = z.object({
  status: LoanStatusSchema.optional(),
  search: z.string().trim().max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
});
/** What the client sends (all optional). */
export type LoanListQuery = {
  status?: LoanStatus;
  search?: string;
  page?: number;
  pageSize?: number;
};
/** What the server works with after parsing + defaults. */
export type LoanListParams = z.output<typeof LoanListQuerySchema>;

export const paginated = <T extends z.ZodType>(item: T) =>
  z.object({
    items: z.array(item),
    total: z.number().int().nonnegative(),
    page: z.number().int().min(1),
    pageSize: z.number().int().min(1),
  });

export const LoanPageSchema = paginated(LoanSchema);
export type LoanPage = z.infer<typeof LoanPageSchema>;

export const UpdateLoanStatusSchema = z.object({
  status: LoanStatusSchema,
  note: z.string().trim().max(500).optional(),
});
export type UpdateLoanStatusInput = z.infer<typeof UpdateLoanStatusSchema>;

/** Real-time event pushed over Server-Sent Events. */
export const LoanEventSchema = z.object({
  id: z.string(),
  type: z.literal("loan.status_changed"),
  loanId: z.string(),
  reference: z.string(),
  applicantName: z.string(),
  from: LoanStatusSchema,
  to: LoanStatusSchema,
  at: z.iso.datetime(),
});
export type LoanEvent = z.infer<typeof LoanEventSchema>;
