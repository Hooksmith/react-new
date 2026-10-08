# syntax=docker/dockerfile:1.7
# One parameterised image definition for every zone:
#   docker build --build-arg APP=shell -t nexbank/shell .
#   docker build --build-arg APP=loans -t nexbank/loans .

ARG NODE_IMAGE=node:22-alpine

# ---- deps: install only what the selected zone needs (cached on lockfile changes) ----------
FROM ${NODE_IMAGE} AS deps
RUN corepack enable
WORKDIR /repo
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/shell/package.json apps/shell/
COPY apps/loans/package.json apps/loans/
COPY packages/api/package.json packages/api/
COPY packages/config/package.json packages/config/
COPY packages/security/package.json packages/security/
COPY packages/ui/package.json packages/ui/
COPY e2e/package.json e2e/
ARG APP
RUN --mount=type=cache,id=pnpm-store,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile --filter "@nexbank/${APP}..."

# ---- build ---------------------------------------------------------------------------------
FROM deps AS builder
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
ARG APP
# next.config rewrites are resolved at build time, so the loans-zone upstream is baked in.
# Default = the Kubernetes / compose service name.
ARG LOANS_ZONE_URL=http://loans:3000
ENV LOANS_ZONE_URL=${LOANS_ZONE_URL}
RUN pnpm --filter "@nexbank/${APP}" build

# ---- runtime: standalone output only, non-root, no package manager -------------------------
FROM ${NODE_IMAGE} AS runner
ARG APP
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    APP=${APP}
WORKDIR /app

RUN addgroup -S -g 1001 nodejs && adduser -S -u 1001 -G nodejs nextjs

# `output: "standalone"` traces exactly the files the server needs (incl. node_modules).
COPY --from=builder --chown=nextjs:nodejs /repo/apps/${APP}/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /repo/apps/${APP}/.next/static ./apps/${APP}/.next/static

USER nextjs
EXPOSE 3000
CMD ["sh", "-c", "exec node apps/${APP}/server.js"]
