# 简洁静态网站（Phase 3：Projects 接入数据库）

这是一个轻量级个人网站示例。第 3 阶段将 Projects 从 mock 数据切换为 SQLite 数据库读取，前端项目列表渲染逻辑保持不变。

## 本阶段完成内容

- 新增 SQLite 数据库读写模块（使用 Node.js 内置 `node:sqlite`）
- 建立 `projects` 数据表
- `GET /api/projects` 改为从数据库查询并返回
- 保留前端 `loadProjects -> renderProjects` 的原有逻辑
- 提供最少量初始化项目数据，保证页面可直接显示
- 保留 `POST /api/contact-messages` 既有功能

## 文件说明

- `server.js`：HTTP 服务，`GET /api/projects` 已改为读数据库
- `db.js`：数据库初始化、建表、查询项目数据
- `scripts/init-db.js`：手动初始化数据库脚本
- `script.js`：前端项目加载与渲染逻辑（无需改动）
- `.gitignore`：忽略本地数据库文件
- `package.json`：提供 `start` 与 `db:init` 命令

## 环境要求

- Node.js 22+（需支持内置 `node:sqlite`）

## 如何初始化数据库

在项目根目录执行：

```bash
npm run db:init
```

预期输出类似：

```text
数据库初始化完成：/workspace/Colinspace-test/db/portfolio.sqlite
```

> 说明：`server.js` 启动时也会自动调用初始化逻辑；手动执行 `db:init` 适合首次安装后显式准备数据。

## 如何运行项目

```bash
npm start
```

看到以下日志表示启动成功：

```text
Server running at http://localhost:3000
```

浏览器打开：

```text
http://localhost:3000
```

## 接口测试

### 1) 测试项目列表接口（数据库读取）

```bash
curl http://localhost:3000/api/projects
```

预期：返回 JSON，且包含 `projects` 数组（来自数据库）。

### 2) 测试联系表单接口（成功）

```bash
curl -X POST http://localhost:3000/api/contact-messages \
  -H "Content-Type: application/json" \
  -d '{"name":"Colin","email":"colin@example.com","message":"你好，这是测试留言。"}'
```

预期：返回 `201`，并包含 `message: "提交成功"` 与 `id`。

### 3) 测试联系表单接口（失败）

```bash
curl -X POST http://localhost:3000/api/contact-messages \
  -H "Content-Type: application/json" \
  -d '{"name":"","email":"bad-email","message":""}'
```

预期：返回 `400`，并包含中文错误信息。
