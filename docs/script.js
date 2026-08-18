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

      .vei-explainer-wrap{width:100%;max-width:none;margin:0;padding:0}
      .vei-explainer{background:#0b121a;color:#f4f7fa;border-radius:0;padding:88px max(32px,calc((100vw - 1180px)/2)) 92px;box-shadow:none;overflow:hidden;position:relative}
      .vei-explainer::after{content:"";position:absolute;width:540px;height:540px;border-radius:50%;right:-170px;top:-210px;background:rgba(71,108,140,.12);pointer-events:none}
      .vei-explainer-head{text-align:center;max-width:820px;margin:0 auto 42px;position:relative;z-index:1}
      .vei-explainer-label{display:inline-flex;align-items:center;gap:8px;padding:7px 11px;border-radius:999px;background:rgba(96,137,171,.16);color:#dce8f2;font-size:10px;font-weight:800;letter-spacing:1.2px;text-transform:uppercase}
      .vei-explainer-label svg{width:14px;height:14px}
      .vei-explainer h2{font:800 clamp(38px,5vw,64px)/1 Manrope,sans-serif;letter-spacing:-3px;margin:18px 0;color:#fff}
      .vei-explainer-head p{margin:0 auto;color:#aebdcc;max-width:760px;font-size:15px;line-height:1.75}
      .vei-explainer-intro{max-width:1000px;margin:0 auto 34px;padding:22px 24px;border-radius:22px;background:#111d28;color:#c9d6e1;font-size:14px;line-height:1.7}
      .vei-explainer-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;max-width:1040px;margin:0 auto;position:relative;z-index:1}
      .vei-explainer-card{padding:26px 24px 28px;border-radius:24px;background:#101923;text-align:center}
      .vei-explainer-icon{width:48px;height:48px;border-radius:15px;display:grid;place-items:center;margin:0 auto 17px;background:#182838;color:#ff8069}
      .vei-explainer-icon svg{width:23px;height:23px}
      .vei-explainer-card strong{display:block;font:700 17px Manrope,sans-serif;margin-bottom:10px;color:#fff}
      .vei-explainer-card p{margin:0;color:#aab8c5;font-size:13px;line-height:1.65}

      .vei-privacy{max-width:1120px;margin:92px auto 0;position:relative;z-index:1}
      .vei-privacy-head{text-align:center;max-width:760px;margin:0 auto 42px}
      .vei-privacy-kicker{display:inline-flex;align-items:center;gap:8px;padding:7px 11px;border-radius:999px;background:rgba(255,67,37,.09);color:#ff8069;font-size:10px;font-weight:800;letter-spacing:1.2px;text-transform:uppercase}
      .vei-privacy-kicker svg{width:14px;height:14px}
      .vei-privacy h3{font:800 clamp(34px,4.6vw,58px)/1 Manrope,sans-serif;letter-spacing:-2.8px;margin:18px 0 14px;color:#fff}
      .vei-privacy-head p{margin:0;color:#9eafbe;font-size:15px;line-height:1.7}
      .vei-privacy-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:20px}
      .vei-privacy-card{position:relative;min-height:540px;padding:34px 34px 0;border-radius:30px;background:#111a24;overflow:hidden;display:flex;flex-direction:column}
      .vei-privacy-card small{font-size:10px;letter-spacing:1.3px;text-transform:uppercase;color:#ff8069;font-weight:800}
      .vei-privacy-card h4{font:700 clamp(24px,2.5vw,34px)/1.12 Manrope,sans-serif;margin:12px 0 14px;color:#fff;letter-spacing:-1px}
      .vei-privacy-card p{margin:0;color:#a8b6c2;font-size:14px;line-height:1.72;max-width:500px}
      .vei-privacy-art{margin-top:auto;min-height:260px;display:flex;align-items:flex-end;justify-content:center;padding-top:20px}
      .vei-privacy-art img{width:min(100%,430px);max-height:300px;object-fit:contain;display:block;filter:drop-shadow(0 24px 42px rgba(0,0,0,.32))}

      .vei-protocol{max-width:1120px;margin:96px auto 0;display:grid;grid-template-columns:minmax(0,.9fr) minmax(420px,1.1fr);gap:54px;align-items:center;position:relative;z-index:1}
      .vei-protocol-copy small{display:inline-flex;align-items:center;gap:8px;color:#ff8069;font-size:10px;font-weight:800;letter-spacing:1.3px;text-transform:uppercase}
      .vei-protocol-copy small svg{width:15px;height:15px}
      .vei-protocol-copy h3{font:800 clamp(36px,4.4vw,58px)/1.02 Manrope,sans-serif;letter-spacing:-2.7px;color:#fff;margin:16px 0 18px}
      .vei-protocol-copy p{margin:0;max-width:520px;color:#9eafbe;font-size:15px;line-height:1.75}
      .vei-wireguard-card{background:#111a24;border-radius:30px;padding:34px;min-height:250px;display:flex;align-items:center;gap:28px}
      .vei-wg-logo{flex:0 0 94px;width:94px;height:94px;border-radius:50%;display:grid;place-items:center;background:#9f2d26;color:#fff;box-shadow:inset 0 0 0 8px rgba(255,255,255,.04)}
      .vei-wg-logo span{font:800 42px/1 Manrope,sans-serif;letter-spacing:-4px;transform:translateX(-2px)}
      .vei-wg-body strong{display:block;font:800 28px/1.05 Manrope,sans-serif;color:#fff;margin-bottom:12px}
      .vei-wg-body p{margin:0;color:#a8b6c2;font-size:14px;line-height:1.65}
      .vei-wg-tags{display:flex;gap:8px;flex-wrap:wrap;margin-top:20px}
      .vei-wg-tags span{padding:7px 10px;border-radius:999px;background:#182838;color:#c9d6e1;font-size:10px;font-weight:700;letter-spacing:.4px}
      .marquee{display:none!important}

      @media (max-width:900px){
        .vei-hero-grid{grid-template-columns:1fr;gap:28px}
        .vei-hero-copy{text-align:center;margin:auto}
        .vei-badge{margin-inline:auto}
        .vei-hero-actions{justify-content:center}
        .vei-hero-art{min-height:330px}
        .vei-hero-art img{max-height:370px}
        .vei-feature-row{margin-top:36px}
        .vei-explainer{padding:64px 30px 70px}
        .vei-privacy{margin-top:70px}
        .vei-protocol{grid-template-columns:1fr;gap:28px;margin-top:72px}
      }
      @media (max-width:700px){
        .hero.vei-hero{padding:112px 0 48px}
        .vei-hero h1{font-size:clamp(44px,13vw,62px);letter-spacing:-3px}
        .vei-hero-copy>p{font-size:14px}
        .vei-feature-row{grid-template-columns:1fr}
        .vei-mini-card{min-height:0}
        .vei-hero-art{min-height:270px}
        .vei-hero-art img{max-height:300px}
        .vei-explainer-wrap{width:100%;padding:0;margin:0}
        .vei-explainer{padding:50px 18px 56px;border-radius:0}
        .vei-explainer h2{font-size:clamp(34px,10vw,48px);letter-spacing:-2px}
        .vei-explainer-head p,.vei-explainer-intro{font-size:13px}
        .vei-explainer-intro{padding:18px}
        .vei-explainer-grid,.vei-privacy-grid{grid-template-columns:1fr}
        .vei-privacy{margin-top:58px}
        .vei-privacy h3{font-size:clamp(32px,9vw,44px);letter-spacing:-2px}
        .vei-privacy-card{min-height:460px;padding:26px 24px 0;border-radius:24px}
        .vei-privacy-card p{font-size:13px}
        .vei-privacy-art{min-height:220px}
        .vei-privacy-art img{max-height:250px}
        .vei-protocol{margin-top:60px}
        .vei-protocol-copy h3{font-size:clamp(32px,9vw,44px);letter-spacing:-2px}
        .vei-protocol-copy p{font-size:13px}
        .vei-wireguard-card{padding:24px;border-radius:24px;min-height:0;align-items:flex-start}
        .vei-wg-logo{width:70px;height:70px;flex-basis:70px}
        .vei-wg-logo span{font-size:32px}
        .vei-wg-body strong{font-size:24px}
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
        <article class="vei-mini-card"><div class="vei-mini-icon"><i data-lucide="shield"></i></div><strong>Privacidad por diseño</strong><p>Una conexión cifrada pensada para proteger tu tráfico sin complicarte el día.</p></article>
        <article class="vei-mini-card"><div class="vei-mini-icon"><i data-lucide="gauge"></i></div><strong>Red rápida y estable</strong><p>Rutas optimizadas para mantener una experiencia fluida al navegar, jugar o ver contenido.</p></article>
        <article class="vei-mini-card"><div class="vei-mini-icon"><i data-lucide="monitor-smartphone"></i></div><strong>Hasta 8 dispositivos</strong><p>Elige el plan que mejor encaje contigo y protege tus dispositivos desde una sola cuenta.</p></article>
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
        <div class="vei-explainer-intro">Tu tráfico viaja protegido dentro del túnel VPN y sale a Internet desde el servidor que selecciones. Eso reduce la exposición de tu dirección IP real en los servicios que visitas y añade una capa de protección cuando utilizas redes que no controlas.</div>
        <div class="vei-explainer-grid">
          <article class="vei-explainer-card"><div class="vei-explainer-icon"><i data-lucide="wifi"></i></div><strong>Más tranquilidad en Wi‑Fi</strong><p>Protege el tráfico que sale de tu dispositivo cuando utilizas redes públicas, hoteles, aeropuertos o cafeterías.</p></article>
          <article class="vei-explainer-card"><div class="vei-explainer-icon"><i data-lucide="map-pin"></i></div><strong>Elige tu ruta</strong><p>Conéctate mediante una ubicación VeiCloud y cambia la ruta de salida de tu conexión cuando lo necesites.</p></article>
          <article class="vei-explainer-card"><div class="vei-explainer-icon"><i data-lucide="eye-off"></i></div><strong>Menos exposición</strong><p>Los sitios que visitas ven la dirección IP del servidor VPN en lugar de utilizar directamente la IP de tu conexión.</p></article>
        </div>
        <div class="vei-privacy">
          <div class="vei-privacy-head">
            <div class="vei-privacy-kicker"><i data-lucide="shield-check"></i> Privacidad primero</div>
            <h3>Tu privacidad no es el producto.</h3>
            <p>VeiCloud está pensado para darte una conexión privada y clara, sin convertir tu actividad en una fuente de ingresos.</p>
          </div>
          <div class="vei-privacy-grid">
            <article class="vei-privacy-card">
              <small>Protección de conexión</small>
              <h4>Tu tráfico, protegido.</h4>
              <p>Cuando te conectas a VeiCloud, tu tráfico viaja por un túnel cifrado entre tu dispositivo y el servidor VPN. La seguridad sucede en segundo plano, sin obligarte a gestionar una montaña de ajustes.</p>
              <div class="vei-privacy-art"><img src="assets/privacy-protected.webp" alt="Protección de conexión VeiCloud" loading="lazy" decoding="async"></div>
            </article>
            <article class="vei-privacy-card">
              <small>Datos personales</small>
              <h4>Tus datos siguen siendo tuyos.</h4>
              <p>El servicio está diseñado alrededor de la conexión VPN, no alrededor de perfilar tu navegación. Tu experiencia no depende de vender información personal ni de llenar la aplicación de publicidad.</p>
              <div class="vei-privacy-art"><img src="assets/privacy-data.webp" alt="Privacidad de datos VeiCloud" loading="lazy" decoding="async"></div>
            </article>
          </div>
        </div>
        <div class="vei-protocol">
          <div class="vei-protocol-copy">
            <small><i data-lucide="cpu"></i> Tecnología de conexión</small>
            <h3>Una base moderna para tu túnel VPN.</h3>
            <p>VeiCloud utiliza WireGuard como base de conexión: una arquitectura compacta pensada para ofrecer una experiencia rápida, estable y sencilla sin añadir protocolos que no necesitas.</p>
          </div>
          <article class="vei-wireguard-card">
            <div class="vei-wg-logo" aria-hidden="true"><span>W</span></div>
            <div class="vei-wg-body">
              <strong>WireGuard</strong>
              <p>Un protocolo moderno y ligero que prioriza simplicidad, rendimiento y criptografía actual.</p>
              <div class="vei-wg-tags"><span>Rápido</span><span>Ligero</span><span>Seguro</span></div>
            </div>
          </article>
        </div>
      </div>
    `;
    hero.insertAdjacentElement('afterend', wrap);
  };

  const wireDownloads = () => {
    document.querySelectorAll('[data-i18n="nav.download"],[data-i18n="hero.download"],[data-i18n="download.button"],[data-i18n^="plans.choose"],.vei-hero-actions a[download]').forEach(link => {
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
        languageSwitcher?.style.setProperty('display', 'none', 'important');
        navDownload?.style.setProperty('display', 'none', 'important');
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
        if (!targetId || targetId === '#') { event.preventDefault(); return; }
        const target = document.querySelector(targetId);
        if (!target) return;
        event.preventDefault();
        target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
      });
    });
  };

  const revealContent = () => {
    document.querySelectorAll('.reveal').forEach(el => { el.style.opacity = '1'; el.style.transform = 'none'; });
  };

  const wireCounters = () => {
    const counters = [...document.querySelectorAll('[data-count]')];
    if (!counters.length) return;
    const showValue = el => {
      const target = Number(el.dataset.count || 0);
      if (reduceMotion) { el.textContent = String(target); return; }
      const duration = 650;
      const start = performance.now();
      const tick = now => {
        const progress = Math.min((now - start) / duration, 1);
        el.textContent = String(Math.round(target * progress));
        if (progress < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };
    if (!('IntersectionObserver' in window)) { counters.forEach(showValue); return; }
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
    document.querySelectorAll('a[href="portal.html"]').forEach(link => link.setAttribute('aria-label', link.textContent.trim() || 'Mi cuenta'));
    document.querySelectorAll('.legal-card').forEach(link => link.setAttribute('aria-label', link.querySelector('strong')?.textContent?.trim() || 'Documento legal'));
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