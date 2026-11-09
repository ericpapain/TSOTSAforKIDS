# Stage 1: Build Web SPA assets
FROM node:20-alpine AS builder

WORKDIR /app
RUN corepack enable && corepack prepare pnpm@latest --activate

# Workspace declarations and root manifests
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/api-client ./packages/api-client
COPY apps/web ./apps/web

RUN pnpm install --frozen-lockfile
RUN pnpm --filter @tsotsa/web build

# Stage 2: Serve with lightweight Nginx
FROM nginx:alpine

RUN addgroup -g 1001 -S tsotsa && adduser -u 1001 -S tsotsa -G tsotsa

COPY infra/docker/nginx-web.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html

RUN chown -R tsotsa:tsotsa /usr/share/nginx/html /var/cache/nginx /var/log/nginx /etc/nginx/conf.d \
    && touch /var/run/nginx.pid \
    && chown -R tsotsa:tsotsa /var/run/nginx.pid

USER tsotsa

EXPOSE 80

HEALTHCHECK --interval=15s --timeout=3s --retries=3 --start-period=5s \
  CMD wget --no-verbose --tries=1 --spider http://localhost/healthz || exit 1

CMD ["nginx", "-g", "daemon off;"]

