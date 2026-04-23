(function initProjectsAdminPage() {
  const feedbackElement = document.getElementById('admin-feedback');
  const loadingElement = document.getElementById('admin-loading');
  const listElement = document.getElementById('projects-list');

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

    return `
      <article class="admin-item" data-id="${project.id}">
        <div class="admin-item-content">
          <h3>${safeTitle}</h3>
          <p>${safeDescription}</p>
          ${safeLink ? `<a href="${safeLink}" target="_blank" rel="noopener noreferrer">${safeLink}</a>` : '<p class="admin-empty-link">无链接</p>'}
        </div>
        <div class="admin-item-actions">
          <button type="button" class="admin-secondary" data-action="edit" data-id="${project.id}">编辑</button>
          <button type="button" class="admin-danger" data-action="delete" data-id="${project.id}">删除</button>
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

  formElement.addEventListener('submit', submitProject);
  cancelButton.addEventListener('click', resetForm);
  listElement.addEventListener('click', handleListClick);

  loadProjects();
})();
