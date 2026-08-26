# syntax=docker/dockerfile:1.7
#
# Build context MUST be the monorepo root (not apps/api) — the API depends on the
# @repo/contracts workspace package and the root pnpm lockfile.
#   docker build -f apps/api/Dockerfile -t starter-api .

ARG NODE_VERSION=20-bookworm-slim

# ---------------------------------------------------------------------------
# base — shared pnpm setup
# ---------------------------------------------------------------------------
FROM node:${NODE_VERSION} AS base
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /repo

# ---------------------------------------------------------------------------
# build — installs full workspace deps (incl. devDependencies) and compiles
# ---------------------------------------------------------------------------
FROM base AS build

# argon2/bcrypt are native addons — build tools are needed if no prebuilt binary matches.
RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ openssl \
  && rm -rf /var/lib/apt/lists/*

# apps/api has its own `postinstall: prisma generate` — the schema must already be on
# disk before `pnpm install` runs, so source is copied in full ahead of install here
# (rather than manifests-only) even though that costs some layer-cache granularity.
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY apps/web/package.json apps/web/package.json
COPY packages/contracts packages/contracts
COPY apps/api apps/api
RUN pnpm install --frozen-lockfile

WORKDIR /repo/apps/api
RUN npx prisma generate
RUN pnpm run build
RUN chmod +x docker-entrypoint.sh

# ---------------------------------------------------------------------------
# runtime — slim image, no compilers, runs as a non-root user
# ---------------------------------------------------------------------------
FROM node:${NODE_VERSION} AS runtime
ENV NODE_ENV=production \
    STAGE=production

RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates curl \
  && rm -rf /var/lib/apt/lists/* \
  && groupadd --gid 1001 nodejs \
  && useradd --uid 1001 --gid nodejs --create-home --shell /usr/sbin/nologin apiuser

WORKDIR /repo
# devDependencies are kept (not pruned) — needed at runtime for:
#  - `prisma` CLI: the entrypoint runs `prisma migrate deploy` on every container start
#  - `ts-node`: @repo/contracts ships as TypeScript source with no build step of its own
#    (dev runs it through ts-node's transpile hook); the compiled dist/index.js needs
#    that same hook registered at runtime or `require('@repo/contracts/...')` fails —
#    see the `-r ts-node/register/transpile-only` flag in the CMD below.
COPY --from=build --chown=apiuser:nodejs /repo /repo

USER apiuser
WORKDIR /repo/apps/api

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD curl -fsS "http://localhost:${PORT:-3000}/api/health" || exit 1

ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "-r", "ts-node/register/transpile-only", "-r", "tsconfig-paths/register", "dist/index.js"]
