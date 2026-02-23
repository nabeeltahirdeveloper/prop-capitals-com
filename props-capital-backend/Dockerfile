# ─────────────────────────────────────────────────────────────────────────────
# Stage 1 — Builder
# Install all dependencies, generate Prisma client, compile TypeScript
# ─────────────────────────────────────────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

# Install OS-level dependencies needed by some native node modules (bcrypt, etc.)
RUN apk add --no-cache python3 make g++

# Copy dependency manifests first — maximises Docker layer caching
COPY package.json ./

# Install ALL dependencies (dev included — needed for @nestjs/cli & prisma CLI)
# --no-frozen-lockfile lets yarn resolve even when yarn.lock is slightly stale.
# The lockfile is never written back to the host from inside Docker.
RUN yarn install --no-frozen-lockfile

# Copy Prisma schema before running prisma generate
COPY prisma ./prisma

# Copy the rest of the source
COPY . .

# `yarn build` runs the `prebuild` hook automatically:
#   prebuild = "rm -f dist/tsconfig.build.tsbuildinfo && prisma generate"
# then compiles with `nest build` (webpack — produces dist/main.js)
RUN yarn build


# ─────────────────────────────────────────────────────────────────────────────
# Stage 2 — Production
# Lean image: only production node_modules + compiled dist + prisma client
# ─────────────────────────────────────────────────────────────────────────────
FROM node:22-alpine AS production

WORKDIR /app

ENV NODE_ENV=production

# Same native build tools needed for bcrypt at install time
RUN apk add --no-cache python3 make g++

# Copy manifests and install production dependencies only
COPY package.json ./
RUN yarn install --no-frozen-lockfile --production && yarn cache clean

# Compiled NestJS application
COPY --from=builder /app/dist ./dist

# Prisma generated client (built during the builder stage)
# @prisma/client runtime is in production node_modules;
# the generated code lives in .prisma/client and must be copied separately.
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Prisma schema (needed for certain Prisma runtime operations)
COPY prisma ./prisma

EXPOSE 5101

# prisma.config.ts sits at the project root, so TypeScript uses the repo root
# as rootDir.  src/main.ts therefore compiles to dist/src/main.js.
CMD ["node", "dist/src/main"]
