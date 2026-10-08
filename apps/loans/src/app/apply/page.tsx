import { PageHeader } from "@nexbank/ui";
import type { Metadata } from "next";
import { ApplicationWizard } from "./application-wizard";

export const metadata: Metadata = { title: "New application" };

export default function ApplyPage() {
  return (
    <>
      <PageHeader
        title="New loan application"
        description="Capture applicant details and loan requirements."
      />
      <ApplicationWizard />
    </>
  );
}
