import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "./cn";

export function Card({ className, ...props }: HTMLAttributes<HTMLElement>) {
  return (
    <section
      className={cn("border-border bg-surface rounded-xl border p-5 shadow-sm", className)}
      {...props}
    />
  );
}

export function CardHeader({
  title,
  description,
  action,
  titleId,
}: {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  titleId?: string;
}) {
  return (
    <header className="mb-4 flex items-start justify-between gap-4">
      <div>
        <h2 id={titleId} className="text-fg text-base font-semibold">
          {title}
        </h2>
        {description && <p className="text-fg-muted mt-1 text-sm">{description}</p>}
      </div>
      {action}
    </header>
  );
}
