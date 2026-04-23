const { buildProjectsView } = window.ProjectsView;

const button = document.getElementById('btn');
const message = document.getElementById('message');
const themeToggle = document.getElementById('theme-toggle');
const projectsContainer = document.getElementById('projects');
const projectsStatus = document.getElementById('projects-status');
const contactForm = document.getElementById('contact-form');
const contactFeedback = document.getElementById('contact-feedback');

const heroEyebrow = document.getElementById('hero-eyebrow');
const heroTitle = document.getElementById('hero-title');
const heroDescription = document.getElementById('hero-description');
const contactTitle = document.getElementById('contact-title');
const contactDescription = document.getElementById('contact-description');
const contactEmailLink = document.getElementById('contact-email-link');

// 前端兜底：接口失败或缺字段时使用，确保页面仍是中文可读内容
const defaultSiteSettings = {
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

let currentSiteSettings = { ...defaultSiteSettings };

function sanitizeSetting(value, fallback) {
  if (typeof value !== 'string') {
    return fallback;
  }

  const trimmed = value.trim();
  return trimmed || fallback;
}

function applySiteSettings(siteSettings) {
  currentSiteSettings = {
    ...defaultSiteSettings,
    ...siteSettings,
  };

  heroEyebrow.textContent = sanitizeSetting(
    currentSiteSettings.heroEyebrow,
    defaultSiteSettings.heroEyebrow
  );
  heroTitle.textContent = sanitizeSetting(currentSiteSettings.heroTitle, defaultSiteSettings.heroTitle);
  heroDescription.textContent = sanitizeSetting(
    currentSiteSettings.heroDescription,
    defaultSiteSettings.heroDescription
  );
  button.textContent = sanitizeSetting(
    currentSiteSettings.heroButtonText,
    defaultSiteSettings.heroButtonText
  );

  contactTitle.textContent = sanitizeSetting(
    currentSiteSettings.contactTitle,
    defaultSiteSettings.contactTitle
  );
  contactDescription.textContent = sanitizeSetting(
    currentSiteSettings.contactDescription,
    defaultSiteSettings.contactDescription
  );

  const safeEmail = sanitizeSetting(
    currentSiteSettings.contactEmail,
    defaultSiteSettings.contactEmail
  );
  const safeEmailLabel = sanitizeSetting(
    currentSiteSettings.contactEmailLabel,
    defaultSiteSettings.contactEmailLabel
  );
  contactEmailLink.href = `mailto:${safeEmail}`;
  contactEmailLink.textContent = safeEmailLabel;
}

async function loadSiteSettings() {
  try {
    const response = await fetch('/api/site-settings');

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    const siteSettings =
      data && typeof data.siteSettings === 'object' && data.siteSettings !== null
        ? data.siteSettings
        : {};

    applySiteSettings(siteSettings);
  } catch (error) {
    // 配置接口失败时也保证页面稳定展示
    applySiteSettings(defaultSiteSettings);
  }
}

// 首页引导按钮文案
button.addEventListener('click', () => {
  message.textContent = sanitizeSetting(
    currentSiteSettings.heroMessage,
    defaultSiteSettings.heroMessage
  );
});

function renderProjects(projects) {
  const { cardsMarkup, statusText } = buildProjectsView(projects);

  // 每次渲染前清理旧卡片，保留项目区结构不变
  projectsContainer.querySelectorAll('.project-card').forEach((card) => card.remove());

  projectsStatus.textContent = statusText;

  if (cardsMarkup) {
    projectsContainer.insertAdjacentHTML('beforeend', cardsMarkup);
  }
}

async function loadProjects() {
  try {
    const response = await fetch('/api/projects');

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    const projects = Array.isArray(data.projects) ? data.projects : [];
    renderProjects(projects);
  } catch (error) {
    // 前端加载失败时兜底提示
    projectsStatus.textContent = '项目加载失败，请稍后重试。';
  }
}

loadSiteSettings();
loadProjects();

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_MESSAGE_LENGTH = 500;

// 基础表单校验：必填、邮箱格式、留言长度
function validateContactForm(formData) {
  const name = formData.get('name')?.trim() || '';
  const email = formData.get('email')?.trim() || '';
  const messageText = formData.get('message')?.trim() || '';

  if (!name || !email || !messageText) {
    return { valid: false, message: '请完整填写 name、email 和 message。' };
  }

  if (!emailPattern.test(email)) {
    return { valid: false, message: '邮箱格式不正确，请检查后再提交。' };
  }

  if (messageText.length > MAX_MESSAGE_LENGTH) {
    return { valid: false, message: `留言不能超过 ${MAX_MESSAGE_LENGTH} 个字符。` };
  }

  return {
    valid: true,
    payload: { name, email, message: messageText },
  };
}

function showContactFeedback(messageText, type) {
  contactFeedback.textContent = messageText;
  contactFeedback.classList.remove('success', 'error');
  contactFeedback.classList.add(type);
}

async function parseApiResponse(response) {
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || '请求失败');
  }
  return data;
}

// 提交联系表单到后端接口
contactForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  showContactFeedback('', 'success');

  const formData = new FormData(contactForm);
  const validation = validateContactForm(formData);

  if (!validation.valid) {
    showContactFeedback(validation.message, 'error');
    return;
  }

  try {
    const response = await fetch('/api/contact-messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(validation.payload),
    });
    await parseApiResponse(response);

    contactForm.reset();
    showContactFeedback('提交成功，感谢你的留言！', 'success');
  } catch (error) {
    showContactFeedback(error.message || '提交失败，请稍后重试。', 'error');
  }
});

// 读取并恢复用户的主题偏好
const savedTheme = localStorage.getItem('theme');

if (savedTheme === 'dark') {
  document.body.classList.add('dark-mode');
  themeToggle.textContent = '浅色模式';
  themeToggle.setAttribute('aria-pressed', 'true');
}

// 切换主题并持久化状态
themeToggle.addEventListener('click', () => {
  const isDarkMode = document.body.classList.toggle('dark-mode');

  if (isDarkMode) {
    themeToggle.textContent = '浅色模式';
    themeToggle.setAttribute('aria-pressed', 'true');
    localStorage.setItem('theme', 'dark');
  } else {
    themeToggle.textContent = '深色模式';
    themeToggle.setAttribute('aria-pressed', 'false');
    localStorage.setItem('theme', 'light');
  }
});
