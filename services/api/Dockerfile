FROM node:22-alpine AS build
WORKDIR /repo
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY services/api/package.json services/api/package.json
RUN corepack enable \
  && corepack prepare pnpm@10.15.1 --activate \
  && pnpm config set registry https://registry.npmmirror.com \
  && pnpm install --frozen-lockfile --filter @fortune-hub/api...
COPY services/api/tsconfig*.json services/api/
COPY services/api/nest-cli.json services/api/
COPY services/api/eslint.config.mjs services/api/
COPY services/api/src services/api/src
COPY services/api/test services/api/test
WORKDIR /repo/services/api
RUN pnpm build

FROM node:22-alpine
WORKDIR /repo
ENV NODE_ENV=production
RUN sed -i 's#https://dl-cdn.alpinelinux.org/alpine#https://mirrors.aliyun.com/alpine#g' /etc/apk/repositories \
  && apk add --no-cache --no-scripts fontconfig font-noto-cjk font-wqy-zenhei
COPY --from=build /repo/node_modules ./node_modules
COPY --from=build /repo/services/api/package.json ./services/api/package.json
COPY --from=build /repo/services/api/node_modules ./services/api/node_modules
COPY --from=build /repo/services/api/dist ./services/api/dist
COPY --from=build /repo/services/api/src/assets ./services/api/dist/assets
WORKDIR /repo/services/api
EXPOSE 3001
CMD ["node", "dist/main.js"]
