FROM node:22-alpine AS build
WORKDIR /app
COPY package.json ./
COPY tsconfig.json ./
COPY vite.config.ts ./
COPY index.html ./
COPY src ./src
ARG VITE_API_BASE_URL=/api/v1
ARG VITE_FILE_SERVICE_BASE_URL=http://host.docker.internal:3000/api
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_FILE_SERVICE_BASE_URL=$VITE_FILE_SERVICE_BASE_URL
RUN corepack enable && pnpm install --frozen-lockfile=false && pnpm build:h5

FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/build/h5 /usr/share/nginx/html
