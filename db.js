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

function ensureDbDirectory() {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

function openDatabase() {
  ensureDbDirectory();
  return new DatabaseSync(DB_PATH);
}

function initializeDatabase() {
  const db = openDatabase();

  // 建表：项目主键 + 标题 + 描述
  db.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT NOT NULL
    )
  `);

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
      'INSERT INTO projects (title, description) VALUES (?, ?)'
    );

    for (const project of initialProjects) {
      insertStatement.run(project.title, project.description);
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

module.exports = {
  DB_PATH,
  DEFAULT_SITE_SETTINGS,
  initializeDatabase,
  getProjects,
  getSiteSettings,
  createContactMessage,
};
