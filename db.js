const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');

// 数据库文件放在 db 目录，方便管理
const DB_DIR = path.join(__dirname, 'db');
const DB_PATH = path.join(DB_DIR, 'portfolio.sqlite');

const initialProjects = [
  {
    title: '个人作品集网站',
    description:
      '面向个人品牌展示的官网，聚焦项目案例、专业能力与联系方式，兼顾视觉表达与加载性能。',
  },
  {
    title: '任务管理应用',
    description:
      '以“今日重点”为核心的效率工具，支持快速记录、状态更新与清晰分组，帮助团队保持执行节奏。',
  },
  {
    title: '数据分析看板',
    description:
      '围绕关键业务指标设计的信息看板，通过卡片化结构与明确层级，让决策信息一目了然。',
  },
];

// 站点配置默认值：当数据库缺少配置或接口失败时都可复用
const DEFAULT_SITE_SETTINGS = {
  heroEyebrow: '产品设计与前端实践',
  heroTitle: '用清晰的体验，把复杂问题做简单',
  heroDescription:
    '我专注于构建高质量网页与产品原型，强调可读性、响应速度与可维护性，让每一次迭代都更高效。',
  heroButtonText: '开始了解',
  heroMessage: '欢迎来到我的作品集，向下查看项目案例。',
  contactTitle: '联系',
  contactDescription:
    '如果你有合作想法、项目需求或交流计划，欢迎随时发来消息，我会尽快回复。',
  contactEmail: 'hello@example.com',
  contactEmailLabel: 'hello@example.com',
};

// 管理页允许修改的最小配置键（首页读取逻辑保持不变）
const EDITABLE_SITE_SETTING_KEYS = [
  'heroTitle',
  'heroDescription',
  'heroButtonText',
  'contactTitle',
  'contactDescription',
  'contactEmail',
  'contactEmailLabel',
];

function ensureDbDirectory() {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

function openDatabase() {
  ensureDbDirectory();
  return new DatabaseSync(DB_PATH);
}

function checkDatabaseHealth() {
  const db = openDatabase();

  try {
    // 最小健康检查：执行一条轻量查询确认数据库可读
    db.prepare('SELECT 1 AS ok').get();
    return { ok: true, dbPath: DB_PATH };
  } catch (error) {
    return {
      ok: false,
      dbPath: DB_PATH,
      message: error instanceof Error ? error.message : '数据库检查失败',
    };
  } finally {
    db.close();
  }
}

function initializeDatabase() {
  const db = openDatabase();

  // 建表：项目主键 + 标题 + 描述
  db.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      link TEXT
    )
  `);

  // 兼容旧库：如果历史 projects 表没有 link 字段，则补充该字段
  const projectColumns = db.prepare('PRAGMA table_info(projects)').all();
  const hasLinkColumn = projectColumns.some((column) => column.name === 'link');
  if (!hasLinkColumn) {
    db.exec('ALTER TABLE projects ADD COLUMN link TEXT');
  }

  // 建表：联系留言，保留最基础字段与提交时间
  db.exec(`
    CREATE TABLE IF NOT EXISTS contact_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      message TEXT NOT NULL,
      created_at TEXT NOT NULL
    )
  `);

  // 建表：网站最小配置，采用 key-value 结构便于后续扩展
  db.exec(`
    CREATE TABLE IF NOT EXISTS site_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )
  `);

  const projectCountRow = db.prepare('SELECT COUNT(*) AS count FROM projects').get();

  // 首次初始化时写入最少量示例数据，保证前端可展示
  if (projectCountRow.count === 0) {
    const insertStatement = db.prepare(
      'INSERT INTO projects (title, description, link) VALUES (?, ?, ?)'
    );

    for (const project of initialProjects) {
      insertStatement.run(project.title, project.description, null);
    }
  }

  // 首次初始化时写入站点默认配置，若已存在则不覆盖
  const insertSiteSetting = db.prepare(
    'INSERT OR IGNORE INTO site_settings (key, value) VALUES (?, ?)'
  );
  for (const [key, value] of Object.entries(DEFAULT_SITE_SETTINGS)) {
    insertSiteSetting.run(key, value);
  }

  db.close();
}

function getProjects() {
  const db = openDatabase();
  const rows = db
    .prepare(
      `SELECT id, title, description
              , link
       FROM projects
       ORDER BY id ASC`
    )
    .all();
  db.close();

  return rows;
}

function getSiteSettings() {
  const db = openDatabase();
  const rows = db
    .prepare(
      `SELECT key, value
       FROM site_settings`
    )
    .all();
  db.close();

  const settings = { ...DEFAULT_SITE_SETTINGS };

  for (const row of rows) {
    // 只合并字符串类型，避免异常值影响页面
    if (typeof row.key === 'string' && typeof row.value === 'string' && row.key in settings) {
      settings[row.key] = row.value;
    }
  }

  return settings;
}

function updateSiteSettings(payload) {
  const db = openDatabase();
  const insertOrUpdateStatement = db.prepare(
    `INSERT INTO site_settings (key, value)
     VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`
  );

  for (const key of EDITABLE_SITE_SETTING_KEYS) {
    if (typeof payload[key] === 'string') {
      insertOrUpdateStatement.run(key, payload[key]);
    }
  }

  db.close();
}

function createContactMessage(payload) {
  const db = openDatabase();
  const insertStatement = db.prepare(
    `INSERT INTO contact_messages (name, email, message, created_at)
     VALUES (?, ?, ?, ?)`
  );
  const createdAt = new Date().toISOString();
  const result = insertStatement.run(payload.name, payload.email, payload.message, createdAt);
  db.close();

  // sqlite 的 lastInsertRowid 是新增记录 id
  return Number(result.lastInsertRowid);
}

function getContactMessages() {
  const db = openDatabase();
  const rows = db
    .prepare(
      `SELECT id, name, email, message, created_at
       FROM contact_messages
       ORDER BY created_at DESC, id DESC`
    )
    .all();
  db.close();

  return rows;
}

function createProject(payload) {
  const db = openDatabase();
  const insertStatement = db.prepare(
    `INSERT INTO projects (title, description, link)
     VALUES (?, ?, ?)`
  );
  const result = insertStatement.run(payload.title, payload.description, payload.link || null);
  db.close();

  return Number(result.lastInsertRowid);
}

function updateProjectById(id, payload) {
  const db = openDatabase();
  const updateStatement = db.prepare(
    `UPDATE projects
     SET title = ?, description = ?, link = ?
     WHERE id = ?`
  );
  const result = updateStatement.run(payload.title, payload.description, payload.link || null, id);
  db.close();

  return Number(result.changes || 0);
}

function deleteProjectById(id) {
  const db = openDatabase();
  const deleteStatement = db.prepare('DELETE FROM projects WHERE id = ?');
  const result = deleteStatement.run(id);
  db.close();

  return Number(result.changes || 0);
}

module.exports = {
  DB_PATH,
  DEFAULT_SITE_SETTINGS,
  EDITABLE_SITE_SETTING_KEYS,
  checkDatabaseHealth,
  initializeDatabase,
  getProjects,
  getSiteSettings,
  updateSiteSettings,
  createContactMessage,
  getContactMessages,
  createProject,
  updateProjectById,
  deleteProjectById,
};
