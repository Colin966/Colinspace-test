# 简洁静态网站（Phase 6：Projects 最小管理能力）

这是一个轻量级个人网站示例。当前阶段在尽量不改动现有前端页面结构和样式的前提下，补齐了 Projects 的最小管理能力（新增 / 修改 / 删除接口），并保持原有查询接口不变。

## 本阶段完成内容

- 保持 `GET /api/projects` 不变
- 新增 `POST /api/projects`
- 新增 `PUT /api/projects/:id`
- 新增 `DELETE /api/projects/:id`
- 为 Projects 增加基础校验：
  - `title` 必填
  - `description` 最大长度 500
  - `link` 为空或必须以 `http://` / `https://` 开头
- 新接口统一返回清晰中文成功/失败信息
- 数据库 `projects` 表新增 `link` 字段，并兼容旧库自动补列

## 文件说明

- `server.js`：新增 Projects 的 POST / PUT / DELETE 路由与校验逻辑
- `db.js`：新增 Projects 的增删改方法，并补充 `link` 字段迁移逻辑
- `README.md`：更新本阶段说明与 `curl` 测试方式

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

浏览器打开：

```text
http://localhost:3000
```

## 如何用 curl 测试 Projects 接口

### 1) 查询项目列表（保持不变）

```bash
curl http://localhost:3000/api/projects
```

预期：返回 `projects` 数组。

### 2) 新增项目（POST /api/projects）

```bash
curl -X POST http://localhost:3000/api/projects \
  -H "Content-Type: application/json" \
  -d '{
    "title":"新的演示项目",
    "description":"这是一个用于演示新增接口的项目。",
    "link":"https://example.com/demo"
  }'
```

成功响应示例：

```json
{"message":"项目新增成功","id":4}
```

### 3) 修改项目（PUT /api/projects/:id）

```bash
curl -X PUT http://localhost:3000/api/projects/4 \
  -H "Content-Type: application/json" \
  -d '{
    "title":"新的演示项目（已更新）",
    "description":"这是更新后的描述。",
    "link":"https://example.com/demo-v2"
  }'
```

成功响应示例：

```json
{"message":"项目修改成功"}
```

### 4) 删除项目（DELETE /api/projects/:id）

```bash
curl -X DELETE http://localhost:3000/api/projects/4
```

成功响应示例：

```json
{"message":"项目删除成功"}
```

### 5) 参数校验失败示例

```bash
curl -X POST http://localhost:3000/api/projects \
  -H "Content-Type: application/json" \
  -d '{
    "title":"",
    "description":"描述",
    "link":"ftp://invalid-link"
  }'
```

可能返回：

```json
{"message":"项目标题为必填项"}
```

或：

```json
{"message":"项目链接格式不正确，需以 http:// 或 https:// 开头"}
```
