const button = document.getElementById('btn');
const message = document.getElementById('message');
const themeToggle = document.getElementById('theme-toggle');
const projectsContainer = document.getElementById('projects');
const projectsStatus = document.getElementById('projects-status');

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
