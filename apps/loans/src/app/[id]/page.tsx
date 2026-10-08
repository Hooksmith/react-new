import type { Metadata } from "next";
import { LoanDetail } from "./loan-detail";

export const metadata: Metadata = { title: "Loan details" };

export default async function LoanDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <LoanDetail id={id} />;
}
