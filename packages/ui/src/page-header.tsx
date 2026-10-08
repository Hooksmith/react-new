import type { ReactNode } from "react";

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-fg text-2xl font-semibold tracking-tight">{title}</h1>
        {description && <p className="text-fg-muted mt-1 text-sm">{description}</p>}
      </div>
      {actions && <div className="flex gap-2">{actions}</div>}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="border-border rounded-xl border border-dashed p-10 text-center">
      <p className="text-fg font-medium">{title}</p>
      {description && <p className="text-fg-muted mt-1 text-sm">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="border-danger/30 bg-danger/5 rounded-xl border p-6 text-sm">
      <p className="text-danger font-medium">Something went wrong</p>
      <p className="text-fg-muted mt-1">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="text-brand-600 mt-3 font-medium underline"
        >
          Try again
        </button>
      )}
    </div>
  );
}
