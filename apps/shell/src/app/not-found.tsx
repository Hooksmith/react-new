import { EmptyState } from "@nexbank/ui";
import Link from "next/link";

export default function NotFound() {
  return (
    <main id="main" className="mx-auto max-w-lg px-4 py-24">
      <EmptyState
        title="Page not found"
        description="The page you're looking for doesn't exist or has moved."
        action={
          <Link href="/" className="text-brand-600 font-medium hover:underline">
            Back to dashboard
          </Link>
        }
      />
    </main>
  );
}
