# Stage 1: Build Web SPA assets
FROM node:20-alpine AS builder

WORKDIR /app
RUN corepack enable && corepack prepare pnpm@latest --activate

# Workspace declarations and root manifests
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/api-client ./packages/api-client
COPY packages/i18n ./packages/i18n
COPY scripts ./scripts
COPY apps/web ./apps/web

RUN pnpm install --frozen-lockfile
RUN pnpm --filter @tsotsa/web build

# Stage 2: Serve with lightweight Nginx
FROM nginx:alpine

COPY infra/docker/nginx-web.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=15s --timeout=3s --retries=3 --start-period=5s \
  CMD wget --no-verbose --tries=1 --spider http://localhost/healthz || exit 1

CMD ["nginx", "-g", "daemon off;"]

