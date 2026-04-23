# 简洁静态网站（Phase 9：Site Settings 最小管理能力）

这是一个轻量级个人网站示例。当前阶段在原有 Projects 管理页基础上，新增了 Site Settings 最小管理能力：管理员验证口令后，可在管理页查看并修改首页关键文案配置。

## 本阶段完成内容

- 保持 `GET /api/projects` 不变
- 保持首页 `GET /api/site-settings` 读取逻辑不变
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
- 管理页保留“留言列表”区域（只读）
- 管理页适配 iPad 触控操作（按钮更大、布局更简洁）
- 页面内新增中文成功/失败提示
- 保持代码易读，关键逻辑添加简洁中文注释

## 文件说明

- `admin.html`：Projects 管理页面结构
- `admin.js`：管理页交互逻辑（项目管理 + 网站配置管理 + 留言查看）
- `style.css`：管理页样式（简洁布局 + 触控友好按钮）
- `server.js`：API 路由与校验逻辑（含网站配置更新接口）
- `db.js`：数据持久化（含网站配置更新逻辑）

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
