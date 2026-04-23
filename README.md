# 简洁静态网站（Phase 1：Projects 动态化）

这是一个轻量级个人网站示例。第 1 阶段已完成：首页 Projects 列表改为通过后端接口动态获取并渲染。

## 本阶段完成内容

- 新增最小后端服务（Node.js 原生 `http`）
- 提供 `GET /api/projects` 接口
- 接口先返回 mock 数据（不接数据库）
- 首页通过接口加载项目卡片
- 前端加载失败时显示中文兜底提示
- 保持原有深色模式与页面布局不变

## 文件说明

- `index.html`：页面结构（首页 Projects 区域预留加载状态）
- `style.css`：样式（含深色模式）
- `script.js`：前端交互、接口请求与项目渲染
- `server.js`：本地 HTTP 服务与 `GET /api/projects` 接口（返回 mock 数据）

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

### A. 接口测试

```bash
curl http://localhost:3000/api/projects
```

预期：返回 JSON，且包含 `projects` 数组。

### B. 页面功能测试

1. 打开首页后，Projects 区域先显示“项目加载中...”。
2. 请求成功后，显示项目卡片列表。
3. 打开浏览器开发者工具的 Network 面板，确认 `GET /api/projects` 状态为 `200`。

### C. 失败兜底测试（可选）

1. 先停止 `node server.js`。
2. 刷新页面。
3. Projects 区域应显示中文提示：“项目加载失败，请稍后重试。”
