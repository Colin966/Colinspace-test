(function initProjectsView(globalScope) {
  function escapeHtml(value) {
    return String(value)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }

  function createProjectCard(project) {
    const title = escapeHtml(project?.title || '未命名项目');
    const description = escapeHtml(project?.description || '暂无项目描述。');

    return `\n    <article class="project-card">\n      <h2>${title}</h2>\n      <p>${description}</p>\n    </article>\n  `;
  }

  function buildProjectsView(projects) {
    if (!Array.isArray(projects) || projects.length === 0) {
      return {
        cardsMarkup: '',
        statusText: '暂时没有项目数据，请稍后再来看。',
      };
    }

    const cardsMarkup = projects.map((project) => createProjectCard(project)).join('');

    return {
      cardsMarkup,
      statusText: '',
    };
  }

  const api = {
    createProjectCard,
    buildProjectsView,
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }

  globalScope.ProjectsView = api;
})(typeof globalThis !== 'undefined' ? globalThis : window);
