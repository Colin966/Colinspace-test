const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const { initializeDatabase, getSiteSettings, DEFAULT_SITE_SETTINGS } = require('../db');

const BASE_URL = 'http://127.0.0.1:3000';

function waitForServerReady(serverProcess) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('服务器启动超时'));
    }, 10_000);

    function onData(chunk) {
      const output = chunk.toString();
      if (output.includes('Server running at')) {
        clearTimeout(timeout);
        serverProcess.stdout.off('data', onData);
        resolve();
      }
    }

    serverProcess.stdout.on('data', onData);
    serverProcess.once('error', reject);
    serverProcess.once('exit', (code) => {
      reject(new Error(`服务器提前退出，code=${code}`));
    });
  });
}

async function run() {
  initializeDatabase();

  const expected = getSiteSettings();
  const serverProcess = spawn('node', ['server.js'], {
    cwd: process.cwd(),
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  serverProcess.stderr.on('data', (chunk) => {
    process.stderr.write(chunk.toString());
  });

  try {
    await waitForServerReady(serverProcess);

    const response = await fetch(`${BASE_URL}/api/site-settings`);
    const json = await response.json();

    assert.equal(response.status, 200, 'GET /api/site-settings 应返回 200');
    assert.deepEqual(json.siteSettings, expected, '接口应返回数据库配置结果');

    for (const key of Object.keys(DEFAULT_SITE_SETTINGS)) {
      assert.equal(typeof json.siteSettings[key], 'string', `${key} 应是字符串`);
      assert.notEqual(json.siteSettings[key].trim(), '', `${key} 不能为空字符串`);
    }

    console.log('Site Settings 接口自检通过。');
  } finally {
    serverProcess.kill('SIGTERM');
  }
}

run().catch((error) => {
  console.error('Site Settings 自检失败：', error.message);
  process.exitCode = 1;
});
