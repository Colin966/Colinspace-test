# 简洁静态网站（Phase 5：最小配置化 Site Settings）

这是一个轻量级个人网站示例。当前阶段在保留原有页面布局、样式和交互的前提下，新增了“最小配置化能力”：首页 Hero 文案和 Contact 展示信息改为通过接口读取。

## 本阶段完成内容

- 新增 `site_settings` 数据表（Key-Value 结构）
- 新增 `GET /api/site-settings` 接口
- 首页 Hero 文案改为从接口读取
- Contact 展示文案与 Footer 邮箱改为从接口读取
- 前后端均提供默认值与中文兜底内容（接口异常或缺字段也可正常展示）
- 保留原有页面布局、样式与主题切换、表单交互逻辑
- 新增 `check:site-settings` 自检脚本

## 文件说明

- `server.js`：HTTP 服务，新增 `GET /api/site-settings`
- `db.js`：数据库初始化、建表、站点配置读写默认逻辑
- `script.js`：前端加载并应用站点配置（含兜底）
- `index.html`：为可配置文案增加 DOM 标识（id）
- `scripts/init-db.js`：手动初始化数据库脚本
- `scripts/projects-self-check.js`：Projects 接口与页面渲染自检
- `scripts/site-settings-self-check.js`：Site Settings 接口自检
- `package.json`：新增 `check:site-settings` 命令

## 环境要求

- Node.js 22+（需支持内置 `node:sqlite` 和全局 `fetch`）

## 如何初始化配置数据

在项目根目录执行：

```bash
npm run db:init
```

预期输出类似：

```text
数据库初始化完成：/workspace/Colinspace-test/db/portfolio.sqlite
```

初始化会自动做两件事：

1. 建立 `site_settings` 表
2. 当配置为空时写入默认中文配置（不会覆盖已有配置）

### 可选：手动修改配置示例

```bash
node -e "const { DatabaseSync } = require('node:sqlite'); const db = new DatabaseSync('./db/portfolio.sqlite'); db.prepare('UPDATE site_settings SET value = ? WHERE key = ?').run('你好，欢迎来到我的网站', 'heroTitle'); db.close(); console.log('配置更新完成');"
```

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

## 如何测试接口

### 1) 测试 Site Settings 接口（手动）

```bash
curl http://localhost:3000/api/site-settings
```

预期：返回 `siteSettings` 对象，包含 Hero 与 Contact 的配置字段。

### 2) 测试 Site Settings 接口（自动化）

```bash
npm run check:site-settings
```

该脚本会校验：

- `GET /api/site-settings` 返回 200
- 返回值与数据库读取一致
- 所有默认配置字段都是非空字符串

### 3) 测试 Projects 接口（自动化）

```bash
npm run check:projects
```

## 现有 Contact 留言接口验证

### 成功请求

```bash
curl -X POST http://localhost:3000/api/contact-messages \
  -H "Content-Type: application/json" \
  -d '{"name":"Colin","email":"colin@example.com","message":"你好，这是测试留言。"}'
```

### 失败请求

```bash
curl -X POST http://localhost:3000/api/contact-messages \
  -H "Content-Type: application/json" \
  -d '{"name":"","email":"bad-email","message":""}'
```
