# 简洁静态网站（Phase 10：新增最小健康检查能力）

这是一个轻量级个人网站示例。当前阶段在原有 Projects 管理页基础上，新增了最小健康检查能力：可通过接口和管理页查看服务与数据库状态。

## 本阶段完成内容

- 保持 `GET /api/projects` 不变
- 保持首页 `GET /api/site-settings` 读取逻辑不变
- 新增 `GET /api/health` 健康检查接口，返回：
  - 服务状态（`serviceStatus`）
  - 数据库状态（`databaseStatus`）
  - 数据库文件路径（`databaseFilePath`）
  - 服务器当前时间（`serverTime`）
- 新增 `PUT /api/site-settings`（仅管理员口令通过后可访问）
- 管理页新增“网站配置”区域，可编辑以下字段：
  - `heroTitle`
  - `heroSubtitle`（服务端映射保存到 `heroDescription`，兼容现有首页读取）
  - `heroButtonText`
  - `contactTitle`
  - `contactDescription`
  - `contactEmail`
- 新增 `GET /api/contact-messages`（仅管理员口令通过后可访问）
- 留言按提交时间倒序返回（最近提交的在最前）
- 使用已有接口实现管理页面 CRUD：
  - `POST /api/projects`
  - `PUT /api/projects/:id`
  - `DELETE /api/projects/:id`
- 新增管理页：`/admin.html`
- 管理页新增“网站配置”区域
- 管理页新增“系统状态”区域，可查看服务状态、数据库状态、数据库文件路径与服务器时间
- 管理页保留“留言列表”区域（只读）
- 管理页适配 iPad 触控操作（按钮更大、布局更简洁）
- 页面内新增中文成功/失败提示
- 保持代码易读，关键逻辑添加简洁中文注释

## 文件说明

- `admin.html`：Projects 管理页面结构
- `admin.js`：管理页交互逻辑（项目管理 + 网站配置管理 + 留言查看 + 健康检查展示）
- `style.css`：管理页样式（简洁布局 + 触控友好按钮）
- `server.js`：API 路由与校验逻辑（含网站配置更新接口与健康检查接口）
- `db.js`：数据持久化（含网站配置更新逻辑与数据库健康检查）

## 环境要求

- Node.js 22+（需支持内置 `node:sqlite` 和全局 `fetch`）

## 如何初始化数据库

在项目根目录执行：

```bash
npm run db:init
```

## 如何运行项目

```bash
npm start
```

看到以下日志表示启动成功：

```text
Server running at http://localhost:3000
```

## 最小发布方案（iPad 场景）

下面给出一套保持当前技术栈不变、适合新手的最小发布思路：

1. **前端文件（静态资源）**
   - 文件包括：`index.html`、`admin.html`、`style.css`、`script.js`、`admin.js`、`projects-view.js`
   - 这些文件由当前 Node.js 服务直接静态托管，无需单独打包。

2. **后端服务（Node.js）**
   - 后端入口是 `server.js`，负责 API 与静态文件服务。
   - 发布时只需要安装依赖（本项目依赖极少）并运行 `npm start`。

3. **SQLite 数据文件**
   - 数据库文件路径：`db/portfolio.sqlite`。
   - 这个文件就是核心数据，发布或迁移时要重点保留。

### iPad 使用建议（最小可行）

- **推荐方式**：将服务部署在一台常开设备（云主机/家用小主机）上，iPad 仅通过浏览器访问。
- iPad 访问首页：`http://你的服务地址:3000/`
- iPad 访问管理页：`http://你的服务地址:3000/admin.html`
- 如果需要外网访问，请只开放必要端口，并务必设置 `ADMIN_PASSWORD`。

### 最小部署步骤

1. 在服务器上放置项目代码。
2. 执行数据库初始化（首次）：

```bash
npm run db:init
```

3. 启动服务：

```bash
ADMIN_PASSWORD=your-password npm start
```

4. 使用 iPad Safari 打开管理页并验证操作。

## 数据备份与恢复（本次新增）

为了避免误操作导致数据丢失，项目新增了最小脚本化备份能力。

### 备份目录约定

- 备份统一存放在：`backups/`
- 单个备份文件命名示例：`portfolio-20260423-120000.sqlite`
- 这样可以避免把备份文件散落在根目录，保持主代码目录整洁。

### 一键备份

```bash
npm run db:backup
```

执行后会把 `db/portfolio.sqlite` 复制到 `backups/`。

### 一键恢复（默认恢复最新备份）

```bash
npm run db:restore
```

执行后会自动选择 `backups/` 里最新的 `.sqlite` 文件恢复到 `db/portfolio.sqlite`。

### 按指定文件恢复

```bash
node scripts/db-restore.js portfolio-20260423-120000.sqlite
```

也可传入绝对路径进行恢复。

### 备份/恢复注意事项

- 恢复会**覆盖当前数据库**，建议先执行一次 `npm run db:backup` 再恢复。
- 为避免文件锁冲突，建议在恢复前先停止服务。
- 建议把 `backups/` 目录再同步到网盘/对象存储，形成异地备份。

## Projects 管理口令保护（最小实现）

本项目为 `/admin.html` 增加了一个**最小口令保护**：

- 进入管理页后，默认是“仅可查看”状态
- 未通过口令验证时，不能新增、编辑、删除
- 通过验证后，才允许调用写接口（`POST / PUT / DELETE /api/projects`）
- 不引入复杂登录系统，仅使用一个管理口令

### 如何配置口令

服务端通过环境变量 `ADMIN_PASSWORD` 读取口令。

> 如果不设置，默认值是 `change-me`（建议你在本地开发时改成自己的值）。

示例（macOS / Linux）：

```bash
ADMIN_PASSWORD=your-password npm start
```

示例（Windows PowerShell）：

```powershell
$env:ADMIN_PASSWORD="your-password"; npm start
```

## 如何进入管理页

1. 先启动项目：`npm start`
2. 浏览器访问：

```text
http://localhost:3000/admin.html
```

## 如何在管理页测试增删改查

1. **查看项目列表**：打开管理页后会自动请求 `GET /api/projects` 并展示当前项目。
2. **新增项目**：填写“项目标题 / 项目描述 / 项目链接”，点击“保存”，应看到“项目新增成功”。
3. **编辑项目**：点击某条项目的“编辑”，修改后点击“保存”，应看到“项目修改成功”。
4. **删除项目**：点击某条项目的“删除”，确认后应看到“项目删除成功”。
5. **失败提示测试**：新增时将“项目标题”留空并提交，页面会显示中文错误提示。

## 如何测试网站配置修改功能（本阶段新增）

1. 启动服务并设置口令，例如：`ADMIN_PASSWORD=abc123 npm start`
2. 打开管理页：`http://localhost:3000/admin.html`
3. 未验证时，“网站配置”表单按钮应显示“请先验证口令”，且输入框不可编辑
4. 输入正确口令（如 `abc123`）并验证成功后：
   - “网站配置”区域可编辑
   - 会自动加载当前配置
5. 修改以下任意字段并点击“保存网站配置”：
   - `heroTitle`
   - `heroSubtitle`
   - `heroButtonText`
   - `contactTitle`
   - `contactDescription`
   - `contactEmail`
6. 页面应显示成功提示：`网站配置修改成功`
7. 打开首页 `http://localhost:3000/` 并刷新，应看到新文案立即生效
8. 可输入错误邮箱测试失败提示，应看到：`联系邮箱格式不正确`

## 如何测试健康检查功能（本阶段新增）

1. 启动服务：`npm start`
2. 打开管理页：`http://localhost:3000/admin.html`
3. 在“系统状态”区域观察：
   - 服务状态应显示“正常”
   - 数据库状态应显示“可用”
   - 数据库文件路径应显示类似：`/workspace/Colinspace-test/db/portfolio.sqlite`
   - 服务器时间应显示当前时间
4. 点击“刷新系统状态”按钮，确认状态可再次拉取
5. 可用 curl 直接验证接口：

```bash
curl http://localhost:3000/api/health
```

期望返回示例：

```json
{
  "serviceStatus": "ok",
  "databaseStatus": "ok",
  "databaseFilePath": "/workspace/Colinspace-test/db/portfolio.sqlite",
  "serverTime": "2026-04-23T12:00:00.000Z"
}
```

## 如何测试留言查看功能

1. 启动服务并设置口令，例如：`ADMIN_PASSWORD=abc123 npm start`
2. 先在首页提交 1~2 条联系留言（`http://localhost:3000/` 底部 Contact 表单）
3. 打开管理页：`http://localhost:3000/admin.html`
4. 未验证口令时，“留言列表”区域应显示：`请先完成口令验证后查看留言列表。`
5. 输入错误口令并验证，应看到口令错误提示，留言仍不可查看
6. 输入正确口令（如 `abc123`）并验证：
   - 留言区域先显示“留言加载中...”
   - 成功后展示留言列表，字段包含：姓名、邮箱、留言内容、提交时间
   - 列表顺序应为最新提交在最前
7. 若当前没有留言，页面应显示：`暂无留言。`
8. 点击“退出验证”后，应恢复只读提示，不再显示留言内容

## 如何测试口令保护

1. 启动服务时设置口令，例如：`ADMIN_PASSWORD=abc123 npm start`
2. 打开 `http://localhost:3000/admin.html`
3. 不输入口令时，页面应显示“当前状态：未验证（仅可查看）”，且新增/编辑/删除不可用
4. 输入错误口令，页面应显示“管理口令错误”
5. 输入正确口令（如 `abc123`）后，应显示“口令验证成功，现在可以管理项目”
6. 此时可继续测试新增、编辑、删除是否正常
7. 点击“退出验证”后，应回到“仅可查看”状态

## 如何测试 404 与统一错误处理（本阶段新增）

本阶段对页面与 API 的异常返回做了统一收敛，下面给出最小验证步骤。

### 1) 测试不存在页面的 404（中文友好提示）

1. 启动服务：`npm start`
2. 浏览器打开：`http://localhost:3000/not-exists-page`
3. 预期：
   - HTTP 状态码为 `404`
   - 页面显示中文提示（如“页面不存在”）
   - 不出现 Node.js 错误堆栈

### 2) 测试不存在接口的 404（统一 JSON 结构）

执行：

```bash
curl -i http://localhost:3000/api/not-exists
```

预期响应类似：

```json
{
  "success": false,
  "error": {
    "code": "API_NOT_FOUND",
    "message": "未找到接口：GET /api/not-exists"
  },
  "message": "未找到接口：GET /api/not-exists"
}
```

### 3) 测试 API 异常返回格式（以 JSON 解析失败为例）

执行：

```bash
curl -i -X POST http://localhost:3000/api/contact-messages \
  -H "Content-Type: application/json" \
  -d "{bad-json}"
```

预期：

- HTTP 状态码为 `400`
- 响应体为统一 JSON 错误结构，`error.code` 为 `INVALID_JSON`
- 前端可继续读取 `message` 字段展示中文文案

### 4) 测试页面异常时的友好提示

可通过临时制造静态文件读取异常（例如将文件权限改为不可读）来验证，预期：

- 返回中文错误页面（状态码 `500`）
- 页面不暴露内部异常详情与堆栈

## 可选：用 curl 验证接口

### 1) 查询项目列表

```bash
curl http://localhost:3000/api/projects
```

### 1.1) 查询留言列表（需要口令）

```bash
curl http://localhost:3000/api/contact-messages \
  -H "X-Admin-Password: abc123"
```

### 1.2) 修改网站配置（需要口令）

```bash
curl -X PUT http://localhost:3000/api/site-settings \
  -H "Content-Type: application/json" \
  -H "X-Admin-Password: abc123" \
  -d '{
    "heroTitle":"新的首页标题",
    "heroSubtitle":"新的首页副标题",
    "heroButtonText":"立即查看",
    "contactTitle":"联系我",
    "contactDescription":"欢迎通过邮箱发送合作需求。",
    "contactEmail":"hello@example.com"
  }'
```

### 1.3) 查询健康检查接口

```bash
curl http://localhost:3000/api/health
```

### 2) 新增项目

```bash
curl -X POST http://localhost:3000/api/projects \
  -H "Content-Type: application/json" \
  -H "X-Admin-Password: abc123" \
  -d '{
    "title":"新的演示项目",
    "description":"这是一个用于演示新增接口的项目。",
    "link":"https://example.com/demo"
  }'
```

### 3) 修改项目

```bash
curl -X PUT http://localhost:3000/api/projects/4 \
  -H "Content-Type: application/json" \
  -H "X-Admin-Password: abc123" \
  -d '{
    "title":"新的演示项目（已更新）",
    "description":"这是更新后的描述。",
    "link":"https://example.com/demo-v2"
  }'
```

### 4) 删除项目

```bash
curl -X DELETE http://localhost:3000/api/projects/4 \
  -H "X-Admin-Password: abc123"
```
