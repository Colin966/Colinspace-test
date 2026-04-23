(function initProjectsAdminPage() {
  const ADMIN_PASSWORD_STORAGE_KEY = 'projectsAdminPassword';

  const feedbackElement = document.getElementById('admin-feedback');
  const loadingElement = document.getElementById('admin-loading');
  const listElement = document.getElementById('projects-list');
  const authStatusElement = document.getElementById('auth-status');
  const authFormElement = document.getElementById('auth-form');
  const authPasswordInput = document.getElementById('admin-password');
  const logoutButton = document.getElementById('logout-button');
  const saveButton = document.getElementById('save-button');

  const formElement = document.getElementById('project-form');
  const formTitleElement = document.getElementById('form-title');
  const idInput = document.getElementById('project-id');
  const titleInput = document.getElementById('project-title');
  const descriptionInput = document.getElementById('project-description');
  const linkInput = document.getElementById('project-link');

  const cancelButton = document.getElementById('cancel-button');

  const state = {
    projects: [],
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
    formElement
      .querySelectorAll('input, textarea, button')
      .forEach((element) => {
        element.disabled = !enabled;
      });

    if (!enabled) {
      resetForm();
    }
  }

  function renderAuthStatus() {
    if (state.adminPassword) {
      authStatusElement.textContent = '当前状态：已验证（可新增 / 编辑 / 删除）';
      authStatusElement.classList.add('success');
      authStatusElement.classList.remove('error');
      saveButton.textContent = state.editingId ? '保存修改' : '保存';
      return;
    }

    authStatusElement.textContent = '当前状态：未验证（仅可查看）';
    authStatusElement.classList.add('error');
    authStatusElement.classList.remove('success');
    saveButton.textContent = '请先验证口令';
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
      showFeedback('口令验证成功，现在可以管理项目', 'success');
      authFormElement.reset();
    } catch (error) {
      state.adminPassword = '';
      sessionStorage.removeItem(ADMIN_PASSWORD_STORAGE_KEY);
      setEditingControlsEnabled(false);
      renderAuthStatus();
      showFeedback(error.message || '口令验证失败', 'error');
    }
  }

  function handleLogout() {
    state.adminPassword = '';
    sessionStorage.removeItem(ADMIN_PASSWORD_STORAGE_KEY);
    setEditingControlsEnabled(false);
    renderAuthStatus();
    showFeedback('已退出验证，当前只能查看项目列表', 'success');
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
    } catch (error) {
      state.adminPassword = '';
      sessionStorage.removeItem(ADMIN_PASSWORD_STORAGE_KEY);
      setEditingControlsEnabled(false);
      renderAuthStatus();
      showFeedback('之前的验证已失效，请重新输入口令', 'error');
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
  formElement.addEventListener('submit', submitProject);
  cancelButton.addEventListener('click', resetForm);
  listElement.addEventListener('click', handleListClick);

  restoreAuthFromSession();
  loadProjects();
})();
