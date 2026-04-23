# 静态页面后端化改造分析（阶段 1）

## 结论（优先级）

> 最适合优先改造成可连接后端的模块：**项目列表** 和 **联系表单**。

1. **项目列表（最高优先级）**
   - 当前是硬编码在 `index.html` 中的三张卡片。
   - 这是典型的可结构化内容（标题、简介、标签、封面、链接、排序、是否置顶）。
   - 后端化后可以支持：后台增删改查、按标签筛选、排序、草稿/发布状态。

2. **联系模块（高优先级）**
   - 当前只有邮箱和外链。
   - 改造为表单 + 后端接口后，可做：线索收集、自动回复、反垃圾、消息状态流转（未读/已回复）。

3. **首页 Hero 文案（中优先级）**
   - 当前标题、副标题、引导语固定写死。
   - 后端化后可做：A/B 文案实验、多语言、节日活动文案、运营可配置。

4. **导航与页脚配置（中低优先级）**
   - 当前导航和邮箱是固定值。
   - 若后续有多站点/多语言，再考虑做成 CMS 配置项。

5. **主题模式（低优先级）**
   - 目前仅本地 `localStorage`，对单设备体验足够。
   - 只有在你引入“用户登录”后，才需要把主题偏好同步到后端。

---

## 逐块改造建议（按“收益/复杂度”）

### A. 项目列表：静态卡片 → 动态数据渲染

**当前状态**
- 项目卡片写死在 HTML，更新要改代码并发版。

**建议目标结构**
- 前端通过 `GET /api/projects` 拉取项目数组。
- 后端返回统一字段，前端循环渲染卡片。

**建议字段**
- `id`
- `title`
- `summary`
- `coverImage`
- `projectUrl`
- `repoUrl`
- `tags`（数组）
- `featured`（是否置顶）
- `publishedAt`
- `status`（draft/published）
- `sortOrder`

**数据库建议（示例）**
- `projects` 表：
  - `id` (PK)
  - `title`
  - `slug`
  - `summary`
  - `content_md`（后续扩展项目详情）
  - `cover_image`
  - `project_url`
  - `repo_url`
  - `featured`
  - `status`
  - `sort_order`
  - `published_at`
  - `created_at`
  - `updated_at`

---

### B. 联系模块：联系方式展示 → 留资系统

**当前状态**
- 用户只能点击邮箱，没有“提交后确认”与线索管理能力。

**建议目标结构**
- 增加联系表单（姓名、邮箱、需求描述）。
- 提交到 `POST /api/contact-messages`。
- 后端做参数校验、频率限制、反垃圾，入库并可通知邮件。

**建议字段（消息表）**
- `id`
- `name`
- `email`
- `company`（可选）
- `message`
- `sourcePage`
- `status`（new/processing/replied/spam）
- `createdAt`

---

### C. Hero 文案：固定文案 → 配置化内容

**建议接口**
- `GET /api/site-settings`

**建议字段**
- `heroEyebrow`
- `heroTitle`
- `heroDescription`
- `ctaText`
- `contactEmail`
- `socialLinks`

这样可以在不改代码的情况下更新首页文案。

---

## 最小可行后端（MVP）建议

### 第 1 期（建议先做）
1. `projects`：读接口（公开）
2. `contact_messages`：写接口（公开）
3. 管理端先不做 UI，用数据库工具或简单脚本维护数据

### 第 2 期
1. 增加后台登录（管理员）
2. 项目增删改查 API
3. 联系消息状态管理 API

### 第 3 期
1. 接入 CMS（可选：自建或 Headless CMS）
2. 多语言内容管理
3. 分析埋点与转化看板

---

## 技术实现建议（与你当前项目匹配）

- 前端保留现有结构，逐步把“写死内容”替换为“接口数据渲染”。
- 后端可选：
  - Node.js + Express/Fastify + PostgreSQL（上手快，生态成熟）
  - 或 Next.js（前后端一体）+ Prisma + PostgreSQL（统一工程）
- 若希望快速上线：
  - 数据库：Supabase PostgreSQL
  - 文件存储：Supabase Storage / S3
  - 邮件通知：Resend / SendGrid

---

## 推荐你下一步就做的 3 件事

1. 先落数据库表：`projects`、`contact_messages`。
2. 先写两个接口：`GET /api/projects`、`POST /api/contact-messages`。
3. 前端先只改“项目列表”为动态渲染；跑通后再上联系表单。

这条路线改动小、见效快，且不会破坏你现有静态页面体验。
