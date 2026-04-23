const { initializeDatabase, DB_PATH } = require('../db');

initializeDatabase();

// eslint-disable-next-line no-console
console.log(`数据库初始化完成：${DB_PATH}`);
