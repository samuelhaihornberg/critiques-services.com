
      const root = document.getElementById('root');
      const fallback = document.getElementById('spa-fallback');
      const observer = new MutationObserver(() => {
        if (root.children.length > 1 || (root.firstChild && root.firstChild !== fallback)) {
          fallback.style.display = 'none';
          observer.disconnect();
        }
      });
      observer.observe(root, { childList: true, subtree: true });
      setTimeout(() => { fallback.style.opacity = '0.5'; }, 5000);
      setTimeout(() => { fallback.style.display = 'none'; }, 10000);
    