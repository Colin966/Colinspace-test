const button = document.getElementById('btn');
const message = document.getElementById('message');
const themeToggle = document.getElementById('theme-toggle');

button.addEventListener('click', () => {
  message.textContent = 'Welcome! Start customizing your homepage.';
});

const savedTheme = localStorage.getItem('theme');

if (savedTheme === 'dark') {
  document.body.classList.add('dark-mode');
  themeToggle.textContent = 'Light mode';
  themeToggle.setAttribute('aria-pressed', 'true');
}

themeToggle.addEventListener('click', () => {
  const isDarkMode = document.body.classList.toggle('dark-mode');

  if (isDarkMode) {
    themeToggle.textContent = 'Light mode';
    themeToggle.setAttribute('aria-pressed', 'true');
    localStorage.setItem('theme', 'dark');
  } else {
    themeToggle.textContent = 'Dark mode';
    themeToggle.setAttribute('aria-pressed', 'false');
    localStorage.setItem('theme', 'light');
  }
});
