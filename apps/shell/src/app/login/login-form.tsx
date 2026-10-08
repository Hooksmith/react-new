"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CurrentUserSchema, LoginSchema, type LoginInput } from "@nexbank/api";
import { ApiError, apiFetch } from "@nexbank/api/client";
import { Button, TextField } from "@nexbank/ui";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

/** Only allow same-site relative redirects — prevents open-redirect phishing via ?next=. */
export function safeNextPath(next: string | null): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return "/";
  return next;
}

export function LoginForm() {
  const searchParams = useSearchParams();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(LoginSchema), mode: "onTouched" });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      await apiFetch("/api/auth/login", {
        method: "POST",
        body: values,
        schema: CurrentUserSchema,
      });
      // Full navigation: the target may live in another zone (e.g. /loans).
      window.location.assign(safeNextPath(searchParams.get("next")));
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "Unable to sign in. Please try again.");
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      {formError && (
        <p role="alert" className="bg-danger/10 text-danger rounded-lg px-3 py-2 text-sm">
          {formError}
        </p>
      )}
      <TextField
        label="Username"
        autoComplete="username"
        autoCapitalize="none"
        spellCheck={false}
        required
        error={errors.username?.message}
        {...register("username")}
      />
      <TextField
        label="Password"
        type="password"
        autoComplete="current-password"
        required
        error={errors.password?.message}
        {...register("password")}
      />
      <Button type="submit" className="w-full" loading={isSubmitting}>
        Sign in
      </Button>
    </form>
  );
}
