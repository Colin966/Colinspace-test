const fs = require('fs');
const path = require('path');
const { DB_PATH, initializeDatabase } = require('../db');

// 备份目录单独存放，避免污染主代码目录
const BACKUP_DIR = path.join(__dirname, '..', 'backups');

function formatTimestamp(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  return `${year}${month}${day}-${hours}${minutes}${seconds}`;
}

function ensureBackupDirectory() {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

function backupDatabase() {
  // 若数据库不存在，先初始化一份最小数据库再备份
  if (!fs.existsSync(DB_PATH)) {
    initializeDatabase();
  }

  ensureBackupDirectory();

  const backupFileName = `portfolio-${formatTimestamp(new Date())}.sqlite`;
  const backupPath = path.join(BACKUP_DIR, backupFileName);

  fs.copyFileSync(DB_PATH, backupPath);

  // eslint-disable-next-line no-console
  console.log(`数据库备份完成：${backupPath}`);
}

backupDatabase();
