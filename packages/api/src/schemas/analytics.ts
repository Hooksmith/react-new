import { z } from "zod";
import { LoanStatusSchema } from "./loan";

export const PortfolioSummarySchema = z.object({
  totalOutstanding: z.number(),
  activeLoans: z.number().int(),
  approvalRate: z.number().min(0).max(1),
  averageCreditScore: z.number(),
  nonPerformingRatio: z.number().min(0).max(1),
  pendingReview: z.number().int(),
});
export type PortfolioSummary = z.infer<typeof PortfolioSummarySchema>;

export const MonthlyVolumeSchema = z.array(
  z.object({ month: z.string(), disbursed: z.number(), repaid: z.number() }),
);
export type MonthlyVolume = z.infer<typeof MonthlyVolumeSchema>;

export const StatusBreakdownSchema = z.array(
  z.object({ status: LoanStatusSchema, count: z.number().int() }),
);
export type StatusBreakdown = z.infer<typeof StatusBreakdownSchema>;

export const CreditBandSchema = z.object({
  band: z.string(),
  min: z.number().int(),
  max: z.number().int(),
  count: z.number().int(),
  defaultRate: z.number(),
});
export type CreditBand = z.infer<typeof CreditBandSchema>;

export const AnalyticsSchema = z.object({
  summary: PortfolioSummarySchema,
  monthlyVolume: MonthlyVolumeSchema,
  statusBreakdown: StatusBreakdownSchema,
});
export type Analytics = z.infer<typeof AnalyticsSchema>;
