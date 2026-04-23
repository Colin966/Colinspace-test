const http = require('http');
const fs = require('fs');
const path = require('path');
const {
  initializeDatabase,
  getProjects,
  getSiteSettings,
  createContactMessage,
} = require('./db');

const PORT = process.env.PORT || 3000;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_MESSAGE_LENGTH = 500;

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

// 统一读取 POST Body，避免每个接口重复写监听逻辑
function readRequestBody(req) {
  return new Promise((resolve, reject) => {
    let rawBody = '';

    req.on('data', (chunk) => {
      rawBody += chunk;

      // 基础保护：限制请求体大小，避免异常大包
      if (rawBody.length > 1_000_000) {
        reject(new Error('PAYLOAD_TOO_LARGE'));
      }
    });

    req.on('end', () => resolve(rawBody));
    req.on('error', reject);
  });
}

function validateContactPayload(payload) {
  const name = typeof payload.name === 'string' ? payload.name.trim() : '';
  const email = typeof payload.email === 'string' ? payload.email.trim() : '';
  const message = typeof payload.message === 'string' ? payload.message.trim() : '';

  if (!name || !email || !message) {
    return { valid: false, message: 'name、email、message 都是必填项' };
  }

  if (!emailPattern.test(email)) {
    return { valid: false, message: 'email 格式不正确' };
  }

  if (message.length > MAX_MESSAGE_LENGTH) {
    return { valid: false, message: `message 不能超过 ${MAX_MESSAGE_LENGTH} 个字符` };
  }

  return { valid: true, payload: { name, email, message } };
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

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  // Site Settings 接口：返回首页最小配置
  if (req.method === 'GET' && url.pathname === '/api/site-settings') {
    try {
      const siteSettings = getSiteSettings();
      sendJson(res, 200, { siteSettings });
    } catch (error) {
      sendJson(res, 500, { message: '站点配置读取失败' });
    }

    return;
  }

  // Projects 接口：改为从数据库读取
  if (req.method === 'GET' && url.pathname === '/api/projects') {
    try {
      const projects = getProjects();
      sendJson(res, 200, { projects });
    } catch (error) {
      sendJson(res, 500, { message: '项目数据读取失败' });
    }

    return;
  }

  // Contact 接口：接收联系表单提交
  if (req.method === 'POST' && url.pathname === '/api/contact-messages') {
    try {
      const rawBody = await readRequestBody(req);
      const parsedBody = JSON.parse(rawBody || '{}');
      const validation = validateContactPayload(parsedBody);

      if (!validation.valid) {
        sendJson(res, 400, { message: validation.message });
        return;
      }

      // 写入数据库并返回新增记录 id
      const insertedId = createContactMessage(validation.payload);
      sendJson(res, 201, { message: '提交成功', id: insertedId });
      return;
    } catch (error) {
      if (error.message === 'PAYLOAD_TOO_LARGE') {
        sendJson(res, 413, { message: '请求体过大' });
        return;
      }
      if (error instanceof SyntaxError) {
        sendJson(res, 400, { message: '请求数据格式错误，需为 JSON' });
        return;
      }

      sendJson(res, 500, { message: '留言保存失败，请稍后重试' });
      return;
    }
  }

  if (req.method === 'GET') {
    serveStaticFile(url.pathname, res);
    return;
  }

  res.writeHead(405);
  res.end('Method Not Allowed');
});

// 启动前确保数据库和基础表已准备好
initializeDatabase();

server.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Server running at http://localhost:${PORT}`);
});
