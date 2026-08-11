(() => {
  'use strict';
  const allowed = ['es','ru','en'];
  const apply = lang => {
    lang = allowed.includes(lang) ? lang : 'es';
    document.documentElement.lang = lang;
    document.querySelectorAll('[data-lang-panel]').forEach(el => el.classList.toggle('active', el.dataset.langPanel === lang));
    document.querySelectorAll('[data-lang]').forEach(el => el.classList.toggle('active', el.dataset.lang === lang));
    try { localStorage.setItem('veicloud-language', lang); } catch (_) {}
  };
  document.addEventListener('DOMContentLoaded', () => {
    let lang = 'es';
    try { lang = localStorage.getItem('veicloud-language') || 'es'; } catch (_) {}
    apply(lang);
    document.querySelectorAll('[data-lang]').forEach(btn => btn.addEventListener('click', () => apply(btn.dataset.lang)));
  });
})();