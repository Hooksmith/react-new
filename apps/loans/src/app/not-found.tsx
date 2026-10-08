import { EmptyState } from "@nexbank/ui";
import Link from "next/link";

export default function NotFound() {
  return (
    <EmptyState
      title="Page not found"
      description="This loan page doesn't exist."
      action={
        <Link href="/" className="text-brand-600 font-medium hover:underline">
          Back to loans
        </Link>
      }
    />
  );
}
