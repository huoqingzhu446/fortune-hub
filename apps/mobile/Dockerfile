FROM node:22-alpine AS build
WORKDIR /repo
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/mobile/package.json apps/mobile/package.json
ARG VITE_API_BASE_URL=/api/v1
ARG VITE_FILE_SERVICE_BASE_URL=http://host.docker.internal:3000/api
ARG VITE_PAYMENT_MODE=disabled
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_FILE_SERVICE_BASE_URL=$VITE_FILE_SERVICE_BASE_URL
ENV VITE_PAYMENT_MODE=$VITE_PAYMENT_MODE
RUN corepack enable \
  && corepack prepare pnpm@10.15.1 --activate \
  && pnpm config set registry https://registry.npmmirror.com \
  && pnpm install --frozen-lockfile --filter @fortune-hub/mobile...
COPY apps/mobile apps/mobile
WORKDIR /repo/apps/mobile
RUN pnpm build:h5

FROM nginx:1.27-alpine
COPY apps/mobile/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /repo/apps/mobile/dist/build/h5 /usr/share/nginx/html
