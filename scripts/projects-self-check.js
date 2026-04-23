const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const { initializeDatabase, getProjects } = require('../db');
const { buildProjectsView } = require('../projects-view');

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

async function fetchJson(url) {
  const response = await fetch(url);
  const json = await response.json();
  return { response, json };
}

async function run() {
  initializeDatabase();

  const expectedProjects = getProjects().map((project) => ({ ...project }));
  const serverProcess = spawn('node', ['server.js'], {
    cwd: process.cwd(),
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  serverProcess.stderr.on('data', (chunk) => {
    process.stderr.write(chunk.toString());
  });

  try {
    await waitForServerReady(serverProcess);

    const first = await fetchJson(`${BASE_URL}/api/projects`);
    assert.equal(first.response.status, 200, 'GET /api/projects 应返回 200');
    assert.deepEqual(first.json.projects, expectedProjects, '接口应稳定返回数据库项目数据');

    const second = await fetchJson(`${BASE_URL}/api/projects`);
    assert.equal(second.response.status, 200, '重复请求 GET /api/projects 应返回 200');
    assert.deepEqual(second.json.projects, expectedProjects, '重复请求返回应与数据库一致');

    const homepageResponse = await fetch(`${BASE_URL}/`);
    const homepageHtml = await homepageResponse.text();
    assert.equal(homepageResponse.status, 200, 'GET / 应返回 200');
    assert.match(homepageHtml, /id="projects"/, '首页应包含项目区容器');
    assert.match(homepageHtml, /projects-view\.js/, '首页应加载项目渲染模块');

    if (expectedProjects.length === 0) {
      const fallback = buildProjectsView([]);
      assert.equal(fallback.cardsMarkup, '', '数据库为空时不渲染项目卡片');
      assert.match(fallback.statusText, /暂时没有项目数据/, '数据库为空时应显示兜底提示');
    } else {
      const rendered = buildProjectsView(expectedProjects);
      assert.equal(rendered.statusText, '', '有项目数据时不显示兜底提示');
      assert.match(rendered.cardsMarkup, new RegExp(expectedProjects[0].title), '项目区应渲染数据库项目标题');
    }

    console.log('Projects 数据接口与首页项目区渲染自检通过。');
  } finally {
    serverProcess.kill('SIGTERM');
  }
}

run().catch((error) => {
  console.error('Projects 自检失败：', error.message);
  process.exitCode = 1;
});
