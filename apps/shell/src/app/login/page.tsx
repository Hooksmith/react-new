import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <main id="main" className="grid min-h-dvh place-items-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <span
            aria-hidden="true"
            className="bg-brand-600 mx-auto mb-4 grid size-12 place-items-center rounded-xl text-xl font-bold text-white"
          >
            N
          </span>
          <h1 className="text-fg text-2xl font-semibold">Sign in to NexBank Lending</h1>
          <p className="text-fg-muted mt-1 text-sm">Staff access only. Activity is monitored.</p>
        </div>
        <div className="border-border bg-surface rounded-xl border p-6 shadow-sm">
          <Suspense>
            <LoginForm />
          </Suspense>
        </div>
        <p className="text-fg-muted mt-4 text-center text-xs">
          Demo accounts: <code>officer</code> or <code>analyst</code> / <code>Password123!</code>
        </p>
      </div>
    </main>
  );
}
