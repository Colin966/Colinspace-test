const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;

const mockProjects = [
  {
    id: 1,
    title: '个人作品集网站',
    description:
      '面向个人品牌展示的官网，聚焦项目案例、专业能力与联系方式，兼顾视觉表达与加载性能。',
  },
  {
    id: 2,
    title: '任务管理应用',
    description:
      '以“今日重点”为核心的效率工具，支持快速记录、状态更新与清晰分组，帮助团队保持执行节奏。',
  },
  {
    id: 3,
    title: '数据分析看板',
    description:
      '围绕关键业务指标设计的信息看板，通过卡片化结构与明确层级，让决策信息一目了然。',
  },
];

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
};

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    'Content-Type': MIME_TYPES['.json'],
    'Cache-Control': 'no-store',
  });
  res.end(JSON.stringify(payload));
}

function serveStaticFile(reqPath, res) {
  const filePath = reqPath === '/' ? '/index.html' : reqPath;
  const resolvedPath = path.join(__dirname, filePath);

  if (!resolvedPath.startsWith(__dirname)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  fs.readFile(resolvedPath, (err, content) => {
    if (err) {
      res.writeHead(404);
      res.end('Not Found');
      return;
    }

    const ext = path.extname(resolvedPath);
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(content);
  });
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (req.method === 'GET' && url.pathname === '/api/projects') {
    sendJson(res, 200, { projects: mockProjects });
    return;
  }

  if (req.method === 'GET') {
    serveStaticFile(url.pathname, res);
    return;
  }

  res.writeHead(405);
  res.end('Method Not Allowed');
});

server.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Server running at http://localhost:${PORT}`);
});
