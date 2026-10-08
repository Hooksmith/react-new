"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  APPLICATION_STEPS,
  formatMoney,
  LOAN_PRODUCTS,
  LoanApplicationSchema,
  MAX_DEBT_SERVICE_RATIO,
  monthlyInstallment,
  PRODUCT_RULES,
  toUsd,
  type LoanApplication,
  type LoanApplicationInput,
  type LoanProduct,
} from "@nexbank/api";
import { ApiError, useCreateLoan } from "@nexbank/api/client";
import { Button, Card, cn, SelectField, TextAreaField, TextField } from "@nexbank/ui";
import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useForm, useWatch, type FieldPath, type UseFormReturn } from "react-hook-form";
import { useApplicationDraft } from "@/stores/application-draft-store";

type Values = LoanApplicationInput;

const DEFAULTS: Values = {
  fullName: "",
  nationalId: "",
  email: "",
  phone: "",
  dateOfBirth: "",
  employmentType: "SALARIED",
  employerName: "",
  monthlyIncome: "",
  product: "PERSONAL",
  currency: "USD",
  amount: "",
  termMonths: "",
  purpose: "",
};

/** Fields validated when leaving each step (cross-field rules run on final submit). */
const STEP_FIELDS: FieldPath<Values>[][] = [
  ["fullName", "nationalId", "email", "phone", "dateOfBirth"],
  ["employmentType", "employerName", "monthlyIncome"],
  ["product", "currency", "amount", "termMonths", "purpose"],
  [],
];

/** Which step owns a field — used to jump back to the first invalid step on submit. */
const stepOf = (field: string) =>
  Math.max(
    0,
    STEP_FIELDS.findIndex((f) => f.includes(field as FieldPath<Values>)),
  );

export function ApplicationWizard() {
  const { step, setStep, saveDraft, clear } = useApplicationDraft();
  const createLoan = useCreateLoan();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [submitted, setSubmitted] = useState<{ id: string; reference: string } | null>(null);

  const form = useForm<Values, unknown, LoanApplication>({
    resolver: zodResolver(LoanApplicationSchema),
    defaultValues: DEFAULTS,
    mode: "onTouched",
  });
  const { register, handleSubmit, trigger, reset, control, setError, formState } = form;
  const { errors, isSubmitting } = formState;

  // Restore a saved draft after mount (sessionStorage isn't available during SSR).
  useEffect(() => {
    void Promise.resolve(useApplicationDraft.persist.rehydrate()).then(() => {
      const { values } = useApplicationDraft.getState();
      if (Object.keys(values).length) reset({ ...DEFAULTS, ...values });
    });
  }, [reset]);

  // Autosave (PII is stripped inside the store).
  const watched = useWatch({ control });
  useEffect(() => {
    const id = setTimeout(() => saveDraft(watched), 500);
    return () => clearTimeout(id);
  }, [watched, saveDraft]);

  // Move focus to the step heading so keyboard & screen-reader users land in the new content.
  const goTo = (next: number) => {
    setStep(next);
    requestAnimationFrame(() => headingRef.current?.focus());
  };

  const next = async () => {
    if (await trigger(STEP_FIELDS[step] ?? [], { shouldFocus: true })) goTo(step + 1);
  };

  // Built inside the event handler (not during render) so callbacks may touch refs.
  const onSubmit = (e: FormEvent<HTMLFormElement>) =>
    handleSubmit(
      async (data) => {
        try {
          const loan = await createLoan.mutateAsync(data);
          clear();
          reset(DEFAULTS);
          setSubmitted({ id: loan.id, reference: loan.reference });
        } catch (err) {
          // Map server-side validation issues back onto the fields.
          const details =
            err instanceof ApiError
              ? (err.details as { error?: { details?: unknown } })?.error?.details
              : null;
          if (Array.isArray(details)) {
            for (const issue of details as { path: string; message: string }[]) {
              setError(issue.path as FieldPath<Values>, { message: issue.message });
            }
          } else {
            setError("root.server", {
              message: err instanceof Error ? err.message : "Submission failed",
            });
          }
        }
      },
      (fieldErrors) => {
        // Cross-field rules (e.g. debt-service ratio) surface on submit — jump to the offending step.
        const first = Object.keys(fieldErrors)[0];
        if (first) goTo(stepOf(first));
      },
    )(e);

  if (submitted) {
    return (
      <Card className="mx-auto max-w-xl text-center" role="status">
        <p
          aria-hidden="true"
          className="bg-success/10 text-success mx-auto mb-3 grid size-12 place-items-center rounded-full text-2xl"
        >
          ✓
        </p>
        <h2 className="text-lg font-semibold">Application submitted</h2>
        <p className="text-fg-muted mt-1 text-sm">
          Reference <strong className="text-fg">{submitted.reference}</strong> has been queued for
          credit review.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link href={`/${submitted.id}`} className="text-brand-600 font-medium hover:underline">
            View application
          </Link>
          <button
            type="button"
            className="text-fg-muted font-medium hover:underline"
            onClick={() => setSubmitted(null)}
          >
            Start another
          </button>
        </div>
      </Card>
    );
  }

  const current = APPLICATION_STEPS[step]!;

  return (
    // min-w-0 on grid children: otherwise the horizontally-scrolling step list widens the
    // column past the viewport on phones and the whole page overflows sideways.
    <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
      <nav aria-label="Application progress" className="min-w-0">
        <ol className="flex flex-wrap gap-2 lg:flex-col">
          {APPLICATION_STEPS.map((s, i) => (
            <li key={s.id}>
              <span
                aria-current={i === step ? "step" : undefined}
                className={cn(
                  "flex items-center gap-3 whitespace-nowrap rounded-lg px-3 py-2 text-sm",
                  i === step
                    ? "bg-brand-50 text-brand-700 dark:bg-brand-900 dark:text-brand-100 font-medium"
                    : "text-fg-muted",
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "grid size-6 place-items-center rounded-full border text-xs",
                    i < step ? "border-success bg-success text-white" : "border-border",
                  )}
                >
                  {i < step ? "✓" : i + 1}
                </span>
                {s.title}
                {i < step && <span className="sr-only">(completed)</span>}
              </span>
            </li>
          ))}
        </ol>
      </nav>

      <Card className="min-w-0">
        <form onSubmit={onSubmit} noValidate aria-labelledby="step-heading">
          <h2
            id="step-heading"
            ref={headingRef}
            tabIndex={-1}
            className="mb-1 text-lg font-semibold focus:outline-none"
          >
            Step {step + 1} of {APPLICATION_STEPS.length}: {current.title}
          </h2>
          <p className="text-fg-muted mb-6 text-sm">Fields marked * are required.</p>

          {errors.root?.server && (
            <p role="alert" className="bg-danger/10 text-danger mb-4 rounded-lg px-3 py-2 text-sm">
              {errors.root.server.message}
            </p>
          )}

          <div className={cn("grid gap-5 sm:grid-cols-2", step !== 0 && "hidden")}>
            <TextField
              label="Full name"
              autoComplete="name"
              required
              error={errors.fullName?.message}
              {...register("fullName")}
            />
            <TextField
              label="National ID"
              inputMode="numeric"
              autoComplete="off"
              required
              hint="9 digits. Not stored in your browser draft."
              error={errors.nationalId?.message}
              {...register("nationalId")}
            />
            <TextField
              label="Email"
              type="email"
              autoComplete="email"
              required
              error={errors.email?.message}
              {...register("email")}
            />
            <TextField
              label="Phone"
              type="tel"
              autoComplete="tel"
              placeholder="+85512345678"
              required
              error={errors.phone?.message}
              {...register("phone")}
            />
            <TextField
              label="Date of birth"
              type="date"
              required
              error={errors.dateOfBirth?.message}
              {...register("dateOfBirth")}
            />
          </div>

          <div className={cn("grid gap-5 sm:grid-cols-2", step !== 1 && "hidden")}>
            <SelectField
              label="Employment type"
              required
              error={errors.employmentType?.message}
              {...register("employmentType")}
            >
              <option value="SALARIED">Salaried</option>
              <option value="SELF_EMPLOYED">Self-employed</option>
              <option value="BUSINESS_OWNER">Business owner</option>
            </SelectField>
            <TextField
              label="Employer name"
              autoComplete="organization"
              error={errors.employerName?.message}
              {...register("employerName")}
            />
            <TextField
              label="Net monthly income (USD)"
              type="number"
              inputMode="decimal"
              min={0}
              required
              error={errors.monthlyIncome?.message}
              {...register("monthlyIncome")}
            />
          </div>

          <div className={cn("grid gap-5 sm:grid-cols-2", step !== 2 && "hidden")}>
            <LoanStep form={form} />
          </div>

          {step === 3 && <ReviewStep values={form.getValues()} />}

          <div className="border-border mt-8 flex justify-between gap-3 border-t pt-5">
            <Button variant="secondary" onClick={() => goTo(step - 1)} disabled={step === 0}>
              Back
            </Button>
            {step < APPLICATION_STEPS.length - 1 ? (
              // Distinct keys: if React reused this <button> and flipped its type to "submit" mid-click,
              // the browser would submit the form on the same click that opens the review step.
              <Button key="next" onClick={next}>
                Continue
              </Button>
            ) : (
              <Button key="submit" type="submit" loading={isSubmitting}>
                Submit application
              </Button>
            )}
          </div>
        </form>
      </Card>
    </div>
  );
}

function LoanStep({ form }: { form: UseFormReturn<Values, unknown, LoanApplication> }) {
  const {
    register,
    control,
    formState: { errors },
  } = form;
  const [product, currency, amount, termMonths, monthlyIncome] = useWatch({
    control,
    name: ["product", "currency", "amount", "termMonths", "monthlyIncome"],
  });
  const rule = PRODUCT_RULES[product as LoanProduct];
  const amountUsd = toUsd(Number(amount) || 0, currency);
  const installment = monthlyInstallment(amountUsd, rule.rate, Number(termMonths) || 0);
  const income = Number(monthlyIncome) || 0;
  const overLimit =
    Number.isFinite(installment) && income > 0 && installment > income * MAX_DEBT_SERVICE_RATIO;

  return (
    <>
      <SelectField
        label="Product"
        required
        error={errors.product?.message}
        {...register("product")}
      >
        {LOAN_PRODUCTS.map((p) => (
          <option key={p} value={p}>
            {PRODUCT_RULES[p].label}
          </option>
        ))}
      </SelectField>
      <SelectField label="Currency" required {...register("currency")}>
        <option value="USD">USD</option>
        <option value="KHR">KHR</option>
      </SelectField>
      <TextField
        label="Amount"
        type="number"
        inputMode="decimal"
        min={0}
        required
        hint={`${formatMoney(rule.minAmount)} – ${formatMoney(rule.maxAmount)} (USD equivalent)`}
        error={errors.amount?.message}
        {...register("amount")}
      />
      <TextField
        label="Term (months)"
        type="number"
        inputMode="numeric"
        min={1}
        required
        hint={`${rule.minTerm} – ${rule.maxTerm} months`}
        error={errors.termMonths?.message}
        {...register("termMonths")}
      />
      <div className="sm:col-span-2">
        <TextAreaField
          label="Purpose"
          required
          error={errors.purpose?.message}
          {...register("purpose")}
        />
      </div>

      <output
        aria-live="polite"
        className={cn(
          "rounded-lg border p-4 text-sm sm:col-span-2",
          overLimit ? "border-danger/40 bg-danger/5" : "border-border bg-surface-muted",
        )}
      >
        {Number.isFinite(installment) && amountUsd > 0 ? (
          <>
            Estimated installment:{" "}
            <strong className="tabular-nums">{formatMoney(installment)}</strong> / month at{" "}
            {(rule.rate * 100).toFixed(1)}% p.a.
            {income > 0 && (
              <span className={cn("block", overLimit ? "text-danger" : "text-fg-muted")}>
                {((installment / income) * 100).toFixed(0)}% of monthly income (limit{" "}
                {MAX_DEBT_SERVICE_RATIO * 100}%)
              </span>
            )}
          </>
        ) : (
          "Enter an amount and term to see the estimated installment."
        )}
      </output>
    </>
  );
}

function ReviewStep({ values }: { values: Values }) {
  const rows: [string, string][] = [
    ["Applicant", values.fullName],
    ["National ID", values.nationalId ? `•••••${values.nationalId.slice(-4)}` : "—"],
    ["Email", values.email],
    ["Phone", values.phone],
    ["Employment", String(values.employmentType).replace("_", " ").toLowerCase()],
    ["Monthly income", formatMoney(Number(values.monthlyIncome) || 0)],
    ["Product", PRODUCT_RULES[values.product as LoanProduct].label],
    ["Amount", formatMoney(Number(values.amount) || 0, values.currency)],
    ["Term", `${values.termMonths} months`],
    ["Purpose", values.purpose],
  ];
  return (
    <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
      {rows.map(([label, value]) => (
        <div key={label}>
          <dt className="text-fg-muted">{label}</dt>
          <dd className="break-words font-medium">{value || "—"}</dd>
        </div>
      ))}
    </dl>
  );
}
