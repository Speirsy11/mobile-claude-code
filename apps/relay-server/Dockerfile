# Build stage
FROM node:22-alpine AS builder

WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy workspace files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/relay-server/package.json ./apps/relay-server/
COPY packages/core/package.json ./packages/core/
COPY tooling/typescript/package.json ./tooling/typescript/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source files
COPY apps/relay-server ./apps/relay-server
COPY packages/core ./packages/core
COPY tooling/typescript ./tooling/typescript

# Build
WORKDIR /app/apps/relay-server
RUN pnpm build

# Production stage
FROM node:22-alpine AS runner

WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy necessary files from builder
COPY --from=builder /app/package.json /app/pnpm-lock.yaml /app/pnpm-workspace.yaml ./
COPY --from=builder /app/apps/relay-server/package.json ./apps/relay-server/
COPY --from=builder /app/apps/relay-server/dist ./apps/relay-server/dist
COPY --from=builder /app/packages/core/package.json ./packages/core/
COPY --from=builder /app/packages/core/src ./packages/core/src
COPY --from=builder /app/tooling/typescript/package.json ./tooling/typescript/

# Install production dependencies only
RUN pnpm install --frozen-lockfile --prod

WORKDIR /app/apps/relay-server

# Set environment variables
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=8080

EXPOSE 8080

CMD ["node", "dist/index.js"]
