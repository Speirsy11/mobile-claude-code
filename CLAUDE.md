# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Vision

This is **Mobile Claude Code** - a secure remote bridge allowing users to control a Claude Code CLI session running on their Desktop from a Mobile Device. The mobile client renders a rich, agent-aware UI (parsing state, permissions, diffs) rather than a raw terminal stream.

**Key architectural goals:**
- End-to-end encryption using TweetNaCl.js (NaCl Box)
- WebSocket relay ("blind relay" pattern) for NAT traversal without port forwarding
- QR code pairing flow with ECDH key exchange

## Tech Stack

TurboRepo monorepo based on create-t3-turbo:
- **apps/expo** - React Native mobile client (Expo SDK 54, NativeWind v5)
- **apps/nextjs** - Next.js 15 web app (or apps/tanstack-start as alternative)
- **packages/api** - tRPC v11 router definitions
- **packages/auth** - Authentication via better-auth
- **packages/db** - Drizzle ORM with Supabase/Postgres
- **packages/validators** - Shared Zod schemas
- **packages/ui** - Shared UI components (shadcn/ui)
- **tooling/** - Shared ESLint, Prettier, Tailwind, TypeScript configs

## Commands

```bash
# Install dependencies
pnpm i

# Run all apps in dev mode
pnpm dev

# Run specific apps
pnpm dev:next          # Next.js only
pnpm --filter @mcc/expo dev  # Expo only

# Database
pnpm db:push           # Push Drizzle schema to database
pnpm db:studio         # Open Drizzle Studio

# Auth
pnpm auth:generate     # Generate Better Auth schema

# Quality
pnpm lint              # ESLint
pnpm lint:fix          # ESLint with auto-fix
pnpm format            # Prettier check
pnpm format:fix        # Prettier with auto-fix
pnpm typecheck         # TypeScript type checking

# Build
pnpm build             # Build all packages

# Mobile
pnpm android           # Run on Android
pnpm ios               # Run on iOS
```

## Environment Setup

Copy `.env.example` to `.env` and configure:
- `POSTGRES_URL` - Supabase connection string
- `AUTH_SECRET` - Generate via `openssl rand -base64 32`
- `AUTH_DISCORD_ID/SECRET` - OAuth credentials (optional)

## Architecture Notes

**tRPC Flow:** Apps import `@mcc/api` as dev dependency for types only. The API package depends on `@mcc/auth` and `@mcc/db` for runtime code.

**Package naming:** All internal packages use `@mcc/` prefix. Replace with your own org name using find-and-replace if desired.

**Expo mobile app:** Located at `apps/expo`. Uses Expo Router for navigation and tRPC for API calls to the Next.js backend.

**Future structure per overview.md:**
- Desktop app (Electron + node-pty) - not yet implemented
- Relay server (Fastify + WebSocket for Fly.io) - not yet implemented
- Core package for shared crypto, protocol types, Zod schemas - to be extracted

## Development Workflow

Follow these rules when implementing tasks from PLAN.md:

1. **One branch per task** - Create a new feature branch for each task or logical group of related tasks
2. **Branch naming** - Use descriptive branch names like `feat/core-package-setup` or `feat/relay-server`
3. **Dependent branches** - If a PR hasn't been merged yet but you need its changes, branch off that PR's branch
4. **CI must pass** - Before creating a PR, ensure all CI steps pass:
   ```bash
   pnpm lint        # ESLint
   pnpm lint:ws     # Workspace lint (sherif)
   pnpm format      # Prettier check
   pnpm typecheck   # TypeScript
   ```
5. **PR with summary** - Create a PR with a clear summary of changes when the task is complete
6. **Update PLAN.md** - Mark completed tasks with `[x]` and update the progress summary table

## Implementation Plan

See `PLAN.md` for the full implementation plan with epics and tasks. Work through tasks in the recommended order, starting with Epic 1 (Core Package).
