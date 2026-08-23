(() => {
  'use strict';

  const platforms = [
    ['Windows', 'assets/platforms/windows.webp'],
    ['Android', 'assets/platforms/android.webp.png'],
    ['Android TV', 'assets/platforms/android-tv.webp.png']
  ];

  const currentLanguage = () => {
    try {
      return localStorage.getItem('veicloud-language-v2') || 'en';
    } catch (_) {
      return 'en';
    }
  };

  const pricingLabel = lang => (
    lang === 'es' ? 'Precios' : lang === 'ru' ? 'Цены' : 'Pricing'
  );

  const applyPlatformIcons = () => {
    const grid = document.querySelector('.vei-platform-grid');
    if (!grid || grid.dataset.veiPlatformIconsReady === '1') return false;

    grid.dataset.veiPlatformIconsReady = '1';
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

  const loadLanguageRuntime = () => {
    if (document.querySelector('script[data-vei-language-runtime]')) return;
    const script = document.createElement('script');
    script.src = 'language-runtime-v2.js?v=20260823-1';
    script.defer = true;
    script.dataset.veiLanguageRuntime = 'true';
    document.head.appendChild(script);
  };

  const addPricingLink = () => {
    const nav = document.querySelector('.nav nav');
    if (!nav) return false;

    let link = nav.querySelector('[data-vei-pricing-link]');
    if (!link) {
      link = document.createElement('a');
      link.href = 'pricing.html';
      link.dataset.veiPricingLink = '1';

      const faq = Array.from(nav.querySelectorAll('a')).find(
        item => item.getAttribute('href') === '#faq'
      );

      if (faq) nav.insertBefore(link, faq);
      else nav.appendChild(link);
    }

    link.textContent = pricingLabel(currentLanguage());
    return true;
  };

  const bindLanguagePricing = () => {
    document.addEventListener('click', event => {
      const button = event.target.closest?.('[data-lang]');
      if (!button) return;
      const link = document.querySelector('[data-vei-pricing-link]');
      if (link) link.textContent = pricingLabel(button.dataset.lang);
    });
  };

  document.addEventListener('DOMContentLoaded', () => {
    loadPerformanceCards();
    loadLanguageRuntime();
    bindLanguagePricing();

    if (!applyPlatformIcons()) {
      const platformObserver = new MutationObserver(() => {
        if (applyPlatformIcons()) platformObserver.disconnect();
      });
      platformObserver.observe(document.body, { childList: true, subtree: true });
      setTimeout(() => platformObserver.disconnect(), 5000);
    }

    addPricingLink();

    const nav = document.querySelector('.nav nav');
    if (nav) {
      const navObserver = new MutationObserver(() => addPricingLink());
      navObserver.observe(nav, { childList: true });
      setTimeout(() => navObserver.disconnect(), 5000);
    }
  });
})();
