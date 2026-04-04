/**
 * Search UI - Handles user interactions and result display
 */
(function() {
  const searchInput = document.getElementById('search-input');
  const searchResults = document.getElementById('search-results');
  const searchContainer = document.querySelector('.search-container');
  const searchToggle = document.querySelector('.search-toggle');
  let debounceTimer = null;

  if (!searchInput || !searchResults) {
    return;
  }

  /**
   * Display search results
   * @param {Array} results - Search results
   */
  function displayResults(results) {
    if (!results || results.length === 0) {
      searchResults.innerHTML = '<div class="search-result-item no-results">No results found</div>';
      searchResults.classList.add('visible');
      return;
    }

    const query = searchInput.value.trim().toLowerCase();
    const queryTerms = query.split(/\s+/);

    const html = results.map(result => {
      let title = escapeHtml(result.title);
      let summary = escapeHtml(result.summary || result.content);

      // Highlight matching terms
      queryTerms.forEach(term => {
        if (term.length > 0) {
          const regex = new RegExp(`(${escapeRegex(term)})`, 'gi');
          title = title.replace(regex, '<mark>$1</mark>');
          summary = summary.replace(regex, '<mark>$1</mark>');
        }
      });

      const categories = Array.isArray(result.categories) && result.categories.length > 0
        ? `<span class="search-categories">${result.categories.map(cat => escapeHtml(cat)).join(', ')}</span>`
        : '';

      return `
        <a href="${escapeHtml(result.id)}" class="search-result-item" role="option">
          <div class="search-result-title">${title}</div>
          <div class="search-result-meta">
            <span class="search-date">${escapeHtml(result.dateFormatted)}</span>
            ${categories}
          </div>
          <div class="search-result-summary">${summary}</div>
        </a>
      `;
    }).join('');

    searchResults.innerHTML = html;
    searchResults.classList.add('visible');
  }

  /**
   * Hide search results
   */
  function hideResults() {
    searchResults.classList.remove('visible');
  }

  /**
   * Show loading state
   */
  function showLoading() {
    searchResults.innerHTML = '<div class="search-result-item loading">Loading search index...</div>';
    searchResults.classList.add('visible');
  }

  /**
   * Perform search
   */
  async function performSearch() {
    const query = searchInput.value.trim();

    if (query.length === 0) {
      hideResults();
      return;
    }

    // Wait for index to load if not loaded yet
    if (!MelanieSearch.isLoaded()) {
      showLoading();
      try {
        await MelanieSearch.loadIndex();
      } catch (error) {
        searchResults.innerHTML = '<div class="search-result-item no-results">Error loading search index</div>';
        searchResults.classList.add('visible');
        return;
      }
    }

    const results = MelanieSearch.search(query);
    displayResults(results);
  }

  /**
   * Handle input with debounce
   */
  function handleInput() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(performSearch, 300);
  }

  /**
   * Pre-load index on first focus
   */
  let indexPreloaded = false;
  function handleFocus() {
    if (!indexPreloaded) {
      indexPreloaded = true;
      MelanieSearch.loadIndex().catch(err => {
        console.error('Failed to preload search index:', err);
      });
    }
  }

  /**
   * Escape HTML to prevent XSS
   */
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Escape regex special characters
   */
  function escapeRegex(text) {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Handle click outside to close results
   */
  function handleClickOutside(event) {
    if (!searchContainer.contains(event.target)) {
      hideResults();
    }
  }

  /**
   * Handle escape key to close results
   */
  function handleKeydown(event) {
    if (event.key === 'Escape') {
      hideResults();
      searchInput.blur();
    }
  }

  /**
   * Toggle mobile search
   */
  function toggleSearch() {
    searchContainer.classList.toggle('active');
    if (searchContainer.classList.contains('active')) {
      searchInput.focus();
      searchToggle.setAttribute('aria-expanded', 'true');
    } else {
      hideResults();
      searchToggle.setAttribute('aria-expanded', 'false');
    }
  }

  // Event listeners
  searchInput.addEventListener('input', handleInput);
  searchInput.addEventListener('focus', handleFocus);
  document.addEventListener('click', handleClickOutside);
  document.addEventListener('keydown', handleKeydown);

  if (searchToggle) {
    searchToggle.addEventListener('click', toggleSearch);
  }
})();
