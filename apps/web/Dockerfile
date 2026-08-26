# syntax=docker/dockerfile:1.7
#
# Build context MUST be the monorepo root (not apps/web) — the web app depends on the
# @repo/contracts workspace package and the root pnpm lockfile.
#   docker build -f apps/web/Dockerfile -t starter-web \
#     --build-arg NEXT_PUBLIC_API_URL=https://api.example.com/api .
#
# NEXT_PUBLIC_* variables are inlined into the client bundle at BUILD time by Next.js —
# they must be passed as a --build-arg, setting them only at `docker run` has no effect.

ARG NODE_VERSION=20-bookworm-slim

# ---------------------------------------------------------------------------
# base — shared pnpm setup
# ---------------------------------------------------------------------------
FROM node:${NODE_VERSION} AS base
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /repo

# ---------------------------------------------------------------------------
# build
# ---------------------------------------------------------------------------
FROM base AS build

# A monorepo-wide `pnpm install` also builds apps/api's native deps (argon2/bcrypt)
# even though this image never uses them — build tools are needed for that install to
# succeed if no prebuilt binary matches.
RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

# apps/api has its own `postinstall: prisma generate` that pnpm runs for every
# workspace member during install — its schema must be present too, even though this
# image never uses apps/api itself, or the install fails.
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/api/prisma apps/api/prisma
COPY apps/web/package.json apps/web/package.json
COPY packages/contracts/package.json packages/contracts/package.json
RUN pnpm install --frozen-lockfile

COPY packages/contracts packages/contracts
COPY apps/web apps/web
# the project currently ships no static /public assets — keep the COPY below valid either way
RUN mkdir -p apps/web/public

ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL} \
    NEXT_TELEMETRY_DISABLED=1

WORKDIR /repo/apps/web
RUN pnpm run build

# ---------------------------------------------------------------------------
# runtime — Next.js standalone server, no compilers, runs as a non-root user
# ---------------------------------------------------------------------------
FROM node:${NODE_VERSION} AS runtime
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3001 \
    HOSTNAME=0.0.0.0

RUN apt-get update \
  && apt-get install -y --no-install-recommends curl ca-certificates \
  && rm -rf /var/lib/apt/lists/* \
  && groupadd --gid 1001 nodejs \
  && useradd --uid 1001 --gid nodejs --create-home --shell /usr/sbin/nologin webuser

WORKDIR /app

# Next.js standalone output only traces server code + a pruned node_modules — static
# assets and the public/ folder must be copied in manually (Next.js docs).
COPY --from=build --chown=webuser:nodejs /repo/apps/web/.next/standalone ./
COPY --from=build --chown=webuser:nodejs /repo/apps/web/.next/static ./apps/web/.next/static
COPY --from=build --chown=webuser:nodejs /repo/apps/web/public ./apps/web/public

USER webuser
WORKDIR /app/apps/web

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD curl -fsS "http://localhost:${PORT}/en" || exit 1

CMD ["node", "server.js"]
