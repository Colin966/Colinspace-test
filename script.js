const button = document.getElementById('btn');
const message = document.getElementById('message');
const themeToggle = document.getElementById('theme-toggle');
const projectsContainer = document.getElementById('projects');
const projectsStatus = document.getElementById('projects-status');
const contactForm = document.getElementById('contact-form');
const contactFeedback = document.getElementById('contact-feedback');

// 首页引导按钮文案
button.addEventListener('click', () => {
  message.textContent = '欢迎来到我的作品集，向下查看项目案例。';
});

function createProjectCard(project) {
  return `
    <article class="project-card">
      <h2>${project.title}</h2>
      <p>${project.description}</p>
    </article>
  `;
}

function renderProjects(projects) {
  if (!projects.length) {
    // 接口成功但暂无数据时，给出中文提示
    projectsContainer.innerHTML = '<p class="projects-status">暂时没有项目数据，请稍后再来看。</p>';
    return;
  }

  const cardsMarkup = projects.map((project) => createProjectCard(project)).join('');
  projectsContainer.innerHTML = cardsMarkup;
}

async function loadProjects() {
  try {
    const response = await fetch('/api/projects');

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    renderProjects(data.projects || []);
  } catch (error) {
    // 前端加载失败时兜底提示
    projectsStatus.textContent = '项目加载失败，请稍后重试。';
  }
}

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

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || '提交失败');
    }

    contactForm.reset();
    showContactFeedback('提交成功，感谢你的留言！', 'success');
  } catch (error) {
    showContactFeedback('提交失败，请稍后重试。', 'error');
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
