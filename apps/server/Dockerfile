FROM oven/bun:1.4.2-slim AS install
WORKDIR /app
COPY package.json bun.lock ./
COPY packages/api/package.json packages/api/
COPY packages/config/package.json packages/config/
COPY apps/server/package.json apps/server/
RUN bun install --frozen-lockfile --production

FROM oven/bun:1.4.2-slim
WORKDIR /app
COPY --from=install /app/node_modules ./node_modules
COPY packages/api packages/api
COPY apps/server apps/server
ENV NODE_ENV=production
CMD ["bun", "apps/server/src/main.ts"]
