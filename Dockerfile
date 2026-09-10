FROM oven/bun:1.3.14-alpine AS dependencies

WORKDIR /app

COPY package.json bun.lock ./
COPY apps/http/package.json apps/http/package.json
COPY apps/outbox-dispatcher/package.json apps/outbox-dispatcher/package.json
COPY apps/web/package.json apps/web/package.json
COPY apps/ws/package.json apps/ws/package.json
COPY packages/auth/package.json packages/auth/package.json
COPY packages/contracts/package.json packages/contracts/package.json
COPY packages/db/package.json packages/db/package.json
COPY packages/queue/package.json packages/queue/package.json
COPY packages/typescript-config/package.json packages/typescript-config/package.json
COPY packages/ui/package.json packages/ui/package.json

RUN bun install --frozen-lockfile

FROM dependencies AS application

COPY apps ./apps
COPY packages ./packages

RUN DATABASE_URL=postgresql://postgres@localhost:5432/postgres?schema=public bun run db:generate

FROM oven/bun:1.3.14-alpine AS production-dependencies

WORKDIR /app

COPY package.json bun.lock ./
COPY apps/http/package.json apps/http/package.json
COPY apps/outbox-dispatcher/package.json apps/outbox-dispatcher/package.json
COPY apps/web/package.json apps/web/package.json
COPY apps/ws/package.json apps/ws/package.json
COPY packages/auth/package.json packages/auth/package.json
COPY packages/contracts/package.json packages/contracts/package.json
COPY packages/db/package.json packages/db/package.json
COPY packages/queue/package.json packages/queue/package.json
COPY packages/typescript-config/package.json packages/typescript-config/package.json
COPY packages/ui/package.json packages/ui/package.json

RUN bun install --frozen-lockfile --production --filter @agent-platform/http --filter @agent-platform/ws --filter @agent-platform/outbox-dispatcher

FROM oven/bun:1.3.14-alpine AS runtime

WORKDIR /app

ENV NODE_ENV=production

COPY --from=application --chown=bun:bun /app/package.json ./package.json
COPY --from=application --chown=bun:bun /app/bun.lock ./bun.lock
COPY --from=production-dependencies --chown=bun:bun /app/node_modules ./node_modules
COPY --from=application --chown=bun:bun /app/apps ./apps
COPY --from=application --chown=bun:bun /app/packages ./packages

USER bun

FROM runtime AS http

EXPOSE 4000

CMD ["bun", "apps/http/src/index.ts"]

FROM runtime AS ws

EXPOSE 4500

CMD ["bun", "apps/ws/src/index.ts"]

FROM runtime AS outbox-dispatcher

CMD ["bun", "apps/outbox-dispatcher/src/index.ts"]

FROM application AS migrate

USER bun

CMD ["bun", "packages/db/node_modules/.bin/prisma", "migrate", "deploy", "--config", "packages/db/prisma.config.ts"]
