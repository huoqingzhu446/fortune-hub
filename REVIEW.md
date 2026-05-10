# Fortune Hub 项目审查报告

> 审查日期：2025-07-17
> 项目版本：v0.1.0
> 审查范围：全栈（apps/admin、apps/mobile、services/api、deploy、docs）

---

## 一、项目概览

**Fortune Hub** 是一个围绕"运势内容 + 轻测评 + 用户成长 + 后台运营"的多端产品，基于 pnpm monorepo 组织。当前版本定位为可演示的首版原型，尚未形成完整商业化闭环。

| 端 | 技术栈 | 代码路径 | 当前状态 |
|---|---|---|---|
| 移动端（小程序/H5） | uni-app + Vue 3 + TypeScript + Pinia + SCSS | `apps/mobile` | ✅ 功能较完整 |
| 管理端 | Vue 3 + Vite + Element Plus + Pinia | `apps/admin` | ⚠️ 骨架可用，CRUD 不完整 |
| API 后端 | NestJS + TypeORM + MySQL + Redis + sharp | `services/api` | ✅ 功能较完整 |
| 部署 | Docker Compose + Nginx | `deploy/` + `docker-compose.yml` | ✅ 可部署 |

---

## 二、架构评价

### ✅ 优点

1. **Monorepo 布局清晰**：`pnpm-workspace.yaml` 合理隔离 `apps/*` 和 `services/*`，子包命名规范（`@fortune-hub/*`）。

2. **API 模块化组织良好**：`app.module.ts` 中每个业务领域（auth / bazi / zodiac / assessment / users / orders / posters …）拆为独立 NestJS 模块，职责边界清楚。

3. **前端数据流清晰**：
   - 移动端使用 Pinia store + fallback 机制，Dashboard 加载失败时优雅降级，不会白屏。
   - 管理端使用 Axios 拦截器 + Pinia store。

4. **测试覆盖率不错**：API 有 13 个 spec 测试文件，覆盖核心服务层（home、auth、bazi、posters、orders、favorites、emotion-assessment、poster-renderer 等）。

5. **Docker 部署完整**：6 个容器服务（mysql / redis / api / admin / mobile-h5 / nginx），Nginx 反向代理配置完整（HTTP→HTTPS 重定向 + H2 + SSL 挂载 + 路由分发）。

6. **运维文档全面**：`docs/` 下有 5 份中文文档（开发、排期、部署、接口、数据库设计）。

7. **技术亮点**：
   - **sharp 海报渲染**（`poster-renderer.service.ts`，~3000 行）：纯服务端海报生成，支持星座/八字/情绪/幸运签等多种模板。
   - **Bazi 引擎**（`bazi-engine.ts`，~646 行）：基于 `lunar-typescript` 的四柱排盘算法，版本 v1.2.0。
   - **星座常量化**（`zodiac.constants.ts`）：12 星座完整画像（性格、幸运色、元素等），数据驱动。

---

## 三、问题清单

### 🔴 阻塞性问题（上线前必须修复）

#### 3.1 管理员凭据硬编码在 3 个位置

| 位置 | 内容 |
|---|---|
| `apps/admin/src/views/LoginView.vue` | 登录表单默认值 `admin / fortune123` |
| `services/api/src/admin-auth/admin-auth.service.ts:78` | 后端回退密码 `fortune123` |
| `docker-compose.yml` | MySQL `MYSQL_PASSWORD=fortune123` |

**影响**：任何一个部署环境未通过环境变量覆盖，攻击者即可用弱密码直接登录超级管理员后台。

**修复建议**：
- 移除前端和后端的所有硬编码默认值
- 在 Dockerfile 或启动脚本中加入强制检查：若 `ADMIN_PASSWORD` 仍为默认值则拒绝启动

#### 3.2 订单支付回调无签名验证

`services/api/src/orders/orders.service.ts` 的 `handlePayCallback()` 接受 `dto.status` + `dto.transactionNo` 即可将订单标记为已支付，没有任何签名验证、来源 IP 校验或 OAuth 令牌验证。

**影响**：任何知道订单号的用户都可以把自己标记为已付款。

**修复建议**：
- 接入微信/支付宝支付回调的官方签名验证流程
- 添加 IP 白名单或共享密钥校验
- 订单状态变更记录审计日志

#### 3.3 Docker 构建不锁定依赖 (`--frozen-lockfile=false`)

三个 Dockerfile 均使用 `--frozen-lockfile=false`：

| 文件 | 行号 |
|---|---|
| `services/api/Dockerfile` | 8 |
| `apps/admin/Dockerfile` | 11 |
| `apps/mobile/Dockerfile` | 9 |

**影响**：每次构建可能拉取不同的传递依赖版本，构建不可复现，存在供应链攻击风险。

**修复建议**：改为 `--frozen-lockfile=true`，确保 `pnpm-lock.yaml` 保持最新。

#### 3.4 SMS 模拟模式可能在生产环境启用

`.env.example` 中 `SMS_MOCK_ENABLED=false`、`SMS_MOCK_CODE=123456`，但如果生产 `.env` 无意中设置 `SMS_MOCK_ENABLED=true`，攻击者可用固定验证码 `123456` 登录任意手机号。

**修复建议**：
- 在生产环境的 `main.ts` 启动时检查：若 `NODE_ENV=production` 且 `SMS_MOCK_ENABLED=true`，直接拒绝启动
- 将模拟验证码的默认值改为空，必须显式配置

#### 3.5 数据库弱默认密码

`docker-compose.yml` 中 `MYSQL_ROOT_PASSWORD: root123456`、`MYSQL_PASSWORD: fortune123` 作为默认值，同样硬编码在 `services/api/src/database/data-source.ts:35`。

**修复建议**：移除所有默认值，强制通过环境变量注入。

---

### 🟠 中等问题

#### 3.6 `synchronize: true` 在非生产环境默认启用

`services/api/src/app.module.ts:120-122`：

```typescript
synchronize: configService.get<string>('DB_SYNCHRONIZE')
  ? configService.get<string>('DB_SYNCHRONIZE') === 'true'
  : configService.get<string>('NODE_ENV') !== 'production',
```

**影响**：开发环境或 staging 若连到共享数据库，TypeORM 自动同步可能意外删列或改约束。TypeORM 的 `synchronize` 不具备迁移的安全保障。

**修复建议**：
- 关闭默认的 `synchronize`，始终使用 migration
- 在 `DB_SYNCHRONIZE=true` 时打印醒目警告日志

#### 3.7 Redis 惰性连接存在竞态条件

`services/api/src/redis/redis.service.ts:10-14`：

```typescript
private async ensureConnected() {
  if (this.redis.status === 'wait') {
    await this.redis.connect();
  }
}
```

**问题**：只检查 `wait` 状态，不处理 `connecting`、`disconnecting`、`close` 等状态。连接在操作中途断开后静默失败（`get` 返回 `null`，`set`/`del` 返回 `false`），不会触发重连。

**修复建议**：在 `RedisModule` 中使用 ioredis 内置的 `retryStrategy`，移除自定义的 `ensureConnected`。

#### 3.8 手机号登录无 IP 级别速率限制

`/auth/phone/login` 端点没有全局速率限制，攻击者可对同一验证码在不同 IP 间重放尝试。

**修复建议**：使用 `@nestjs/throttler` 或 Redis 计数器实现 IP 级别的速率限制。

#### 3.9 部署脚本将 SSL 私钥复制到版本控制目录

`scripts/deploy-aliyun.sh:63-68` — SSL 私钥被复制到 `deploy/nginx/ssl/`。虽然 `.gitignore` 已排除 `*.pem` 和 `*.key`，但仍有意外提交风险。

**修复建议**：将 SSL 证书目录移到仓库外的独立路径（如 `/etc/ssl/fortune-hub/`），不在仓库内管理私钥。

#### 3.10 `autoLoadEntities: true` 与显式 `entities[]` 数组冲突

`services/api/src/app.module.ts` 中同时设置了 `autoLoadEntities: true`（第 106 行）和显式的 `entities` 数组（第 70-104 行）。两者同时存在会产生不确定行为。

**修复建议**：保留 `entities` 显式数组并移除 `autoLoadEntities: true`，或反之。

#### 3.11 ER_DUP_ENTRY 重试逻辑无事务包裹

`services/api/src/auth/auth.service.ts:246-270` — `persistUser()` 在遇到 `ER_DUP_ENTRY` 后通过 `findOne` + `save` 重试，但未在数据库事务中包裹。两个并发请求可能在插入阶段都失败后同时进入重试路径，导致重复记录。

**修复建议**：使用 `INSERT ... ON DUPLICATE KEY UPDATE` 或 TypeORM 的 `.upsert()` 方法替代手写的重试逻辑。

#### 3.12 管理面板会话 12 小时固定过期

`services/api/src/admin-auth/admin-auth.service.ts:15`：

```typescript
const ADMIN_SESSION_TTL_SECONDS = 60 * 60 * 12;
```

会话在 12 小时后不可刷新地过期，管理员将被强制登出。

**修复建议**：使用滑动过期策略（每次请求刷新 TTL），或提供 refresh token 机制。

---

### 🔵 优化建议

#### 3.13 Docker 服务缺少健康检查

`docker-compose.yml` 中的 mysql、redis、api 服务均未定义 `healthcheck`。`depends_on` 仅等待容器启动，而非等待服务就绪。API 可能在数据库尚未接受连接时即启动。

**修复建议**：

```yaml
mysql:
  healthcheck:
    test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
    interval: 5s
    timeout: 5s
    retries: 10

redis:
  healthcheck:
    test: ["CMD", "redis-cli", "ping"]
    interval: 5s
    timeout: 5s
    retries: 5

api:
  depends_on:
    mysql:
      condition: service_healthy
    redis:
      condition: service_healthy
```

#### 3.14 Nginx HTTP (80) 端口仍有短暂代理窗口

`deploy/nginx/conf.d/default.conf:1-5` — 第一个 `server` 块监听 80 端口返回 301 重定向，但若 nginx 热重载，API/管理面板在重定向之前仍然短暂可通过 HTTP 访问。

**修复建议**：80 端口的 `server` 块仅做 `return 301`，不包含任何 `proxy_pass`。

#### 3.15 海报尺寸不统一

当前存在 **5 种不同的分享海报尺寸**：

| 渲染系统 | 尺寸 | 来源类型 |
|---|---|---|
| 服务端 sharp+SVG | 1280×1280 | 默认 fallback（lucky_sign 等） |
| 服务端 sharp+SVG | 1088×1472 | today_index |
| 服务端 sharp+SVG | 941×1672 | bazi、zodiac_today、emotion |
| 服务端 sharp+SVG | 1080×1440 | 可通过 dto.size 传入 |
| 移动端 Canvas | 750×1334 | divination、bazi 客户端渲染 |

**核心问题**：
- `buildSharePosterSvg`（`poster-renderer.service.ts:691`）硬编码了 1280×1280，不接受 layout 参数
- `buildRichPosterSvg` 内部坐标按 1088×1472 设计
- 移动端 Canvas 渲染与服务端完全独立，尺寸不统一
- 前端 API 调用方在 `apps/mobile/src/api/posters.ts` 中硬编码了不同尺寸

**修复建议**：统一所有分享海报为 941×1672（约 9:16 竖版比例），详见[海报尺寸统一方案](#六海报尺寸统一方案)。

#### 3.16 缺少 GitHub Actions CI 配置

`README.md` 提到 `.github/workflows/ci.yml`，但该文件不存在。CI 未就绪。

**修复建议**：创建 CI 工作流，至少覆盖：
- `pnpm test:api`
- `pnpm build:api`
- `pnpm build:admin`
- `pnpm type-check:mobile`

#### 3.17 文件 URL 工具将外部域名作为内部基准 URL 回退

`services/api/src/common/file-url.util.ts:88-90` — `isInternalFileServiceUrl` 检查 URL 来源是否与 `internalBaseUrl` 的来源匹配，但默认值指向外部域名 `www.yuanlian.xin`，可能破坏 SSRF 防护意图。

**修复建议**：将默认值改为空字符串，强制通过环境变量 `FILE_SERVICE_BASE_URL` 配置。

#### 3.18 多处硬编码外部域名

`www.yuanlian.xin` 散落在多份配置文件中：
- `docker-compose.yml`：`FILE_SERVICE_BASE_URL`
- `services/api/src/health/health.controller.ts:16`：健康检查返回的默认值
- `services/api/src/fortune/fortune.service.ts:19-22`：Dashboard 默认值

**修复建议**：全部通过环境变量注入，不提供默认具体域名。

#### 3.19 移动端冗余文件

`apps/mobile/src/` 下同时存在 `shims-uni.d.ts` 和 `shime-uni.d.ts`（疑似 typo 副本），后者应被清理。

#### 3.20 通知工作线程使用 `console.warn` 而非 NestJS Logger

`services/api/src/notifications/notifications.service.ts:47` — 使用 `console.warn` 而非 NestJS 的结构化 Logger。在日志聚合系统中会丢失日志级别、上下文和可搜索性。

#### 3.21 `common/config/` 目录为空

`services/api/src/common/config/` 存在但为空，或为遗留文件或为未实现功能。

#### 3.22 管理端功能薄弱

管理端目前只有 5 个页面（Dashboard / QuestionBank / ContentCenter / CommerceCenter / Operations），其中 Dashboard 为演示数据。题库管理、内容配置、会员管理等功能的 CRUD 交互尚不完整。

#### 3.23 API 响应格式不统一

部分 controller 返回 `{ code: 0, message: 'ok', data, timestamp }` 包装格式，部分则直接抛出 NestJS HTTP 异常（404 / 400 / 401）。前端需兼容两种范式。

**修复建议**：使用 NestJS 全局异常过滤器（`ExceptionFilter`）+ 拦截器（`Interceptor`）统一包装所有响应。

---

## 四、安全风险总览

| 风险 | 严重度 | 利用难度 | 影响 |
|---|---|---|---|
| 管理员弱默认密码 | 🔴 严重 | 极低 | 管理后台完全接管 |
| 支付回调无签名验证 | 🔴 严重 | 低 | 免费获取所有付费内容 |
| SMS 模拟模式可生产启用 | 🔴 严重 | 低 | 任意手机号登录 |
| 数据库弱默认密码 | 🔴 严重 | 低（需网络可达） | 数据泄露/篡改 |
| 手机号登录无 IP 限速 | 🟠 中等 | 低 | 验证码暴力破解 |
| SSL 私钥在仓库目录 | 🟠 中等 | 极低 | 私钥泄露 |
| 管理员会话无滑动过期 | 🔵 低 | N/A | 用户体验问题 |

---

## 五、测试覆盖

| 文件 | 覆盖模块 |
|---|---|
| `auth.service.spec.ts` | 认证服务 |
| `users.service.preferences.spec.ts` | 用户偏好设置 |
| `home.service.spec.ts` | 首页聚合 |
| `bazi.service.spec.ts` | 八字解读 |
| `emotion-assessment.service.spec.ts` | 情绪测评 |
| `posters.service.spec.ts` | 海报生成 |
| `poster-renderer.service.spec.ts` | 海报渲染引擎 |
| `reports.service.spec.ts` | 报告服务 |
| `favorites.service.spec.ts` | 收藏服务 |
| `orders.service.spec.ts` | 订单服务 |
| `health.controller.spec.ts` | 健康检查 |
| `zhipu-image.service.spec.ts` | 智谱图像生成 |
| `file-url.util.spec.ts` | 文件 URL 工具 |

**缺失**：Controller 层的 e2e 测试（项目已有 `test/` 目录和 `jest-e2e.json` 配置但无实际测试）。

---

## 六、海报尺寸统一方案

### 当前问题

| 海报类型 | 渲染引擎 | 当前尺寸 |
|---|---|---|
| 默认 / lucky_sign | sharp + SVG (`buildSharePosterSvg`) | 1280×1280 |
| today_index | sharp + SVG (`buildRichPosterSvg`) | 1088×1472 |
| bazi | sharp + SVG (`buildBaziPosterSvg`) | 941×1672 |
| zodiac_today | sharp + PNG 模板 (`renderZodiacTemplatePoster`) | 941×1672 |
| emotion | sharp + SVG (`buildEmotionAssessmentPosterSvg`) | 941×1672 |
| 占卜（移动端） | WeChat Canvas | 750×1334 |
| 八字（移动端） | WeChat Canvas | 750×1334 |

### 关键代码问题

1. **`buildSharePosterSvg`（第 691 行）不接受 `layout` 参数**，硬编码 `width="1280" height="1280"`
2. **`buildRichPosterSvg`（第 749 行）内部 SVG 坐标按 1088×1472 设计**，改为 941×1672 后所有绝对坐标会偏移
3. **移动端 `generateTodayIndexPosterAsync` 和 `generateZodiacTodayPosterAsync` 硬编码了不同 size**

### 推荐方案：统一为 941×1672

**步骤**：

1. **`poster-renderer.service.ts`**：
   - 修改 `PosterLayout.size` 类型为 `'941x1672'`
   - 简化 `resolvePosterLayout()` → 始终返回 941×1672
   - 为 `buildSharePosterSvg()` 添加 `layout` 参数，改为竖版布局
   - 将 `buildRichPosterSvg()` 内部坐标改为 941×1672 基准（或引入 scale 因子）

2. **`generate-poster.dto.ts`**：移除或废弃 `size` 字段

3. **`apps/mobile/src/api/posters.ts`**：移除硬编码的 `size` 参数

4. **`apps/mobile/src/services/divination-poster.ts`** + **`bazi-share-poster.ts`**：输出尺寸从 750×1334 改为 941×1672

---

## 七、修复优先级建议

### 第一阶段（上线前必须）

1. 移除所有硬编码的默认凭据（管理员、数据库、SMS mock）
2. 修复订单支付回调签名验证
3. Docker 构建改为 `--frozen-lockfile=true`
4. 关闭生产环境的 `DB_SYNCHRONIZE`
5. 添加 Redis 连接池和重连策略

### 第二阶段（上线前应做）

6. 手机号登录添加 IP 级别速率限制
7. SSL 私钥移出仓库目录
8. 修复 `autoLoadEntities` + `entities[]` 冲突
9. 创建 GitHub Actions CI 工作流
10. Docker 服务添加 healthcheck

### 第三阶段（上线后迭代）

11. 统一海报尺寸为 941×1672
12. 统一 API 响应格式（ExceptionFilter + Interceptor）
13. 补充 Controller e2e 测试
14. 完善管理端 CRUD 交互
15. 清理空目录和冗余文件

---

## 八、总体评价

| 维度 | 评分 | 说明 |
|---|---|---|
| 架构设计 | ⭐⭐⭐⭐ | NestJS 模块化清晰，monorepo 布局合理 |
| 代码质量 | ⭐⭐⭐ | 核心模块质量好，边缘 cases 处理不足 |
| 安全性 | ⭐⭐ | 多处硬编码凭据，支付验证缺失 |
| 测试覆盖 | ⭐⭐⭐ | 13 个 spec 覆盖核心服务，缺 e2e |
| 部署就绪 | ⭐⭐⭐ | Docker 部署完整，但缺少健康检查 |
| 文档 | ⭐⭐⭐⭐ | 5 份中文文档全面 |

**结论**：项目架构质量好，可演示性高。但存在多个安全阻塞问题（硬编码凭据、支付无验证、SMS mock），**当前版本不具备生产上线条件**。建议按第七节优先级顺序修复后再部署。
