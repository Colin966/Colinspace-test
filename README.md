# 简洁静态网站（Phase 2：Contact 表单化）

这是一个轻量级个人网站示例。第 2 阶段新增了 Contact 联系表单与提交接口，保留现有页面布局和视觉风格。

## 本阶段完成内容

- 新增最小后端服务（Node.js 原生 `http`）
- 提供 `GET /api/projects` 接口
- 新增 `POST /api/contact-messages` 接口
- Contact 区改为 `name`、`email`、`message` 表单
- 前后端都加入基础校验（必填、邮箱格式、留言长度限制）
- 首页通过接口加载项目卡片
- 表单提交后显示中文成功/失败提示
- 保持原有深色模式与页面布局不变

## 文件说明

- `index.html`：页面结构（Contact 区改为表单）
- `style.css`：样式（在不破坏原布局前提下新增表单样式）
- `script.js`：前端交互、项目接口请求、表单校验与提交逻辑
- `server.js`：本地 HTTP 服务，包含 `GET /api/projects` 与 `POST /api/contact-messages`

## 运行方式

### 1) 环境要求

- Node.js 18+（建议）

### 2) 启动项目

在项目根目录执行：

```bash
node server.js
```

看到以下日志表示启动成功：

```text
Server running at http://localhost:3000
```

### 3) 访问页面

浏览器打开：

```text
http://localhost:3000
```

## 测试步骤

### A. 项目接口测试

```bash
curl http://localhost:3000/api/projects
```

预期：返回 JSON，且包含 `projects` 数组。

### B. 联系表单接口测试（成功）

```bash
curl -X POST http://localhost:3000/api/contact-messages \
  -H "Content-Type: application/json" \
  -d '{"name":"Colin","email":"colin@example.com","message":"你好，这是测试留言。"}'
```

预期：返回 `201`，并包含 `message: "提交成功"` 与 `id`。

### C. 联系表单接口测试（失败）

```bash
curl -X POST http://localhost:3000/api/contact-messages \
  -H "Content-Type: application/json" \
  -d '{"name":"","email":"bad-email","message":""}'
```

预期：返回 `400`，并包含中文错误信息。

### D. 页面功能测试

1. 打开首页后，Projects 区域先显示“项目加载中...”。
2. 请求成功后，显示项目卡片列表。
3. 在 Contact 表单填写 `name`、`email`、`message` 并提交：
   - 合法输入：显示“提交成功，感谢你的留言！”
   - 非法输入：显示对应中文失败提示
4. 打开浏览器开发者工具的 Network 面板，确认：
   - `GET /api/projects` 状态为 `200`
   - `POST /api/contact-messages` 状态为 `201`（成功）或 `400`（校验失败）

### E. 失败兜底测试（可选）

1. 先停止 `node server.js`。
2. 刷新页面。
3. Projects 区域应显示中文提示：“项目加载失败，请稍后重试。”
4. 提交 Contact 表单时应显示中文提示：“提交失败，请稍后重试。”
