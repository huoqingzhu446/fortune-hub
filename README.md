# Fortune Hub

`fortune-hub` 是一个围绕微信小程序内容化测评产品搭建的 monorepo，包含小程序端、管理端、NestJS API 服务，以及本地联调和 Docker 部署基础设施。

当前仓库已经不是单纯的工程骨架，而是一个可以直接联调演示的首版原型：

- 小程序首页、个人中心、星座模块、八字解读、性格测评、情绪自检已具备第一版页面与接口
- 管理端已提供 Dashboard 演示页
- API 已接入 MySQL、Redis，并提供用户、首页、星座、八字、测评等接口
- GitHub Actions 已配置基础构建与检查流程

## Monorepo Layout

```text
apps/
├─ admin      Vue 3 + Vite + Element Plus
└─ mobile     uni-app + Vue 3 + Vite + TypeScript + Pinia

services/
└─ api        NestJS + TypeORM + MySQL + Redis

deploy/
└─ nginx      Nginx HTTPS reverse proxy config

docs/
├─ 开发文档.md
├─ 接口开发文档.md
└─ 数据库设计文档.md
```

## Current Scope

当前已经落地的首版能力：

- 首页聚合：幸运指数、幸运签、功能入口、自定义底部导航
- 用户体系：开发环境登录、资料完善、星座与简易五行生成
- 星座模块：今日、本周、年度、配对、知识卡
- 八字模块：出生信息录入、简化排盘、五行倾向、历史记录
- 性格测评：题库列表、答题流、结果报告、历史记录
- 情绪自检：两套轻量问卷、评分结果、建议、免责声明、历史记录

当前仍在规划或待实现的重点：

- 幸运物推荐、幸运签详情、幸运壁纸
- 分享海报与完整版结果分层
- VIP / 广告 / 订单商业化链路
- 管理端题库、内容、会员、广告后台 CRUD
- 内容配置化与完整数据库模型

## Tech Stack

- Package manager: `pnpm`
- Mobile: `uni-app CLI`, `Vue 3`, `TypeScript`, `Pinia`, `SCSS`
- Admin: `Vue 3`, `Vite`, `Element Plus`
- API: `NestJS`, `TypeORM`, `MySQL`, `Redis`
- Infra: `Docker Compose`, `Nginx`

## Quick Start

### 1. Install dependencies

```bash
pnpm install
```

### 2. Prepare env files

```bash
cp .env.example .env
cp apps/mobile/.env.example apps/mobile/.env
cp apps/admin/.env.example apps/admin/.env
cp services/api/.env.example services/api/.env
```

### 3. Start local development

```bash
pnpm dev:api
pnpm dev:admin
pnpm dev:mobile
```

如果你要浏览器预览小程序 H5：

```bash
pnpm dev:mobile:h5
```

## Local Development URLs

常用本地联调地址：

- Admin: `http://localhost:5173`
- Mobile H5: `http://localhost:5174`
- API health: `http://localhost:3001/api/v1/health`
- API home: `http://localhost:3001/api/v1/home/index`

微信小程序模式默认会输出到：

- `apps/mobile/dist/dev/mp-weixin`

## Available Scripts

根目录常用脚本：

```bash
pnpm dev:api
pnpm dev:admin
pnpm dev:mobile
pnpm dev:mobile:h5

pnpm build:api
pnpm build:admin
pnpm build:mobile
pnpm build

pnpm test:api
pnpm type-check:mobile

pnpm docker:up
pnpm docker:down
```

## Docker Compose

在准备好证书之后，可以用 Docker Compose 启动整套环境：

```bash
pnpm docker:up
```

证书文件路径：

- `deploy/nginx/ssl/fullchain.pem`
- `deploy/nginx/ssl/privkey.pem`

## File Service

仓库默认支持接入独立文件服务，当前通过环境变量注入：

- 根目录 `.env`
- `apps/mobile/.env`
- `apps/admin/.env`
- `services/api/.env`

默认约定：

- local dev: `http://localhost:3000/api`
- docker dev: `http://host.docker.internal:3000/api`

## Documentation

仓库内已有三份核心文档：

- [开发文档](./docs/开发文档.md)
- [接口开发文档](./docs/接口开发文档.md)
- [数据库设计文档](./docs/数据库设计文档.md)

如果要继续往下开发，建议优先看这三份文档，再对照当前代码推进。

## CI

仓库已配置基础 GitHub Actions 流程，默认会在 `push` 和 `pull_request` 时执行：

- `pnpm test:api`
- `pnpm build:api`
- `pnpm build:admin`
- `pnpm type-check:mobile`
- `pnpm build:mobile`

工作流文件位置：

- `.github/workflows/ci.yml`

## Release Plan

当前首个版本建议按 `v0.1.0` 发布，定位为：

- monorepo 初始化完成
- 三端联调可运行
- 星座、八字、性格测评、情绪自检已有首版体验
- 文档、CI、GitHub 仓库基线已建立
