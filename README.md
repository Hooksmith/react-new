# NexBank Lending

A loan-origination and credit-analytics web app for bank staff, built as a **Next.js 16 multi-zone
micro-frontend** in a pnpm/Turborepo monorepo.

Loan officers capture applications through a validated multi-step form. Credit analysts review and
approve them with role-based permissions. Everyone sees a real-time dashboard of portfolio health,
loan pipeline and credit-score risk.

> Demo accounts: `officer` / `Password123!` (Loan officer) and `analyst` / `Password123!` (Credit analyst).
> The backend is an in-memory mock behind a BFF, seeded from JSON in
> [`apps/shell/src/server/data/`](apps/shell/src/server/data/) (`loans.json`, `users.json`).
> Edits to those files are validated with Zod on startup; changes made in the app live in memory
> and reset on restart. There is no real customer data.

---

## Quick start

```bash
pnpm install
pnpm dev                    # shell → http://localhost:3000, loans zone → :3001 (proxied under /loans)
```

Always open **http://localhost:3000**. The shell proxies `/loans/*` to the loans zone, exactly as
the ingress does in production.

| Command                   | What it does                                                   |
| ------------------------- | -------------------------------------------------------------- |
| `pnpm dev`                | Run both zones with Turbopack                                  |
| `pnpm build`              | Production build of every zone (standalone output)             |
| `pnpm lint` / `typecheck` | ESLint (incl. jsx-a11y, react-hooks, Next rules) / `tsc`       |
| `pnpm test`               | Vitest + Testing Library unit/integration tests                |
| `pnpm test:e2e`           | Playwright E2E + axe accessibility scans (desktop & mobile)    |
| `pnpm format`             | Prettier (with Tailwind class sorting)                         |
| `docker compose up`       | Both zones as hardened containers (needs `SESSION_SECRET` set) |
| `kubectl apply -k k8s/`   | Deploy to Kubernetes                                           |

---

## Architecture

```
                          ┌──────────────── Ingress (TLS, rate-limit, SSE-friendly) ────────────────┐
  browser ── https ──►    │   /loans/*  ───────────────────────►  loans zone  (Next.js, basePath)    │
                          │   /*        ──►  shell zone (Next.js) ── rewrite fallback ──► loans zone │
                          └──────────────────────────┬──────────────────────────────────────────────┘
                                                     │ /api/* (BFF: REST + GraphQL + SSE)
                                                     ▼
                                       in-memory mock of core banking / LOS
```

```
apps/
  shell/        Zone 1: login, dashboard, analytics, and the BFF API (/api/*)
  loans/        Zone 2: loan list, loan detail/decisioning, application wizard (basePath /loans)
packages/
  api/          Zod schemas (single source of truth), typed fetch client, TanStack Query hooks
  ui/           Shared accessible design system (Tailwind v4 tokens, AppShell, fields, badges…)
  security/     HMAC session tokens, CSRF double-submit, CSP/nonce + security headers
  config/       Shared tsconfig / ESLint flat config / Vitest defaults
e2e/            Playwright suites: auth, multi-zone flows, RBAC, security headers, a11y, reflow
k8s/            Kustomize manifests: Deployments, Services, HPA, PDB, Ingress, NetworkPolicies
```

### Key design decisions

- **Multi-zones instead of runtime module federation.** Each zone is an independently built and
  deployed Next.js app with its own release cadence, and they share code through workspace
  packages. Cross-zone links are plain `<a>` tags (a hard navigation), while links within a zone
  use `next/link`. `AppShell` and `ZoneLink` handle this automatically, including stripping the
  `basePath`.
- **One contract, enforced twice.** `LoanApplicationSchema` (Zod) drives React Hook Form on the
  client _and_ validates the API request on the server. That includes cross-field business rules
  such as product limits, KHR→USD conversion, and the 50% debt-service ratio. The client also
  validates every API **response** at runtime, so a backend contract drift fails loudly.
- **Server state vs client state.** TanStack Query owns server data: caching, pagination with
  `keepPreviousData`, optimistic status updates with rollback, and SSR prefetch + `HydrationBoundary`
  on the dashboard. Zustand owns client-only state: the live activity feed, the wizard draft and
  list preferences.
- **Real-time.** `/api/loans/stream` is Server-Sent Events. Each event patches the TanStack cache,
  so open tables update in place. It also feeds the Zustand activity feed and announces the change
  through a polite `aria-live` region. Aggregate refetches are debounced.
- **Performance.** Recharts is lazy-loaded (`next/dynamic`, `ssr: false`) so the KPI tiles paint
  from server-rendered HTML first. Other measures: `optimizePackageImports`, request-scoped
  `React.cache` for session lookup, and the standalone output gives ~40 MB server bundles.

### Security (OWASP-oriented)

| Threat                  | Mitigation                                                                                               |
| ----------------------- | -------------------------------------------------------------------------------------------------------- |
| XSS                     | Nonce-based CSP with `strict-dynamic`, React escaping, `react/no-danger` lint rule, strict input regexes |
| CSRF                    | Double-submit token (`x-csrf-token`) + Origin check on every mutation; `SameSite` cookies                |
| Session theft           | HMAC-signed, `HttpOnly`, `Secure`, 30-min TTL cookie; constant-time signature compare                    |
| Broken access control   | Auth checked in **both** proxies _and_ every route handler; role-based transitions (`canTransition`)     |
| Clickjacking / sniffing | `frame-ancestors 'none'`, `X-Frame-Options`, `nosniff`, HSTS, COOP, Permissions-Policy                   |
| Credential stuffing     | Per-IP failed-login throttle + ingress rate limit; generic error messages; uniform hashing time          |
| Open redirect           | `?next=` restricted to same-site relative paths                                                          |
| PII exposure            | National ID masked by the API; wizard drafts are stored in `sessionStorage` with PII removed             |
| GraphQL abuse           | Query size/depth limits, introspection disabled in production                                            |
| Supply chain            | Frozen lockfile, pnpm build-script allow-list, `pnpm audit`, Trivy image scan in CI                      |
| Misconfiguration        | Env validated at boot (`instrumentation.ts`); containers non-root with a read-only root filesystem       |

### Accessibility (WCAG 2.2 AA)

Every page is scanned with axe in CI on both desktop and mobile viewports. Other measures:

- Skip link and landmarks.
- Labelled fields with `aria-describedby` hints and errors.
- Focus moves to the step heading in the wizard.
- `aria-current` for navigation and steps.
- Status is never conveyed by colour alone.
- Every chart has a data-table alternative.
- `prefers-reduced-motion` is respected.
- A reflow test asserts no horizontal scrolling at phone width (WCAG 1.4.10).

---

## Deployment

**Docker.** One parameterised `Dockerfile` (`--build-arg APP=shell|loans`). It installs only the
target zone's dependency graph, builds Next's standalone output, and runs as a non-root user on
`node:22-alpine`. The shell's rewrite target is baked in at build time through
`--build-arg LOANS_ZONE_URL` (default `http://loans:3000`).

**Kubernetes** (`k8s/`):

- The namespace enforces the _restricted_ Pod Security Standard.
- Containers run read-only, with all capabilities dropped and seccomp enabled.
- Startup, readiness and liveness probes point at the health endpoints.
- The loans zone has an HPA and a PDB.
- NetworkPolicies are default-deny.
- The ingress routes `/loans` straight to the loans zone and leaves SSE responses unbuffered.

> The shell runs as a single replica because the mock BFF keeps state in memory. Point the BFF at
> real services (and the login throttle at Redis) before scaling it.

**CI** (`.github/workflows/ci.yml`):

1. format → lint → typecheck → unit tests with coverage → build → dependency audit
2. Playwright E2E against production builds
3. Docker build per zone → Trivy scan → push to GHCR on `main`

---

## How this maps to the role

| Job requirement                                 | Where it lives                                                                 |
| ----------------------------------------------- | ------------------------------------------------------------------------------ |
| React + TypeScript (strict)                     | Entire repo; `noUncheckedIndexedAccess`, Zod-inferred types end to end         |
| Next.js, micro-frontends / **multi-zones**      | `apps/shell` + `apps/loans`, rewrites, `basePath`, `ZoneLink`, ingress routing |
| Zustand / Redux Toolkit                         | `apps/*/src/stores/*` (persist, `skipHydration`, `useShallow`)                 |
| TanStack Query                                  | `packages/api/src/client/hooks.ts`, SSR hydration, optimistic updates          |
| REST **and** GraphQL integration                | `/api/loans*` route handlers, `/api/graphql` + `gql()` client                  |
| React Hook Form + Zod                           | Login form, 4-step application wizard, shared schemas                          |
| Real-time dashboards (loans, credit, analytics) | Dashboard (SSE + charts), Credit analytics (GraphQL)                           |
| Security (XSS, CSRF, banking standards)         | `packages/security`, both `proxy.ts`, route handlers                           |
| Accessibility                                   | `packages/ui`, axe E2E suite                                                   |
| Unit, integration, UI tests                     | Vitest/RTL in every package; Playwright E2E                                    |
| Vite, pnpm, ESLint, Prettier                    | Vitest (Vite), pnpm workspaces, ESLint 9 flat config, Prettier                 |
| CI/CD, Docker, Kubernetes                       | `.github/workflows`, `Dockerfile`, `docker-compose.yml`, `k8s/`                |
