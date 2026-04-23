(function initProjectsAdminPage() {
  const ADMIN_PASSWORD_STORAGE_KEY = 'projectsAdminPassword';

  const feedbackElement = document.getElementById('admin-feedback');
  const loadingElement = document.getElementById('admin-loading');
  const listElement = document.getElementById('projects-list');
  const messagesLoadingElement = document.getElementById('messages-loading');
  const messagesListElement = document.getElementById('messages-list');
  const authStatusElement = document.getElementById('auth-status');
  const authFormElement = document.getElementById('auth-form');
  const authPasswordInput = document.getElementById('admin-password');
  const logoutButton = document.getElementById('logout-button');
  const systemStatusElement = document.getElementById('system-status');
  const refreshHealthButton = document.getElementById('refresh-health-button');
  const saveButton = document.getElementById('save-button');
  const siteSettingsFormElement = document.getElementById('site-settings-form');
  const saveSiteSettingsButton = document.getElementById('save-site-settings-button');
  const heroTitleInput = document.getElementById('setting-hero-title');
  const heroSubtitleInput = document.getElementById('setting-hero-subtitle');
  const heroButtonTextInput = document.getElementById('setting-hero-button-text');
  const contactTitleInput = document.getElementById('setting-contact-title');
  const contactDescriptionInput = document.getElementById('setting-contact-description');
  const contactEmailInput = document.getElementById('setting-contact-email');

  const formElement = document.getElementById('project-form');
  const formTitleElement = document.getElementById('form-title');
  const idInput = document.getElementById('project-id');
  const titleInput = document.getElementById('project-title');
  const descriptionInput = document.getElementById('project-description');
  const linkInput = document.getElementById('project-link');

  const cancelButton = document.getElementById('cancel-button');

  const state = {
    projects: [],
    contactMessages: [],
    siteSettings: {},
    editingId: null,
    adminPassword: '',
  };

  function escapeHtml(value) {
    return String(value)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }

  // 统一显示中文提示信息，type 用于控制颜色
  function showFeedback(message, type) {
    feedbackElement.textContent = message;
    feedbackElement.classList.remove('success', 'error');

    if (type === 'success') {
      feedbackElement.classList.add('success');
    }

    if (type === 'error') {
      feedbackElement.classList.add('error');
    }
  }

  function resetForm() {
    state.editingId = null;
    idInput.value = '';
    formElement.reset();
    formTitleElement.textContent = '新增项目';
  }

  // 统一控制管理操作是否可用，避免未验证时误操作
  function setEditingControlsEnabled(enabled) {
    [formElement, siteSettingsFormElement].forEach((formNode) => {
      formNode.querySelectorAll('input, textarea, button').forEach((element) => {
        element.disabled = !enabled;
      });
    });

    if (!enabled) {
      resetForm();
    }
  }

  function renderAuthStatus() {
    if (state.adminPassword) {
      authStatusElement.textContent = '当前状态：已验证（可管理项目 / 网站配置 / 留言）';
      authStatusElement.classList.add('success');
      authStatusElement.classList.remove('error');
      saveButton.textContent = state.editingId ? '保存修改' : '保存';
      saveSiteSettingsButton.textContent = '保存网站配置';
      return;
    }

    authStatusElement.textContent = '当前状态：未验证（仅可查看）';
    authStatusElement.classList.add('error');
    authStatusElement.classList.remove('success');
    saveButton.textContent = '请先验证口令';
    saveSiteSettingsButton.textContent = '请先验证口令';
  }

  function fillSiteSettingsForm(siteSettings) {
    state.siteSettings = siteSettings;
    heroTitleInput.value = siteSettings.heroTitle || '';
    // 首页仍读取 heroDescription，这里映射到管理页的 heroSubtitle 字段
    heroSubtitleInput.value = siteSettings.heroDescription || '';
    heroButtonTextInput.value = siteSettings.heroButtonText || '';
    contactTitleInput.value = siteSettings.contactTitle || '';
    contactDescriptionInput.value = siteSettings.contactDescription || '';
    contactEmailInput.value = siteSettings.contactEmail || '';
  }

  function fillFormWithProject(project) {
    state.editingId = project.id;
    idInput.value = String(project.id);
    titleInput.value = project.title || '';
    descriptionInput.value = project.description || '';
    linkInput.value = project.link || '';
    formTitleElement.textContent = `编辑项目 #${project.id}`;
    titleInput.focus();
  }

  function createProjectItem(project) {
    const safeTitle = escapeHtml(project.title || '未命名项目');
    const safeDescription = escapeHtml(project.description || '暂无描述');
    const safeLink = escapeHtml(project.link || '');

    const actionDisabled = !state.adminPassword;
    const disabledAttribute = actionDisabled ? 'disabled' : '';
    const actionHint = actionDisabled ? ' title="请先完成口令验证"' : '';

    return `
      <article class="admin-item" data-id="${project.id}">
        <div class="admin-item-content">
          <h3>${safeTitle}</h3>
          <p>${safeDescription}</p>
          ${safeLink ? `<a href="${safeLink}" target="_blank" rel="noopener noreferrer">${safeLink}</a>` : '<p class="admin-empty-link">无链接</p>'}
        </div>
        <div class="admin-item-actions">
          <button type="button" class="admin-secondary" data-action="edit" data-id="${project.id}" ${disabledAttribute}${actionHint}>编辑</button>
          <button type="button" class="admin-danger" data-action="delete" data-id="${project.id}" ${disabledAttribute}${actionHint}>删除</button>
        </div>
      </article>
    `;
  }

  function renderProjects() {
    if (!Array.isArray(state.projects) || state.projects.length === 0) {
      listElement.innerHTML = '<p class="projects-status">暂无项目，请先新增。</p>';
      return;
    }

    listElement.innerHTML = state.projects.map((project) => createProjectItem(project)).join('');
  }

  function formatMessageTime(isoText) {
    const date = new Date(isoText);
    if (Number.isNaN(date.getTime())) {
      return '时间格式异常';
    }

    // 使用本地时间展示，便于管理员快速判断留言先后
    return date.toLocaleString('zh-CN', { hour12: false });
  }

  function createContactMessageItem(item) {
    const safeName = escapeHtml(item.name || '匿名');
    const safeEmail = escapeHtml(item.email || '未知邮箱');
    const safeMessage = escapeHtml(item.message || '');
    const safeCreatedAt = escapeHtml(formatMessageTime(item.created_at));

    return `
      <article class="admin-item">
        <div class="admin-item-content">
          <h3>${safeName}</h3>
          <p><strong>邮箱：</strong>${safeEmail}</p>
          <p><strong>留言：</strong>${safeMessage || '（空）'}</p>
          <p class="admin-item-meta"><strong>提交时间：</strong>${safeCreatedAt}</p>
        </div>
      </article>
    `;
  }

  function renderContactMessages() {
    if (!Array.isArray(state.contactMessages) || state.contactMessages.length === 0) {
      messagesListElement.innerHTML = '<p class="projects-status">暂无留言。</p>';
      return;
    }

    messagesListElement.innerHTML = state.contactMessages.map((item) => createContactMessageItem(item)).join('');
  }

  function resetContactMessagesView(tipText) {
    state.contactMessages = [];
    messagesLoadingElement.textContent = tipText;
    messagesListElement.innerHTML = '';
  }

  function formatServerTime(isoText) {
    const date = new Date(isoText);
    if (Number.isNaN(date.getTime())) {
      return '时间格式异常';
    }

    return date.toLocaleString('zh-CN', { hour12: false });
  }

  function renderSystemStatus(data) {
    const serviceOk = data.serviceStatus === 'ok';
    const databaseOk = data.databaseStatus === 'ok';

    // 统一在一个区域展示最小运维信息，便于新手快速判断问题
    systemStatusElement.innerHTML = `
      <p>服务状态：<strong class="${serviceOk ? 'status-ok' : 'status-error'}">${serviceOk ? '正常' : '异常'}</strong></p>
      <p>数据库状态：<strong class="${databaseOk ? 'status-ok' : 'status-error'}">${databaseOk ? '可用' : '不可用'}</strong></p>
      <p>数据库文件路径：<code>${escapeHtml(data.databaseFilePath || '未知')}</code></p>
      <p>服务器时间：${escapeHtml(formatServerTime(data.serverTime))}</p>
    `;
  }

  function getAdminHeaders() {
    if (!state.adminPassword) {
      return {};
    }

    return {
      'X-Admin-Password': state.adminPassword,
    };
  }

  async function verifyPassword(password) {
    const response = await fetch('/api/admin/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ password }),
    });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || '口令验证失败');
    }
  }

  async function handleAuthSubmit(event) {
    event.preventDefault();

    const password = authPasswordInput.value.trim();
    if (!password) {
      showFeedback('请输入管理口令后再验证', 'error');
      return;
    }

    try {
      await verifyPassword(password);
      state.adminPassword = password;
      sessionStorage.setItem(ADMIN_PASSWORD_STORAGE_KEY, password);
      setEditingControlsEnabled(true);
      renderAuthStatus();
      showFeedback('口令验证成功，现在可以管理项目和网站配置', 'success');
      authFormElement.reset();
      await loadContactMessages();
    } catch (error) {
      state.adminPassword = '';
      sessionStorage.removeItem(ADMIN_PASSWORD_STORAGE_KEY);
      setEditingControlsEnabled(false);
      renderAuthStatus();
      showFeedback(error.message || '口令验证失败', 'error');
      resetContactMessagesView('请先完成口令验证后查看留言列表。');
    }
  }

  function handleLogout() {
    state.adminPassword = '';
    sessionStorage.removeItem(ADMIN_PASSWORD_STORAGE_KEY);
    setEditingControlsEnabled(false);
    renderAuthStatus();
    showFeedback('已退出验证，当前只能查看项目列表', 'success');
    resetContactMessagesView('请先完成口令验证后查看留言列表。');
  }

  async function restoreAuthFromSession() {
    const savedPassword = sessionStorage.getItem(ADMIN_PASSWORD_STORAGE_KEY);
    if (!savedPassword) {
      setEditingControlsEnabled(false);
      renderAuthStatus();
      return;
    }

    try {
      await verifyPassword(savedPassword);
      state.adminPassword = savedPassword;
      setEditingControlsEnabled(true);
      renderAuthStatus();
      await loadContactMessages();
    } catch (error) {
      state.adminPassword = '';
      sessionStorage.removeItem(ADMIN_PASSWORD_STORAGE_KEY);
      setEditingControlsEnabled(false);
      renderAuthStatus();
      showFeedback('之前的验证已失效，请重新输入口令', 'error');
      resetContactMessagesView('请先完成口令验证后查看留言列表。');
    }
  }

  async function loadProjects() {
    loadingElement.textContent = '项目加载中...';

    try {
      const response = await fetch('/api/projects');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || '项目读取失败');
      }

      state.projects = Array.isArray(data.projects) ? data.projects : [];
      loadingElement.textContent = '';
      renderProjects();
    } catch (error) {
      loadingElement.textContent = '';
      listElement.innerHTML = '<p class="projects-status">项目加载失败，请刷新后重试。</p>';
      showFeedback(error.message || '项目加载失败', 'error');
    }
  }

  async function loadSiteSettings() {
    try {
      const response = await fetch('/api/site-settings');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || '网站配置读取失败');
      }

      const siteSettings =
        data && typeof data.siteSettings === 'object' && data.siteSettings !== null
          ? data.siteSettings
          : {};
      fillSiteSettingsForm(siteSettings);
    } catch (error) {
      showFeedback(error.message || '网站配置读取失败', 'error');
    }
  }

  async function loadHealthStatus() {
    systemStatusElement.innerHTML = `
      <p>服务状态：检测中...</p>
      <p>数据库状态：检测中...</p>
      <p>数据库文件路径：读取中...</p>
      <p>服务器时间：读取中...</p>
    `;

    try {
      const response = await fetch('/api/health');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || '系统状态读取失败');
      }

      renderSystemStatus(data);
    } catch (error) {
      systemStatusElement.innerHTML = `
        <p>服务状态：<strong class="status-error">读取失败</strong></p>
        <p>数据库状态：<strong class="status-error">读取失败</strong></p>
        <p>数据库文件路径：暂时不可用</p>
        <p>服务器时间：暂时不可用</p>
      `;
      showFeedback(error.message || '系统状态读取失败，请稍后重试', 'error');
    }
  }

  async function loadContactMessages() {
    if (!state.adminPassword) {
      resetContactMessagesView('请先完成口令验证后查看留言列表。');
      return;
    }

    messagesLoadingElement.textContent = '留言加载中...';
    messagesListElement.innerHTML = '';

    try {
      const response = await fetch('/api/contact-messages', {
        headers: {
          ...getAdminHeaders(),
        },
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || '留言读取失败');
      }

      state.contactMessages = Array.isArray(data.messages) ? data.messages : [];
      messagesLoadingElement.textContent = '';
      renderContactMessages();
    } catch (error) {
      messagesLoadingElement.textContent = '';
      messagesListElement.innerHTML = '<p class="projects-status">留言加载失败，请稍后重试。</p>';
      showFeedback(error.message || '留言读取失败', 'error');
    }
  }

  // 根据是否在编辑状态，决定提交到 POST 还是 PUT
  async function submitProject(event) {
    event.preventDefault();

    const payload = {
      title: titleInput.value.trim(),
      description: descriptionInput.value.trim(),
      link: linkInput.value.trim(),
    };

    if (!payload.title) {
      showFeedback('项目标题不能为空', 'error');
      return;
    }

    const isEditing = Number.isInteger(state.editingId);
    const targetUrl = isEditing ? `/api/projects/${state.editingId}` : '/api/projects';
    const method = isEditing ? 'PUT' : 'POST';

    try {
      const response = await fetch(targetUrl, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...getAdminHeaders(),
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || '保存失败');
      }

      showFeedback(data.message || '保存成功', 'success');
      resetForm();
      await loadProjects();
    } catch (error) {
      showFeedback(error.message || '保存失败，请稍后重试', 'error');
    }
  }

  async function deleteProject(projectId) {
    const project = state.projects.find((item) => item.id === projectId);
    const projectTitle = project?.title || '该项目';

    const confirmed = window.confirm(`确认删除「${projectTitle}」吗？`);
    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'DELETE',
        headers: {
          ...getAdminHeaders(),
        },
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || '删除失败');
      }

      // 如果正在编辑被删除的项目，删除后自动清空表单
      if (state.editingId === projectId) {
        resetForm();
      }

      showFeedback(data.message || '删除成功', 'success');
      await loadProjects();
    } catch (error) {
      showFeedback(error.message || '删除失败，请稍后重试', 'error');
    }
  }

  async function submitSiteSettings(event) {
    event.preventDefault();

    if (!state.adminPassword) {
      showFeedback('请先通过口令验证，再修改网站配置', 'error');
      return;
    }

    const payload = {
      heroTitle: heroTitleInput.value.trim(),
      heroSubtitle: heroSubtitleInput.value.trim(),
      heroButtonText: heroButtonTextInput.value.trim(),
      contactTitle: contactTitleInput.value.trim(),
      contactDescription: contactDescriptionInput.value.trim(),
      contactEmail: contactEmailInput.value.trim(),
    };

    if (Object.values(payload).some((value) => !value)) {
      showFeedback('网站配置字段不能为空', 'error');
      return;
    }

    try {
      const response = await fetch('/api/site-settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAdminHeaders(),
        },
        body: JSON.stringify(payload),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || '网站配置保存失败');
      }

      showFeedback(data.message || '网站配置保存成功', 'success');
      await loadSiteSettings();
    } catch (error) {
      showFeedback(error.message || '网站配置保存失败，请稍后重试', 'error');
    }
  }

  function handleListClick(event) {
    const button = event.target.closest('button[data-action]');
    if (!button) {
      return;
    }

    const action = button.dataset.action;
    const projectId = Number(button.dataset.id);

    if (!Number.isInteger(projectId) || projectId <= 0) {
      showFeedback('项目 id 无效', 'error');
      return;
    }

    if (!state.adminPassword) {
      showFeedback('请先通过口令验证，再进行编辑或删除', 'error');
      return;
    }

    if (action === 'edit') {
      const project = state.projects.find((item) => item.id === projectId);
      if (!project) {
        showFeedback('未找到该项目，列表可能已过期', 'error');
        return;
      }
      fillFormWithProject(project);
      return;
    }

    if (action === 'delete') {
      deleteProject(projectId);
    }
  }

  authFormElement.addEventListener('submit', handleAuthSubmit);
  logoutButton.addEventListener('click', handleLogout);
  refreshHealthButton.addEventListener('click', loadHealthStatus);
  formElement.addEventListener('submit', submitProject);
  siteSettingsFormElement.addEventListener('submit', submitSiteSettings);
  cancelButton.addEventListener('click', resetForm);
  listElement.addEventListener('click', handleListClick);

  resetContactMessagesView('请先完成口令验证后查看留言列表。');
  restoreAuthFromSession();
  loadHealthStatus();
  loadProjects();
  loadSiteSettings();
})();
