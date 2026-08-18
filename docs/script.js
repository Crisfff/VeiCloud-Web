(() => {
  'use strict';

  const APK_URL = '/download/VeiCloudVPN.apk';
  const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

  const injectPerformanceOverrides = () => {
    const style = document.createElement('style');
    style.id = 'veicloud-performance-overrides';
    style.textContent = `
      #webgl,.cursor-aura,.intro,.noise{display:none!important}
      .reveal{opacity:1!important;transform:none!important}
      .device-wrap,.metric-card,.nav,.hero-copy>*{opacity:1!important}
      .marquee div,.radar i,.scroll-note i,.power span,.download-mark i,.shine{animation:none!important}
      .device-wrap,.magnetic,.feature,.price-card{transform:none}
      .glass{backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px)}
      .section,.download,.network{content-visibility:auto;contain-intrinsic-size:800px}
      .globe-panel{background:radial-gradient(circle at 50% 45%,rgba(255,67,37,.15),transparent 38%),linear-gradient(145deg,rgba(255,255,255,.05),rgba(255,255,255,.015))}
      #globe{display:none!important}
      @media (max-width:760px){
        .glass{backdrop-filter:none!important;-webkit-backdrop-filter:none!important}
        .aurora{filter:blur(28px)!important}
      }
      @media (prefers-reduced-motion:reduce){
        *,*::before,*::after{scroll-behavior:auto!important;animation:none!important;transition-duration:.01ms!important}
      }
    `;
    document.head.appendChild(style);
  };

  const removeHeavyDecorations = () => {
    document.querySelectorAll('#webgl,.cursor-aura,.intro,.noise').forEach(el => el.remove());
  };

  const wireDownloads = () => {
    const downloadSelectors = [
      '[data-i18n="nav.download"]',
      '[data-i18n="hero.download"]',
      '[data-i18n="download.button"]',
      '[data-i18n^="plans.choose"]'
    ];

    document.querySelectorAll(downloadSelectors.join(',')).forEach(link => {
      if (link.tagName !== 'A') return;
      link.href = APK_URL;
      link.setAttribute('download', 'VeiCloudVPN.apk');
      link.removeAttribute('target');
      link.removeAttribute('rel');
    });
  };

  const forceMobileAccountAccess = () => {
    const accountLink = document.querySelector('.nav-tools a[href="portal.html"]');
    const languageSwitcher = document.querySelector('.language-switcher');
    const navDownload = document.querySelector('.nav-tools a[data-i18n="nav.download"]');
    if (!accountLink) return;

    const apply = () => {
      if (window.innerWidth <= 600) {
        if (languageSwitcher) languageSwitcher.style.setProperty('display', 'none', 'important');
        if (navDownload) navDownload.style.setProperty('display', 'none', 'important');
        accountLink.style.setProperty('display', 'inline-flex', 'important');
        accountLink.style.setProperty('visibility', 'visible', 'important');
        accountLink.style.setProperty('opacity', '1', 'important');
      } else {
        accountLink.style.removeProperty('display');
        accountLink.style.removeProperty('visibility');
        accountLink.style.removeProperty('opacity');
        languageSwitcher?.style.removeProperty('display');
        navDownload?.style.removeProperty('display');
      }
    };

    apply();
    window.addEventListener('resize', apply, { passive: true });
  };

  const wireInternalNavigation = () => {
    document.querySelectorAll('a[href^="#"]').forEach(link => {
      link.addEventListener('click', event => {
        const targetId = link.getAttribute('href');
        if (!targetId || targetId === '#') {
          event.preventDefault();
          return;
        }

        const target = document.querySelector(targetId);
        if (!target) return;

        event.preventDefault();
        target.scrollIntoView({
          behavior: reduceMotion ? 'auto' : 'smooth',
          block: 'start'
        });
      });
    });
  };

  const revealContent = () => {
    document.querySelectorAll('.reveal').forEach(el => {
      el.style.opacity = '1';
      el.style.transform = 'none';
    });
  };

  const wireCounters = () => {
    const counters = [...document.querySelectorAll('[data-count]')];
    if (!counters.length) return;

    const showValue = el => {
      const target = Number(el.dataset.count || 0);
      if (reduceMotion) {
        el.textContent = String(target);
        return;
      }

      const duration = 650;
      const start = performance.now();
      const tick = now => {
        const progress = Math.min((now - start) / duration, 1);
        el.textContent = String(Math.round(target * progress));
        if (progress < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };

    if (!('IntersectionObserver' in window)) {
      counters.forEach(showValue);
      return;
    }

    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        showValue(entry.target);
        observer.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -10% 0px' });

    counters.forEach(el => observer.observe(el));
  };

  const improveExternalActions = () => {
    document.querySelectorAll('a[href="portal.html"]').forEach(link => {
      link.setAttribute('aria-label', link.textContent.trim() || 'Mi cuenta');
    });

    document.querySelectorAll('.legal-card').forEach(link => {
      link.setAttribute('aria-label', link.querySelector('strong')?.textContent?.trim() || 'Documento legal');
    });
  };

  injectPerformanceOverrides();

  document.addEventListener('DOMContentLoaded', () => {
    removeHeavyDecorations();
    revealContent();
    wireDownloads();
    forceMobileAccountAccess();
    wireInternalNavigation();
    wireCounters();
    improveExternalActions();
  });
})();
