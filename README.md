# Fortune Hub

`fortune-hub` 是一个面向微信小程序、后台管理和 API 服务的多应用仓库，按你指定的技术栈搭好了首版工程骨架。

## Layout

- `apps/mobile`: `uni-app CLI + Vue 3 + Vite + TypeScript + SCSS + Pinia + uni-ui`
- `apps/admin`: `Vue 3 + Vite + Element Plus`
- `services/api`: `NestJS + MySQL + Redis`
- `deploy/nginx`: `Nginx HTTPS` 入口配置

## Shared decisions

- 小程序请求层使用 `uni.request` 二次封装，并通过 `uni.addInterceptor` 统一拼接接口地址
- 后端对外暴露 `/api/v1`
- 文件上传走独立文件服务，通过 `FILE_SERVICE_BASE_URL` 注入
- 管理后台和 API 都预留了 Docker 部署方式

## Quick start

```bash
cp .env.example .env
cp apps/mobile/.env.example apps/mobile/.env
cp apps/admin/.env.example apps/admin/.env
cp services/api/.env.example services/api/.env
pnpm install
```

### Local development

```bash
pnpm dev:mobile
pnpm dev:admin
pnpm dev:api
```

### Build

```bash
pnpm build:mobile
pnpm build:admin
pnpm build:api
```

### Docker Compose

把证书放到 `deploy/nginx/ssl/fullchain.pem` 和 `deploy/nginx/ssl/privkey.pem` 后再运行：

```bash
pnpm docker:up
```

## External file service

默认接入你刚才单独做的文件服务：

- local dev: `http://localhost:3000/api`
- docker dev: `http://host.docker.internal:3000/api`

如果文件服务部署到了独立域名，只需要改这些环境变量：

- `apps/mobile/.env`
- `apps/admin/.env`
- `services/api/.env`
- 根目录 `.env`
