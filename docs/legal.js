(() => {
  'use strict';

  const allowed = ['es', 'ru', 'en'];
  const STORAGE_KEY = 'veicloud-language-v2';

  const apply = lang => {
    lang = allowed.includes(lang) ? lang : 'en';
    document.documentElement.lang = lang;

    document.querySelectorAll('[data-lang-panel]').forEach(el => {
      el.classList.toggle('active', el.dataset.langPanel === lang);
    });

    document.querySelectorAll('[data-lang]').forEach(el => {
      el.classList.toggle('active', el.dataset.lang === lang);
    });

    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch (_) {}
  };

  document.addEventListener('DOMContentLoaded', () => {
    let lang = 'en';

    try {
      lang = localStorage.getItem(STORAGE_KEY) || 'en';
    } catch (_) {}

    apply(lang);

    document.querySelectorAll('[data-lang]').forEach(btn => {
      btn.addEventListener('click', () => apply(btn.dataset.lang));
    });
  });
})();