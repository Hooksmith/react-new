import { PageHeader } from "@nexbank/ui";
import type { Metadata } from "next";
import { CreditAnalytics } from "./credit-analytics";

export const metadata: Metadata = { title: "Credit analytics" };

export default function AnalyticsPage() {
  return (
    <>
      <PageHeader
        title="Credit analytics"
        description="Credit score distribution and risk by band (served via GraphQL)."
      />
      <CreditAnalytics />
    </>
  );
}
