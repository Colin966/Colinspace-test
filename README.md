# 简洁静态网站（Phase 7：Projects 最小管理页面）

这是一个轻量级个人网站示例。当前阶段新增了一个原生 HTML/CSS/JS 的 Projects 管理页，支持查看、新增、编辑、删除项目，直接调用现有后端接口。

## 本阶段完成内容

- 保持 `GET /api/projects` 不变
- 使用已有接口实现管理页面 CRUD：
  - `POST /api/projects`
  - `PUT /api/projects/:id`
  - `DELETE /api/projects/:id`
- 新增管理页：`/admin.html`
- 管理页适配 iPad 触控操作（按钮更大、布局更简洁）
- 页面内新增中文成功/失败提示
- 保持代码易读，关键逻辑添加简洁中文注释

## 文件说明

- `admin.html`：Projects 管理页面结构
- `admin.js`：管理页交互逻辑（加载、增删改、提示）
- `style.css`：管理页样式（简洁布局 + 触控友好按钮）
- `server.js`：Projects API 路由与校验逻辑（已在上一阶段完成）
- `db.js`：Projects 数据持久化（已在上一阶段完成）

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

## 可选：用 curl 验证接口

### 1) 查询项目列表

```bash
curl http://localhost:3000/api/projects
```

### 2) 新增项目

```bash
curl -X POST http://localhost:3000/api/projects \
  -H "Content-Type: application/json" \
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
  -d '{
    "title":"新的演示项目（已更新）",
    "description":"这是更新后的描述。",
    "link":"https://example.com/demo-v2"
  }'
```

### 4) 删除项目

```bash
curl -X DELETE http://localhost:3000/api/projects/4
```
