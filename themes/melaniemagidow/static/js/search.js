/**
 * MelanieSearch - Client-side search using lunr.js
 */
const MelanieSearch = (function() {
  let index = null;
  let documents = [];
  let indexLoading = false;
  let indexLoaded = false;

  /**
   * Load the search index and build lunr index
   * @returns {Promise<void>}
   */
  async function loadIndex() {
    if (indexLoaded || indexLoading) {
      return;
    }

    indexLoading = true;

    try {
      // Build absolute URL to search.json at site root
      const baseUrl = window.location.origin;
      const response = await fetch(`${baseUrl}/search.json`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      documents = await response.json();

      // Build lunr index with field boosting
      index = lunr(function() {
        this.ref('id');
        this.field('title', { boost: 10 });
        this.field('content', { boost: 5 });
        this.field('categories', { boost: 3 });
        this.field('tags', { boost: 2 });
        this.field('summary');

        documents.forEach(doc => {
          this.add({
            id: doc.id,
            title: doc.title,
            content: doc.content,
            summary: doc.summary,
            categories: Array.isArray(doc.categories) ? doc.categories.join(' ') : '',
            tags: Array.isArray(doc.tags) ? doc.tags.join(' ') : ''
          });
        });
      });

      indexLoaded = true;
      indexLoading = false;
    } catch (error) {
      console.error('Error loading search index:', error);
      indexLoading = false;
      throw error;
    }
  }

  /**
   * Search the index
   * @param {string} query - Search query
   * @returns {Array} Search results with metadata
   */
  function search(query) {
    if (!indexLoaded || !index) {
      return [];
    }

    if (!query || query.trim().length === 0) {
      return [];
    }

    try {
      // Add wildcard for partial matching
      const searchQuery = query.trim().split(/\s+/).map(term => `${term}* ${term}`).join(' ');
      const results = index.search(searchQuery);

      // Map results to document metadata and limit to top 10
      return results.slice(0, 10).map(result => {
        const doc = documents.find(d => d.id === result.ref);
        return {
          ...doc,
          score: result.score
        };
      });
    } catch (error) {
      console.error('Search error:', error);
      return [];
    }
  }

  /**
   * Check if index is loaded
   * @returns {boolean}
   */
  function isLoaded() {
    return indexLoaded;
  }

  // Public API
  return {
    loadIndex,
    search,
    isLoaded
  };
})();
