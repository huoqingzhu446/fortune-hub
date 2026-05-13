FROM node:22-alpine AS build
WORKDIR /repo
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/admin/package.json apps/admin/package.json
ARG VITE_API_BASE_URL=/api/v1
ARG VITE_PUBLIC_BASE=/admin/
ARG VITE_FILE_SERVICE_BASE_URL=http://host.docker.internal:3000/api
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_PUBLIC_BASE=$VITE_PUBLIC_BASE
ENV VITE_FILE_SERVICE_BASE_URL=$VITE_FILE_SERVICE_BASE_URL
RUN corepack enable \
  && corepack prepare pnpm@10.15.1 --activate \
  && pnpm config set registry https://registry.npmmirror.com \
  && pnpm install --frozen-lockfile --filter @fortune-hub/admin...
COPY apps/admin apps/admin
WORKDIR /repo/apps/admin
RUN pnpm build

FROM nginx:1.27-alpine
COPY apps/admin/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /repo/apps/admin/dist /usr/share/nginx/html
