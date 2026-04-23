const fs = require('fs');
const path = require('path');
const { DB_PATH } = require('../db');

// 默认从 backups 目录恢复，支持命令行指定文件名
const BACKUP_DIR = path.join(__dirname, '..', 'backups');

function getBackupFiles() {
  if (!fs.existsSync(BACKUP_DIR)) {
    return [];
  }

  return fs
    .readdirSync(BACKUP_DIR)
    .filter((fileName) => fileName.endsWith('.sqlite'))
    .sort();
}

function resolveBackupPath() {
  const inputFileName = process.argv[2];

  if (inputFileName) {
    const directPath = path.isAbsolute(inputFileName)
      ? inputFileName
      : path.join(BACKUP_DIR, inputFileName);

    if (!fs.existsSync(directPath)) {
      throw new Error(`未找到指定备份文件：${directPath}`);
    }

    return directPath;
  }

  const backupFiles = getBackupFiles();

  if (backupFiles.length === 0) {
    throw new Error('backups 目录中没有可用的 .sqlite 备份文件');
  }

  // 文件名按时间戳命名，排序后最后一个即最新备份
  const latestBackupFileName = backupFiles[backupFiles.length - 1];
  return path.join(BACKUP_DIR, latestBackupFileName);
}

function ensureDbDirectory() {
  const dbDir = path.dirname(DB_PATH);
  fs.mkdirSync(dbDir, { recursive: true });
}

function restoreDatabase() {
  const backupPath = resolveBackupPath();
  ensureDbDirectory();

  fs.copyFileSync(backupPath, DB_PATH);

  // eslint-disable-next-line no-console
  console.log(`数据库恢复完成：${backupPath} -> ${DB_PATH}`);
}

try {
  restoreDatabase();
} catch (error) {
  // eslint-disable-next-line no-console
  console.error(`数据库恢复失败：${error.message}`);
  process.exit(1);
}
