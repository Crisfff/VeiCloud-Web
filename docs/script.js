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

      /* VeiCloud hero */
      .hero.vei-hero{display:block;min-height:auto;width:min(1180px,calc(100% - 36px));padding:150px 0 74px}
      .vei-hero .hero-mesh{opacity:.34;mask-image:linear-gradient(to bottom,#000,transparent 92%)}
      .vei-hero::before{content:"";position:absolute;width:520px;height:520px;border-radius:50%;right:-130px;top:80px;background:radial-gradient(circle,rgba(255,67,37,.13),transparent 68%);pointer-events:none}
      .vei-hero-grid{position:relative;z-index:2;display:grid;grid-template-columns:minmax(0,1.05fr) minmax(360px,.95fr);align-items:center;gap:58px}
      .vei-hero-copy{max-width:650px}
      .vei-badge{display:inline-flex;align-items:center;gap:9px;padding:8px 12px;border:1px solid rgba(255,67,37,.24);border-radius:999px;background:rgba(255,67,37,.06);color:#ff8069;font-size:10px;font-weight:800;letter-spacing:1.5px}
      .vei-badge svg{width:14px;height:14px}
      .vei-hero h1{font:800 clamp(52px,6vw,82px)/.98 Manrope,sans-serif;letter-spacing:-4.3px;margin:24px 0 22px;max-width:720px}
      .vei-hero h1 em{font-style:normal;color:var(--red);background:none;-webkit-text-fill-color:initial}
      .vei-hero-copy>p{max-width:610px;color:#9b9fa9;font-size:16px;line-height:1.75;margin:0}
      .vei-hero-actions{display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin-top:30px}
      .vei-hero-actions .button{min-height:50px;padding-inline:22px}
      .vei-hero-art{position:relative;display:flex;justify-content:center;align-items:center;min-height:440px}
      .vei-hero-art::before{content:"";position:absolute;width:78%;height:78%;border-radius:50%;background:radial-gradient(circle,rgba(255,67,37,.16),transparent 68%);filter:blur(14px)}
      .vei-hero-art img{position:relative;z-index:1;width:min(100%,520px);max-height:480px;object-fit:contain;filter:drop-shadow(0 35px 70px rgba(0,0,0,.48))}
      .vei-feature-row{position:relative;z-index:2;display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-top:62px}
      .vei-mini-card{min-height:150px;padding:22px;border:0;border-radius:22px;background:#17191e;box-shadow:none}
      .vei-mini-icon{width:38px;height:38px;border-radius:12px;display:grid;place-items:center;background:rgba(255,67,37,.1);color:#ff654d;margin-bottom:18px}
      .vei-mini-icon svg{width:19px;height:19px}
      .vei-mini-card strong{display:block;font:700 15px Manrope,sans-serif;margin-bottom:8px}
      .vei-mini-card p{margin:0;color:#8d929c;font-size:12px;line-height:1.6}
      .nav{background:#17191e!important;border:0!important;box-shadow:none!important}
      .nav nav a:hover{color:#fff}
      .nav-download{background:var(--red)!important;color:#fff!important}

      /* VPN explainer */
      .vei-explainer-wrap{width:min(1320px,calc(100% - 28px));margin:0 auto 90px;padding:14px}
      .vei-explainer{background:#b8c7d4;color:#18212a;border-radius:34px;padding:78px 58px 62px;box-shadow:none;overflow:hidden;position:relative}
      .vei-explainer::after{content:"";position:absolute;width:420px;height:420px;border-radius:50%;right:-150px;top:-180px;background:rgba(255,255,255,.16);pointer-events:none}
      .vei-explainer-head{text-align:center;max-width:820px;margin:0 auto 42px;position:relative;z-index:1}
      .vei-explainer-label{display:inline-flex;align-items:center;gap:8px;padding:7px 11px;border-radius:999px;background:rgba(24,33,42,.08);font-size:10px;font-weight:800;letter-spacing:1.2px;text-transform:uppercase}
      .vei-explainer-label svg{width:14px;height:14px}
      .vei-explainer h2{font:800 clamp(38px,5vw,64px)/1 Manrope,sans-serif;letter-spacing:-3px;margin:18px 0 18px;color:#111a22}
      .vei-explainer-head p{margin:0 auto;color:#3c4a56;max-width:760px;font-size:15px;line-height:1.75}
      .vei-explainer-intro{max-width:1000px;margin:0 auto 34px;padding:22px 24px;border-radius:22px;background:rgba(255,255,255,.26);color:#33414c;font-size:14px;line-height:1.7}
      .vei-explainer-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;max-width:1040px;margin:0 auto;position:relative;z-index:1}
      .vei-explainer-card{padding:26px 24px 28px;border-radius:24px;background:rgba(255,255,255,.18);text-align:center}
      .vei-explainer-icon{width:48px;height:48px;border-radius:15px;display:grid;place-items:center;margin:0 auto 17px;background:rgba(24,33,42,.08);color:#d4432f}
      .vei-explainer-icon svg{width:23px;height:23px}
      .vei-explainer-card strong{display:block;font:700 17px Manrope,sans-serif;margin-bottom:10px;color:#17212a}
      .vei-explainer-card p{margin:0;color:#46545f;font-size:13px;line-height:1.65}
      .marquee{display:none!important}

      @media (max-width:900px){
        .vei-hero-grid{grid-template-columns:1fr;gap:28px}
        .vei-hero-copy{text-align:center;margin:auto}
        .vei-badge{margin-inline:auto}
        .vei-hero-actions{justify-content:center}
        .vei-hero-art{min-height:330px}
        .vei-hero-art img{max-height:370px}
        .vei-feature-row{margin-top:36px}
        .vei-explainer{padding:60px 30px 42px}
      }
      @media (max-width:700px){
        .hero.vei-hero{padding:112px 0 48px}
        .vei-hero h1{font-size:clamp(44px,13vw,62px);letter-spacing:-3px}
        .vei-hero-copy>p{font-size:14px}
        .vei-feature-row{grid-template-columns:1fr}
        .vei-mini-card{min-height:0}
        .vei-hero-art{min-height:270px}
        .vei-hero-art img{max-height:300px}
        .vei-explainer-wrap{width:calc(100% - 16px);padding:8px;margin-bottom:54px}
        .vei-explainer{padding:46px 18px 26px;border-radius:26px}
        .vei-explainer h2{font-size:clamp(34px,10vw,48px);letter-spacing:-2px}
        .vei-explainer-head p,.vei-explainer-intro{font-size:13px}
        .vei-explainer-intro{padding:18px}
        .vei-explainer-grid{grid-template-columns:1fr}
      }
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

  const loadLucide = () => {
    if (window.lucide) {
      window.lucide.createIcons();
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/lucide@0.468.0/dist/umd/lucide.min.js';
    script.defer = true;
    script.onload = () => window.lucide?.createIcons();
    document.head.appendChild(script);
  };

  const rebuildHero = () => {
    const hero = document.querySelector('#home.hero');
    if (!hero) return;

    hero.classList.add('vei-hero');
    hero.innerHTML = `
      <div class="hero-mesh"></div>
      <div class="vei-hero-grid">
        <div class="vei-hero-copy">
          <div class="vei-badge"><i data-lucide="shield-check"></i> VEICLOUD VPN · PRIVACIDAD Y VELOCIDAD</div>
          <h1>Tu conexión.<br><em>Tu espacio privado.</em></h1>
          <p>VeiCloud VPN cifra tu conexión y te permite navegar con una ruta estable, rápida y sencilla, sin llenar la experiencia de opciones innecesarias.</p>
          <div class="vei-hero-actions">
            <a class="button primary" href="${APK_URL}" download="VeiCloudVPN.apk"><i data-lucide="download" style="width:17px;height:17px;margin-right:9px"></i>Descargar para Android</a>
            <a class="button ghost" href="#product">Explorar VeiCloud</a>
          </div>
        </div>
        <div class="vei-hero-art">
          <img src="assets/hero-veicloud.webp" alt="VeiCloud VPN" loading="eager" decoding="async">
        </div>
      </div>
      <div class="vei-feature-row">
        <article class="vei-mini-card">
          <div class="vei-mini-icon"><i data-lucide="shield"></i></div>
          <strong>Privacidad por diseño</strong>
          <p>Una conexión cifrada pensada para proteger tu tráfico sin complicarte el día.</p>
        </article>
        <article class="vei-mini-card">
          <div class="vei-mini-icon"><i data-lucide="gauge"></i></div>
          <strong>Red rápida y estable</strong>
          <p>Rutas optimizadas para mantener una experiencia fluida al navegar, jugar o ver contenido.</p>
        </article>
        <article class="vei-mini-card">
          <div class="vei-mini-icon"><i data-lucide="monitor-smartphone"></i></div>
          <strong>Hasta 8 dispositivos</strong>
          <p>Elige el plan que mejor encaje contigo y protege tus dispositivos desde una sola cuenta.</p>
        </article>
      </div>
    `;
  };

  const buildExplainer = () => {
    const hero = document.querySelector('#home.hero');
    if (!hero || document.querySelector('.vei-explainer-wrap')) return;

    const wrap = document.createElement('section');
    wrap.className = 'vei-explainer-wrap';
    wrap.innerHTML = `
      <div class="vei-explainer">
        <div class="vei-explainer-head">
          <div class="vei-explainer-label"><i data-lucide="network"></i> Entender una VPN</div>
          <h2>¿Qué hace una VPN por ti?</h2>
          <p>Una VPN crea una conexión cifrada entre tu dispositivo e Internet. VeiCloud utiliza ese túnel para ayudarte a navegar con más privacidad y una ruta de red controlada.</p>
        </div>
        <div class="vei-explainer-intro">
          Tu tráfico viaja protegido dentro del túnel VPN y sale a Internet desde el servidor que selecciones. Eso reduce la exposición de tu dirección IP real en los servicios que visitas y añade una capa de protección cuando utilizas redes que no controlas.
        </div>
        <div class="vei-explainer-grid">
          <article class="vei-explainer-card">
            <div class="vei-explainer-icon"><i data-lucide="wifi"></i></div>
            <strong>Más tranquilidad en Wi‑Fi</strong>
            <p>Protege el tráfico que sale de tu dispositivo cuando utilizas redes públicas, hoteles, aeropuertos o cafeterías.</p>
          </article>
          <article class="vei-explainer-card">
            <div class="vei-explainer-icon"><i data-lucide="map-pin"></i></div>
            <strong>Elige tu ruta</strong>
            <p>Conéctate mediante una ubicación VeiCloud y cambia la ruta de salida de tu conexión cuando lo necesites.</p>
          </article>
          <article class="vei-explainer-card">
            <div class="vei-explainer-icon"><i data-lucide="eye-off"></i></div>
            <strong>Menos exposición</strong>
            <p>Los sitios que visitas ven la dirección IP del servidor VPN en lugar de utilizar directamente la IP de tu conexión.</p>
          </article>
        </div>
      </div>
    `;

    hero.insertAdjacentElement('afterend', wrap);
  };

  const wireDownloads = () => {
    const downloadSelectors = [
      '[data-i18n="nav.download"]',
      '[data-i18n="hero.download"]',
      '[data-i18n="download.button"]',
      '[data-i18n^="plans.choose"]',
      '.vei-hero-actions a[download]'
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
    rebuildHero();
    buildExplainer();
    revealContent();
    wireDownloads();
    forceMobileAccountAccess();
    wireInternalNavigation();
    wireCounters();
    improveExternalActions();
    loadLucide();
  });
})();
