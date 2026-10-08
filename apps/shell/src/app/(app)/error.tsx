"use client";

import { ErrorState } from "@nexbank/ui";
import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Hook point for Sentry/Datadog RUM. Only the digest is shown — never raw server errors.
    console.error(error);
  }, [error]);

  return <ErrorState message={`Reference: ${error.digest ?? "n/a"}`} onRetry={reset} />;
}
