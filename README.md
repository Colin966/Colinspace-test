# Colinspace 小型全栈项目（发布前收尾版）

这是一个面向新手的轻量全栈示例：
- 前端：原生 HTML/CSS/JS
- 后端：Node.js 原生 `http`
- 数据库：SQLite（`node:sqlite`）
- 管理页：同站点内 `admin.html`

本次 README 已按当前代码能力做一致性收敛，并补齐发布前与日常维护说明。

---

## 1. 当前功能总览（与代码一致）

### 首页（`/`）
- 展示 Hero 区文案（从 `GET /api/site-settings` 读取）
- 展示项目列表（从 `GET /api/projects` 读取）
- 支持联系表单提交（`POST /api/contact-messages`）
- 支持浅色/深色模式切换（本地 `localStorage`）

### 管理页（`/admin.html`）
- 管理口令验证（`POST /api/admin/verify`）
- 项目管理（新增/编辑/删除）
  - `POST /api/projects`
  - `PUT /api/projects/:id`
  - `DELETE /api/projects/:id`
- 网站配置管理（`PUT /api/site-settings`）
  - 可编辑字段：`heroTitle`、`heroSubtitle`、`heroButtonText`、`contactTitle`、`contactDescription`、`contactEmail`
  - 服务端会将 `heroSubtitle` 映射保存为 `heroDescription`，保持首页读取逻辑不变
- 留言只读查看（`GET /api/contact-messages`，需口令）
- 系统状态查看（`GET /api/health`）

### API 与通用能力
- 统一 JSON 错误结构：`success=false + error.code + message`
- 非法 JSON、超大请求体、鉴权失败等均有明确错误码与中文提示
- 统一请求日志（最小必要信息）：时间、方法、路径、状态码、耗时
- 异常日志不记录敏感信息（例如口令、完整留言内容）
- 页面 404/500 采用中文友好页面

### 数据库与运维脚本
- 自动初始化数据库与基础表（服务启动时执行）
- 备份：`npm run db:backup`（备份到 `backups/`）
- 恢复：`npm run db:restore`（默认恢复最新备份）
- 自检：
  - `npm run check:projects`
  - `npm run check:site-settings`

---

## 2. 环境要求

- Node.js 22+

---

## 3. 本地启动

```bash
npm run db:init
npm start
```

启动成功后访问：
- 首页：`http://localhost:3000/`
- 管理页：`http://localhost:3000/admin.html`

如需启用自定义管理口令：

```bash
ADMIN_PASSWORD=your-password npm start
```

> 若未设置，默认口令是 `change-me`（仅用于开发环境，不建议上线使用）。

---

## 4. API 清单（当前实现）

### 公开接口
- `GET /api/projects`
- `GET /api/site-settings`
- `POST /api/contact-messages`
- `GET /api/health`

### 需管理口令（请求头 `X-Admin-Password`）
- `POST /api/admin/verify`
- `POST /api/projects`
- `PUT /api/projects/:id`
- `DELETE /api/projects/:id`
- `PUT /api/site-settings`
- `GET /api/contact-messages`

---

## 5. 数据目录与备份

- 主库文件：`db/portfolio.sqlite`
- 备份目录：`backups/`

```bash
npm run db:backup
npm run db:restore
```

> 恢复会覆盖当前数据库，建议先执行一次备份再恢复。

---

## 6. 当前项目目录说明（最终版）

```text
.
├─ admin.html                      # 管理页结构
├─ admin.js                        # 管理页逻辑：口令、项目CRUD、配置、留言、健康检查
├─ index.html                      # 首页结构
├─ script.js                       # 首页逻辑：配置读取、项目渲染、联系表单、主题切换
├─ projects-view.js                # 首页项目卡片渲染模块
├─ style.css                       # 首页 + 管理页样式
├─ server.js                       # Node HTTP 服务、API、静态资源、日志、统一错误处理
├─ db.js                           # SQLite 访问层、建表、默认数据、增删改查
├─ ecosystem.config.js             # PM2 运行配置
├─ package.json                    # 脚本与项目信息
├─ scripts/
│  ├─ init-db.js                   # 初始化数据库
│  ├─ db-backup.js                 # 备份数据库
│  ├─ db-restore.js                # 恢复数据库
│  ├─ projects-self-check.js       # 项目接口与首页项目区自检
│  └─ site-settings-self-check.js  # 站点配置接口自检
└─ docs/
   └─ backend-integration-analysis.md # 历史分析文档（已归档）
```

---

## 7. 上线前检查清单（建议逐项勾选）

### 基础与安全
- [ ] 已设置生产环境 `ADMIN_PASSWORD`（非默认值）
- [ ] 服务器仅开放必要端口
- [ ] 已确认数据库文件与备份目录权限正确

### 功能回归
- [ ] 首页可正常加载项目与站点配置
- [ ] 联系表单提交成功，异常输入可看到中文报错
- [ ] 管理页口令验证成功/失败流程正常
- [ ] 项目新增、编辑、删除流程正常
- [ ] 网站配置保存后首页可立即生效
- [ ] 留言列表仅在验证后可查看，顺序为最新优先
- [ ] 健康检查接口返回服务与数据库状态

### 运维与可靠性
- [ ] `npm run db:backup` 可执行且生成备份文件
- [ ] `npm run db:restore` 在测试环境验证通过
- [ ] 请求日志与错误日志可正常查看
- [ ] 不存在接口返回统一 JSON 错误结构
- [ ] 不存在页面返回中文友好 404 页面

### 自检
- [ ] `npm run check:projects` 通过
- [ ] `npm run check:site-settings` 通过

---

## 8. 日常维护清单

### 每日/每次改动后
- [ ] 看一眼服务启动日志，确认无异常
- [ ] 随机访问首页和管理页关键路径
- [ ] 检查当天请求日志是否有大量 4xx/5xx

### 每周
- [ ] 至少执行一次数据库备份并确认文件可读
- [ ] 抽查最近留言是否可在管理页查看
- [ ] 抽查健康检查接口返回是否正常

### 每月
- [ ] 做一次“备份恢复演练”（在测试环境）
- [ ] 轮换管理口令
- [ ] 清理过旧日志文件，避免占满磁盘

---

## 9. PM2（可选）

```bash
npm run pm2:start
npm run pm2:restart
npm run pm2:stop
npm run pm2:logs
npm run pm2:save
```

适合长期运行，避免进程意外退出后需手工拉起。
