import { PageHeader } from "@nexbank/ui";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { LoanList } from "./loan-list";

export const metadata: Metadata = { title: "Loans" };

export default function LoansPage() {
  return (
    <>
      <PageHeader
        title="Loan applications"
        description="Search, filter and action applications in the pipeline."
        actions={
          <Link
            href="/apply"
            className="bg-brand-600 hover:bg-brand-700 inline-flex h-10 items-center rounded-lg px-4 text-sm font-medium text-white"
          >
            New application
          </Link>
        }
      />
      <Suspense>
        <LoanList />
      </Suspense>
    </>
  );
}
