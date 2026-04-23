const button = document.getElementById('btn');
const message = document.getElementById('message');
const themeToggle = document.getElementById('theme-toggle');

// 首页引导按钮文案
button.addEventListener('click', () => {
  message.textContent = '欢迎来到我的作品集，向下查看项目案例。';
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
