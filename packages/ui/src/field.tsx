import {
  useId,
  type InputHTMLAttributes,
  type ReactNode,
  type Ref,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";
import { cn } from "./cn";

const controlClass = cn(
  "block w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-fg",
  "placeholder:text-fg-muted/70 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30",
  "aria-[invalid=true]:border-danger aria-[invalid=true]:ring-danger/20",
  "disabled:cursor-not-allowed disabled:bg-surface-muted",
);

interface FieldShellProps {
  label: string;
  error?: string;
  hint?: ReactNode;
  required?: boolean;
  children: (ids: { id: string; describedBy?: string; invalid: boolean }) => ReactNode;
}

/**
 * Wires label, hint and error to the control via id / aria-describedby / aria-invalid so
 * screen readers announce validation errors in context.
 */
function FieldShell({ label, error, hint, required, children }: FieldShellProps) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-fg block text-sm font-medium">
        {label}
        {required && (
          <span className="text-danger ml-0.5" aria-hidden="true">
            *
          </span>
        )}
      </label>
      {children({ id, describedBy, invalid: Boolean(error) })}
      {hint && (
        <p id={hintId} className="text-fg-muted text-xs">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} role="alert" className="text-danger text-xs font-medium">
          {error}
        </p>
      )}
    </div>
  );
}

type Common = { label: string; error?: string; hint?: ReactNode };

export function TextField({
  label,
  error,
  hint,
  className,
  ref,
  ...props
}: Common & InputHTMLAttributes<HTMLInputElement> & { ref?: Ref<HTMLInputElement> }) {
  return (
    <FieldShell label={label} error={error} hint={hint} required={props.required}>
      {({ id, describedBy, invalid }) => (
        <input
          ref={ref}
          id={id}
          aria-describedby={describedBy}
          aria-invalid={invalid}
          className={cn(controlClass, className)}
          {...props}
        />
      )}
    </FieldShell>
  );
}

export function SelectField({
  label,
  error,
  hint,
  className,
  children,
  ref,
  ...props
}: Common & SelectHTMLAttributes<HTMLSelectElement> & { ref?: Ref<HTMLSelectElement> }) {
  return (
    <FieldShell label={label} error={error} hint={hint} required={props.required}>
      {({ id, describedBy, invalid }) => (
        <select
          ref={ref}
          id={id}
          aria-describedby={describedBy}
          aria-invalid={invalid}
          className={cn(controlClass, className)}
          {...props}
        >
          {children}
        </select>
      )}
    </FieldShell>
  );
}

export function TextAreaField({
  label,
  error,
  hint,
  className,
  ref,
  ...props
}: Common & TextareaHTMLAttributes<HTMLTextAreaElement> & { ref?: Ref<HTMLTextAreaElement> }) {
  return (
    <FieldShell label={label} error={error} hint={hint} required={props.required}>
      {({ id, describedBy, invalid }) => (
        <textarea
          ref={ref}
          id={id}
          aria-describedby={describedBy}
          aria-invalid={invalid}
          className={cn(controlClass, "min-h-24", className)}
          {...props}
        />
      )}
    </FieldShell>
  );
}
