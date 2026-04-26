FROM node:22-alpine AS build
WORKDIR /app
COPY package.json ./
COPY tsconfig*.json ./
COPY nest-cli.json ./
COPY eslint.config.mjs ./
COPY src ./src
COPY test ./test
RUN corepack enable && pnpm install --frozen-lockfile=false && pnpm build

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
RUN apk add --no-cache fontconfig font-wqy-zenhei
COPY package.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
EXPOSE 3001
CMD ["node", "dist/main.js"]
