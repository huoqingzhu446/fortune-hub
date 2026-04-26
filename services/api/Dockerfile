FROM node:22-alpine AS build
WORKDIR /app
COPY package.json ./
RUN corepack enable \
  && pnpm config set registry https://registry.npmmirror.com \
  && pnpm install --frozen-lockfile=false
COPY tsconfig*.json ./
COPY nest-cli.json ./
COPY eslint.config.mjs ./
COPY src ./src
COPY test ./test
RUN pnpm build

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
RUN sed -i 's#https://dl-cdn.alpinelinux.org/alpine#https://mirrors.aliyun.com/alpine#g' /etc/apk/repositories \
  && apk add --no-cache --no-scripts fontconfig font-wqy-zenhei
COPY package.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
EXPOSE 3001
CMD ["node", "dist/main.js"]
