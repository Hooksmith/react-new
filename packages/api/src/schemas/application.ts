import { z } from "zod";
import { monthlyInstallment } from "../finance";
import { CurrencySchema, LoanProductSchema, type LoanProduct } from "./loan";

/** Product limits in USD. Shared so client-side hints and server-side checks never drift. */
export const PRODUCT_RULES: Record<
  LoanProduct,
  {
    label: string;
    minAmount: number;
    maxAmount: number;
    minTerm: number;
    maxTerm: number;
    rate: number;
  }
> = {
  PERSONAL: {
    label: "Personal loan",
    minAmount: 500,
    maxAmount: 50_000,
    minTerm: 6,
    maxTerm: 60,
    rate: 0.12,
  },
  AUTO: {
    label: "Auto loan",
    minAmount: 3_000,
    maxAmount: 150_000,
    minTerm: 12,
    maxTerm: 84,
    rate: 0.09,
  },
  MORTGAGE: {
    label: "Home loan",
    minAmount: 20_000,
    maxAmount: 1_000_000,
    minTerm: 60,
    maxTerm: 360,
    rate: 0.075,
  },
  SME: {
    label: "SME business loan",
    minAmount: 5_000,
    maxAmount: 500_000,
    minTerm: 12,
    maxTerm: 120,
    rate: 0.1,
  },
};

export const KHR_PER_USD = 4100;

/** Max share of monthly income the installment may consume (debt-service ratio). */
export const MAX_DEBT_SERVICE_RATIO = 0.5;

const today = () => new Date();
const yearsBetween = (from: Date, to: Date) =>
  (to.getTime() - from.getTime()) / (365.25 * 24 * 60 * 60 * 1000);

export const ApplicantStepSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Enter the applicant's full name")
    .max(100)
    .regex(
      /^[\p{L}\p{M}' .-]+$/u,
      "Name may only contain letters, spaces, apostrophes and hyphens",
    ),
  nationalId: z.string().regex(/^\d{9}$/, "National ID must be exactly 9 digits"),
  email: z.email("Enter a valid email address"),
  phone: z
    .string()
    .regex(/^(\+855|0)[1-9]\d{7,8}$/, "Enter a Cambodian phone number, e.g. +85512345678"),
  dateOfBirth: z.iso
    .date("Enter a valid date")
    .refine(
      (v) => yearsBetween(new Date(v), today()) >= 18,
      "Applicant must be at least 18 years old",
    ),
});

export const EmploymentStepSchema = z.object({
  employmentType: z.enum(["SALARIED", "SELF_EMPLOYED", "BUSINESS_OWNER"], {
    error: "Select an employment type",
  }),
  employerName: z.string().trim().max(120).optional(),
  monthlyIncome: z.coerce
    .number<string | number>({ error: "Enter monthly income" })
    .positive("Monthly income must be greater than 0")
    .max(1_000_000),
});

export const LoanDetailsStepSchema = z.object({
  product: LoanProductSchema,
  currency: CurrencySchema,
  amount: z.coerce
    .number<string | number>({ error: "Enter an amount" })
    .positive("Amount must be greater than 0"),
  termMonths: z.coerce.number<string | number>({ error: "Enter a term" }).int().positive(),
  purpose: z.string().trim().min(10, "Describe the purpose in at least 10 characters").max(500),
});

export const toUsd = (amount: number, currency: "USD" | "KHR") =>
  currency === "USD" ? amount : amount / KHR_PER_USD;

/**
 * Full application schema with cross-field business rules.
 * Used by the multi-step form on the client and by the API route on the server.
 */
export const LoanApplicationSchema = ApplicantStepSchema.extend(EmploymentStepSchema.shape)
  .extend(LoanDetailsStepSchema.shape)
  .superRefine((data, ctx) => {
    if (data.employmentType === "SALARIED" && !data.employerName) {
      ctx.addIssue({
        code: "custom",
        path: ["employerName"],
        message: "Employer name is required",
      });
    }

    const rule = PRODUCT_RULES[data.product];
    const amountUsd = toUsd(data.amount, data.currency);
    if (amountUsd < rule.minAmount || amountUsd > rule.maxAmount) {
      ctx.addIssue({
        code: "custom",
        path: ["amount"],
        message: `${rule.label} amount must be between $${rule.minAmount.toLocaleString()} and $${rule.maxAmount.toLocaleString()}`,
      });
    }
    if (data.termMonths < rule.minTerm || data.termMonths > rule.maxTerm) {
      ctx.addIssue({
        code: "custom",
        path: ["termMonths"],
        message: `Term must be between ${rule.minTerm} and ${rule.maxTerm} months`,
      });
    }

    // Income is captured in USD, so compare against the USD-equivalent installment.
    const installment = monthlyInstallment(amountUsd, rule.rate, data.termMonths);
    if (Number.isFinite(installment) && installment > data.monthlyIncome * MAX_DEBT_SERVICE_RATIO) {
      ctx.addIssue({
        code: "custom",
        path: ["amount"],
        message: `Estimated installment exceeds ${MAX_DEBT_SERVICE_RATIO * 100}% of monthly income — reduce the amount or extend the term`,
      });
    }
  });

export type LoanApplicationInput = z.input<typeof LoanApplicationSchema>;
export type LoanApplication = z.output<typeof LoanApplicationSchema>;

export const APPLICATION_STEPS = [
  { id: "applicant", title: "Applicant", schema: ApplicantStepSchema },
  { id: "employment", title: "Employment", schema: EmploymentStepSchema },
  { id: "loan", title: "Loan details", schema: LoanDetailsStepSchema },
  { id: "review", title: "Review", schema: null },
] as const;
