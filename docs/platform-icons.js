(() => {
  'use strict';

  const platforms = [
    ['Windows', 'assets/platforms/windows.webp'],
    ['Android', 'assets/platforms/android.webp.png'],
    ['Android TV', 'assets/platforms/android-tv.webp.png']
  ];

  const applyPlatformIcons = () => {
    const grid = document.querySelector('.vei-platform-grid');
    if (!grid) return false;

    grid.innerHTML = platforms.map(([name, src]) => `
      <div class="vei-platform">
        <div class="vei-platform-icon vei-platform-image">
          <img src="${src}" alt="${name}" loading="lazy" decoding="async">
        </div>
        <strong>${name}</strong>
      </div>
    `).join('');

    grid.style.gridTemplateColumns = 'repeat(3,1fr)';

    if (!document.querySelector('#vei-platform-image-styles')) {
      const style = document.createElement('style');
      style.id = 'vei-platform-image-styles';
      style.textContent = `
        .vei-platform-image{overflow:hidden}
        .vei-platform-image img{width:26px;height:26px;object-fit:contain;display:block}
        @media(max-width:700px){.vei-platform-grid{grid-template-columns:1fr!important}}
      `;
      document.head.appendChild(style);
    }

    return true;
  };

  const loadPerformanceCards = () => {
    if (document.querySelector('script[data-vei-performance]')) return;
    const script = document.createElement('script');
    script.src = 'performance-cards.js?v=20260818-1';
    script.defer = true;
    script.dataset.veiPerformance = 'true';
    document.head.appendChild(script);
  };

  const loadDynamicI18n = () => {
    if (document.querySelector('script[data-vei-dynamic-i18n]')) return;
    const script = document.createElement('script');
    script.src = 'dynamic-i18n.js?v=20260823-1';
    script.defer = true;
    script.dataset.veiDynamicI18n = 'true';
    document.head.appendChild(script);
  };

  document.addEventListener('DOMContentLoaded', () => {
    loadPerformanceCards();
    loadDynamicI18n();
    if (applyPlatformIcons()) return;

    const observer = new MutationObserver(() => {
      if (applyPlatformIcons()) observer.disconnect();
    });

    observer.observe(document.body, { childList: true, subtree: true });
    setTimeout(() => observer.disconnect(), 5000);
  });
})();
