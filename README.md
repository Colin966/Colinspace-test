# 简洁静态网站（Phase 3：Projects 接入数据库）

这是一个轻量级个人网站示例。第 3 阶段将 Projects 从 mock 数据切换为 SQLite 数据库读取，前端项目列表渲染逻辑保持不变。

## 本阶段完成内容

- 新增 SQLite 数据库读写模块（使用 Node.js 内置 `node:sqlite`）
- 建立 `projects` 数据表
- `GET /api/projects` 改为从数据库查询并返回
- 首页项目区改为复用独立渲染模块，便于最小自检
- 数据库为空时，前端显示“暂无项目数据”兜底提示
- 增加 `check:projects` 自检脚本（接口稳定性 + 首页项目区验证）
- 保留 `POST /api/contact-messages` 既有功能

## 文件说明

- `server.js`：HTTP 服务，`GET /api/projects` 读数据库
- `db.js`：数据库初始化、建表、查询项目数据
- `projects-view.js`：Projects 卡片与空数据提示的渲染模块
- `script.js`：前端页面交互与项目加载逻辑（调用渲染模块）
- `scripts/init-db.js`：手动初始化数据库脚本
- `scripts/projects-self-check.js`：最小自动化自检脚本
- `.gitignore`：忽略本地数据库文件
- `package.json`：提供 `start`、`db:init`、`check:projects` 命令

## 环境要求

- Node.js 22+（需支持内置 `node:sqlite` 和全局 `fetch`）

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

## 数据库版 Projects 验证步骤

### 1) 运行自动化自检（推荐）

```bash
npm run check:projects
```

该脚本会自动完成：

- 启动服务并请求两次 `GET /api/projects`
- 校验接口返回与数据库查询结果一致，确认稳定性
- 校验首页包含项目区容器与渲染模块加载
- 校验“有数据渲染卡片 / 空数据显示兜底提示”逻辑

### 2) 手动验证接口

```bash
curl http://localhost:3000/api/projects
```

预期：返回 `projects` 数组，内容来自数据库。

### 3) 手动验证首页项目区

1. 打开 `http://localhost:3000`
2. 查看“项目”区域：
   - 数据库有数据：显示项目卡片
   - 数据库为空：显示“暂时没有项目数据，请稍后再来看。”

## 其他接口测试

### 1) 测试联系表单接口（成功）

```bash
curl -X POST http://localhost:3000/api/contact-messages \
  -H "Content-Type: application/json" \
  -d '{"name":"Colin","email":"colin@example.com","message":"你好，这是测试留言。"}'
```

预期：返回 `201`，并包含 `message: "提交成功"` 与 `id`。

### 2) 测试联系表单接口（失败）

```bash
curl -X POST http://localhost:3000/api/contact-messages \
  -H "Content-Type: application/json" \
  -d '{"name":"","email":"bad-email","message":""}'
```

预期：返回 `400`，并包含中文错误信息。
