document.addEventListener('DOMContentLoaded', function() {
  const articleList = document.querySelector('.article-list .space-y-4');
  const loadMoreTrigger = document.getElementById('load-more-trigger');
  
  if (!articleList || !loadMoreTrigger) return;

  let nextPageUrl = loadMoreTrigger.dataset.nextPage;
  let isLoading = false;

  const observer = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting && nextPageUrl && !isLoading) {
      loadMoreArticles();
    }
  }, { rootMargin: '200px' });

  observer.observe(loadMoreTrigger);

  async function loadMoreArticles() {
    isLoading = true;
    loadMoreTrigger.classList.add('loading');
    loadMoreTrigger.innerHTML = '<div class="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>';

    try {
      const response = await fetch(nextPageUrl);
      if (!response.ok) throw new Error('Network response was not ok');
      
      const text = await response.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(text, 'text/html');
      
      // Find new articles
      // We assume the structure is .article-list .space-y-4 > article/div
      // But article-list.html renders {{ partial "content/card-base.html" ... }}
      // card-base.html usually renders an <article> or <a> tag.
      // Let's look for the container in the fetched page.
      
      // If fetching from /page/2/, it renders home.html which has recent-articles.html which has article-list.html
      // So we look for .article-list .space-y-4
      
      const newContainer = doc.querySelector('.article-list .space-y-4');
      if (newContainer) {
        const newArticles = newContainer.children;
        Array.from(newArticles).forEach(article => {
          articleList.appendChild(article.cloneNode(true));
        });
      }

      // Update next page URL
      // We need to find the next page link in the fetched page.
      // But recent-articles.html usually doesn't render pagination.
      // We need to ensure pagination is rendered or passed.
      
      const newTrigger = doc.getElementById('load-more-trigger');
      if (newTrigger && newTrigger.dataset.nextPage) {
        nextPageUrl = newTrigger.dataset.nextPage;
        loadMoreTrigger.dataset.nextPage = nextPageUrl;
      } else {
        nextPageUrl = null;
        observer.disconnect();
        loadMoreTrigger.remove();
      }

    } catch (error) {
      console.error('Error loading more articles:', error);
    } finally {
      isLoading = false;
      if (nextPageUrl) {
        loadMoreTrigger.classList.remove('loading');
        loadMoreTrigger.innerHTML = ''; // Or keep it empty/hidden until next intersection
      }
    }
  }
});
