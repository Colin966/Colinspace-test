const http = require('http');
const fs = require('fs');
const path = require('path');
const {
  initializeDatabase,
  getProjects,
  getSiteSettings,
  updateSiteSettings,
  createContactMessage,
  getContactMessages,
  createProject,
  updateProjectById,
  deleteProjectById,
} = require('./db');

const PORT = process.env.PORT || 3000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'change-me';
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_MESSAGE_LENGTH = 500;
const MAX_PROJECT_DESCRIPTION_LENGTH = 500;
const httpLinkPattern = /^https?:\/\/[^\s]+$/i;

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

function validateProjectPayload(payload) {
  const title = typeof payload.title === 'string' ? payload.title.trim() : '';
  const description = typeof payload.description === 'string' ? payload.description.trim() : '';
  const link = typeof payload.link === 'string' ? payload.link.trim() : '';

  if (!title) {
    return { valid: false, message: '项目标题为必填项' };
  }

  if (description.length > MAX_PROJECT_DESCRIPTION_LENGTH) {
    return {
      valid: false,
      message: `项目描述不能超过 ${MAX_PROJECT_DESCRIPTION_LENGTH} 个字符`,
    };
  }

  // link 允许为空；有值时做最基础 URL 格式校验
  if (link && !httpLinkPattern.test(link)) {
    return { valid: false, message: '项目链接格式不正确，需以 http:// 或 https:// 开头' };
  }

  return {
    valid: true,
    payload: {
      title,
      description,
      link,
    },
  };
}

function validateSiteSettingsPayload(payload) {
  const heroTitle = typeof payload.heroTitle === 'string' ? payload.heroTitle.trim() : '';
  const heroSubtitle = typeof payload.heroSubtitle === 'string' ? payload.heroSubtitle.trim() : '';
  const heroButtonText =
    typeof payload.heroButtonText === 'string' ? payload.heroButtonText.trim() : '';
  const contactTitle = typeof payload.contactTitle === 'string' ? payload.contactTitle.trim() : '';
  const contactDescription =
    typeof payload.contactDescription === 'string' ? payload.contactDescription.trim() : '';
  const contactEmail = typeof payload.contactEmail === 'string' ? payload.contactEmail.trim() : '';

  if (!heroTitle || !heroSubtitle || !heroButtonText || !contactTitle || !contactDescription) {
    return { valid: false, message: '网站配置字段不能为空' };
  }

  if (!emailPattern.test(contactEmail)) {
    return { valid: false, message: '联系邮箱格式不正确' };
  }

  return {
    valid: true,
    payload: {
      heroTitle,
      // 首页仍读取 heroDescription，这里将 heroSubtitle 映射存储为 heroDescription
      heroDescription: heroSubtitle,
      heroButtonText,
      contactTitle,
      contactDescription,
      contactEmail,
      contactEmailLabel: contactEmail,
    },
  };
}

function isAdminAuthorized(req) {
  const providedPassword = req.headers['x-admin-password'];
  return typeof providedPassword === 'string' && providedPassword === ADMIN_PASSWORD;
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

  if (req.method === 'PUT' && url.pathname === '/api/site-settings') {
    if (!isAdminAuthorized(req)) {
      sendJson(res, 401, { message: '未通过管理口令验证，不能修改网站配置' });
      return;
    }

    try {
      const rawBody = await readRequestBody(req);
      const parsedBody = JSON.parse(rawBody || '{}');
      const validation = validateSiteSettingsPayload(parsedBody);

      if (!validation.valid) {
        sendJson(res, 400, { message: validation.message });
        return;
      }

      updateSiteSettings(validation.payload);
      sendJson(res, 200, { message: '网站配置修改成功' });
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

      sendJson(res, 500, { message: '网站配置修改失败，请稍后重试' });
      return;
    }
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

  // 管理口令校验接口：前端用于确认口令是否正确
  if (req.method === 'POST' && url.pathname === '/api/admin/verify') {
    try {
      const rawBody = await readRequestBody(req);
      const parsedBody = JSON.parse(rawBody || '{}');
      const password = typeof parsedBody.password === 'string' ? parsedBody.password.trim() : '';

      if (!password) {
        sendJson(res, 400, { message: '请输入管理口令' });
        return;
      }

      if (password !== ADMIN_PASSWORD) {
        sendJson(res, 401, { message: '管理口令错误' });
        return;
      }

      sendJson(res, 200, { message: '口令验证通过' });
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

      sendJson(res, 500, { message: '口令校验失败，请稍后重试' });
      return;
    }
  }

  if (req.method === 'POST' && url.pathname === '/api/projects') {
    if (!isAdminAuthorized(req)) {
      sendJson(res, 401, { message: '未通过管理口令验证，不能新增项目' });
      return;
    }

    try {
      const rawBody = await readRequestBody(req);
      const parsedBody = JSON.parse(rawBody || '{}');
      const validation = validateProjectPayload(parsedBody);

      if (!validation.valid) {
        sendJson(res, 400, { message: validation.message });
        return;
      }

      const insertedId = createProject(validation.payload);
      sendJson(res, 201, { message: '项目新增成功', id: insertedId });
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

      sendJson(res, 500, { message: '项目新增失败，请稍后重试' });
      return;
    }
  }

  if (
    (req.method === 'PUT' || req.method === 'DELETE') &&
    /^\/api\/projects\/\d+$/.test(url.pathname)
  ) {
    if (!isAdminAuthorized(req)) {
      const actionText = req.method === 'DELETE' ? '删除' : '修改';
      sendJson(res, 401, { message: `未通过管理口令验证，不能${actionText}项目` });
      return;
    }

    const projectId = Number(url.pathname.split('/').pop());
    if (!Number.isInteger(projectId) || projectId <= 0) {
      sendJson(res, 400, { message: '项目 id 不合法' });
      return;
    }

    if (req.method === 'DELETE') {
      try {
        const deletedCount = deleteProjectById(projectId);
        if (deletedCount === 0) {
          sendJson(res, 404, { message: '未找到要删除的项目' });
          return;
        }

        sendJson(res, 200, { message: '项目删除成功' });
        return;
      } catch (error) {
        sendJson(res, 500, { message: '项目删除失败，请稍后重试' });
        return;
      }
    }

    try {
      const rawBody = await readRequestBody(req);
      const parsedBody = JSON.parse(rawBody || '{}');
      const validation = validateProjectPayload(parsedBody);

      if (!validation.valid) {
        sendJson(res, 400, { message: validation.message });
        return;
      }

      const updatedCount = updateProjectById(projectId, validation.payload);
      if (updatedCount === 0) {
        sendJson(res, 404, { message: '未找到要修改的项目' });
        return;
      }

      sendJson(res, 200, { message: '项目修改成功' });
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

      sendJson(res, 500, { message: '项目修改失败，请稍后重试' });
      return;
    }
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

  // Contact 留言列表接口：仅管理口令验证通过后可查看
  if (req.method === 'GET' && url.pathname === '/api/contact-messages') {
    if (!isAdminAuthorized(req)) {
      sendJson(res, 401, { message: '未通过管理口令验证，不能查看留言列表' });
      return;
    }

    try {
      const messages = getContactMessages();
      sendJson(res, 200, { messages });
      return;
    } catch (error) {
      sendJson(res, 500, { message: '留言列表读取失败，请稍后重试' });
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
