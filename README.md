# 简洁静态网站（Phase 1：Projects 动态化）

一个轻量级的个人网站示例，现已支持通过 API 动态渲染首页 Projects 列表。

## 文件说明

- `index.html`：页面结构
- `style.css`：样式
- `script.js`：前端交互与项目列表请求/渲染
- `server.js`：本地 HTTP 服务与 `GET /api/projects` 接口（当前返回假数据）

## 运行方式

1. 确保本机安装 Node.js（建议 18+）。
2. 在项目根目录启动服务：

```bash
node server.js
```

3. 浏览器打开：

```text
http://localhost:3000
```

## 测试方式

### 1) 接口测试

```bash
curl http://localhost:3000/api/projects
```

预期返回 JSON，包含 `projects` 数组。

### 2) 页面测试

- 打开首页后，Projects 区域会从 `/api/projects` 拉取数据并渲染卡片。
- 可在浏览器开发者工具 Network 面板确认 `GET /api/projects` 请求状态为 `200`。

