(() => {
  'use strict';

  const setupHeaderControls = () => {
    const navTools = document.querySelector('.nav-tools');
    const languageSwitcher = document.querySelector('.language-switcher');
    const account = document.querySelector('.account-nav-button');
    const download = document.querySelector('.nav-download');
    if (!navTools || !languageSwitcher || !account || !download) return;

    account.textContent = 'Acceder';
    account.classList.add('vei-account-link');

    if (!languageSwitcher.querySelector('.vei-language-toggle')) {
      const toggle = document.createElement('button');
      toggle.type = 'button';
      toggle.className = 'vei-language-toggle';
      toggle.setAttribute('aria-label', 'Cambiar idioma');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"></circle><path d="M3 12h18M12 3c2.6 2.4 4 5.5 4 9s-1.4 6.6-4 9c-2.6-2.4-4-5.5-4-9s1.4-6.6 4-9Z"></path></svg>`;
      languageSwitcher.prepend(toggle);
      const labels = { es: 'Español', ru: 'Русский', en: 'English' };
      languageSwitcher.querySelectorAll('[data-lang]').forEach((button) => {
        button.textContent = labels[button.dataset.lang] || button.dataset.lang.toUpperCase();
        button.classList.add('vei-language-option');
        button.addEventListener('click', () => { languageSwitcher.classList.remove('is-open'); toggle.setAttribute('aria-expanded', 'false'); });
      });
      toggle.addEventListener('click', (event) => {
        event.stopPropagation();
        const open = languageSwitcher.classList.toggle('is-open');
        document.querySelector('.vei-download-wrap')?.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
    }

    if (!document.querySelector('.vei-download-wrap')) {
      const wrap = document.createElement('div');
      wrap.className = 'vei-download-wrap';
      download.insertAdjacentElement('beforebegin', wrap);
      wrap.appendChild(download);
      download.removeAttribute('download'); download.removeAttribute('href');
      download.setAttribute('role', 'button'); download.setAttribute('tabindex', '0'); download.setAttribute('aria-expanded', 'false');
      download.classList.add('vei-download-toggle');
      download.innerHTML = `Descargar <span class="vei-download-chevron" aria-hidden="true">⌄</span>`;
      const menu = document.createElement('div');
      menu.className = 'vei-download-menu';
      menu.innerHTML = `<div class="vei-download-title">Disponible para</div><div class="vei-download-grid"><div class="vei-download-item is-static"><img src="assets/platforms/windows.webp" alt="Windows"><span>Windows</span></div><a class="vei-download-item" href="/download/VeiCloudVPN.apk" download="VeiCloudVPN.apk"><img src="assets/platforms/android.webp.png" alt="Android"><span>Android</span></a><a class="vei-download-item" href="/download/VeiCloudVPN.apk" download="VeiCloudVPN.apk"><img src="assets/platforms/android-tv.webp.png" alt="Android TV"><span>Android TV</span></a><div class="vei-download-item is-static"><img src="assets/platforms/chrome.webp.png" alt="Chrome"><span>Chrome</span></div><div class="vei-download-item is-static"><img src="assets/platforms/firefox.webp.png" alt="Firefox"><span>Firefox</span></div><div class="vei-download-item is-static"><img src="assets/platforms/edge.webp.png" alt="Edge"><span>Edge</span></div></div>`;
      wrap.appendChild(menu);
      const toggleDownload = (event) => { event.preventDefault(); event.stopPropagation(); const open = wrap.classList.toggle('is-open'); languageSwitcher.classList.remove('is-open'); download.setAttribute('aria-expanded', open ? 'true' : 'false'); };
      download.addEventListener('click', toggleDownload);
      download.addEventListener('keydown', (event) => { if (event.key === 'Enter' || event.key === ' ') toggleDownload(event); });
    }

    if (!document.documentElement.dataset.veiHeaderGlobalListeners) {
      document.documentElement.dataset.veiHeaderGlobalListeners = '1';
      document.addEventListener('click', (event) => { const language = document.querySelector('.language-switcher'); const downloadWrap = document.querySelector('.vei-download-wrap'); if (language && !language.contains(event.target)) language.classList.remove('is-open'); if (downloadWrap && !downloadWrap.contains(event.target)) downloadWrap.classList.remove('is-open'); });
      document.addEventListener('keydown', (event) => { if (event.key !== 'Escape') return; document.querySelector('.language-switcher')?.classList.remove('is-open'); document.querySelector('.vei-download-wrap')?.classList.remove('is-open'); });
    }

    if (!document.querySelector('#vei-header-controls-styles')) {
      const style = document.createElement('style'); style.id = 'vei-header-controls-styles';
      style.textContent = `
        .nav-tools{position:relative;gap:18px!important;align-items:center!important}
        .account-nav-button.vei-account-link{background:transparent!important;border:0!important;box-shadow:none!important;padding:8px 0!important;border-radius:0!important;color:#fff!important;font:700 13px Manrope,sans-serif!important;white-space:nowrap}
        .account-nav-button.vei-account-link:hover{color:#ff8069!important;transform:none!important}
        .language-switcher{position:relative!important;display:flex!important;align-items:center!important;background:transparent!important;border:0!important;padding:0!important;box-shadow:none!important;overflow:visible!important}
        .vei-language-toggle{width:38px!important;height:38px!important;padding:0!important;border:0!important;border-radius:50%!important;background:transparent!important;color:#fff!important;display:grid!important;place-items:center!important;cursor:pointer!important;transition:background .2s ease,color .2s ease!important}
        .vei-language-toggle:hover,.language-switcher.is-open .vei-language-toggle{background:rgba(255,255,255,.06)!important;color:#ff8069!important}.vei-language-toggle svg{width:21px;height:21px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
        .vei-language-option{position:absolute!important;right:0!important;width:210px!important;height:auto!important;min-height:46px!important;padding:12px 18px!important;margin:0!important;border:0!important;border-radius:10px!important;background:transparent!important;color:#dce5ed!important;text-align:left!important;justify-content:flex-start!important;font:600 14px Manrope,sans-serif!important;opacity:0!important;visibility:hidden!important;pointer-events:none!important;transform:translateY(-6px)!important;transition:opacity .16s ease,transform .16s ease,background .16s ease,color .16s ease!important;z-index:102!important}
        .vei-language-option[data-lang="es"]{top:54px!important}.vei-language-option[data-lang="ru"]{top:100px!important}.vei-language-option[data-lang="en"]{top:146px!important}.language-switcher::after{content:"";position:absolute;right:-10px;top:44px;width:230px;height:166px;border-radius:20px;background:#0b141d;border:1px solid rgba(255,255,255,.07);box-shadow:0 24px 60px rgba(0,0,0,.48);opacity:0;visibility:hidden;transform:translateY(-8px) scale(.98);transform-origin:top right;transition:opacity .16s ease,transform .16s ease,visibility .16s;z-index:100}.language-switcher.is-open::after{opacity:1;visibility:visible;transform:translateY(0) scale(1)}.language-switcher.is-open .vei-language-option{opacity:1!important;visibility:visible!important;pointer-events:auto!important;transform:translateY(0)!important}.vei-language-option:hover{background:#111f2b!important;color:#fff!important}.vei-language-option.active{color:#ff8069!important;background:rgba(255,67,37,.07)!important}
        .vei-download-wrap{position:relative;display:flex;align-items:center;margin-left:13px}.vei-download-wrap::before{content:"";position:absolute;left:-16px;top:50%;width:1px;height:22px;background:rgba(255,255,255,.24);transform:translateY(-50%)}
        .nav-download.vei-download-toggle{background:transparent!important;border:0!important;box-shadow:none!important;padding:8px 0!important;border-radius:0!important;color:#fff!important;font:700 13px Manrope,sans-serif!important;cursor:pointer!important;white-space:nowrap;overflow:visible!important;display:inline-flex!important;align-items:center!important;line-height:1!important}
        .nav-download.vei-download-toggle:hover{color:#ff8069!important;transform:none!important}.vei-download-chevron{display:inline-flex!important;align-items:center!important;justify-content:center!important;margin-left:6px!important;font-size:14px!important;line-height:1!important;height:14px!important;transform:translateY(-1px);transform-origin:center;transition:transform .18s ease}.vei-download-wrap.is-open .vei-download-chevron{transform:translateY(-1px) rotate(180deg)}
        .vei-download-menu{position:absolute;right:0;top:48px;width:520px;padding:22px;border-radius:22px;background:#0b141d;border:1px solid rgba(255,255,255,.07);box-shadow:0 28px 70px rgba(0,0,0,.52);opacity:0;visibility:hidden;pointer-events:none;transform:translateY(-8px) scale(.985);transform-origin:top right;transition:opacity .17s ease,transform .17s ease,visibility .17s;z-index:120}.vei-download-wrap.is-open .vei-download-menu{opacity:1;visibility:visible;pointer-events:auto;transform:translateY(0) scale(1)}.vei-download-title{font:800 10px Manrope,sans-serif;letter-spacing:1.5px;text-transform:uppercase;color:#ff8069;margin:2px 4px 16px}.vei-download-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}.vei-download-item{min-height:74px;border-radius:16px;background:#101c27;display:flex;align-items:center;gap:12px;padding:14px;color:#eaf0f5;transition:background .16s ease,transform .16s ease}.vei-download-item:not(.is-static):hover{background:#152634;transform:translateY(-1px)}.vei-download-item.is-static{cursor:default}.vei-download-item img{width:28px;height:28px;object-fit:contain;flex:0 0 auto}.vei-download-item span{font:700 12px Manrope,sans-serif}
        @media(max-width:720px){.nav-tools{gap:11px!important}.vei-download-wrap{margin-left:10px}.vei-download-wrap::before{left:-11px;height:19px}.account-nav-button.vei-account-link,.nav-download.vei-download-toggle{font-size:12px!important}.vei-download-menu{right:-8px;width:min(92vw,430px)}.vei-download-grid{grid-template-columns:repeat(2,1fr)}.language-switcher::after{right:-4px;width:205px}.vei-language-option{width:185px!important}}@media(max-width:430px){.vei-download-menu{padding:16px}.vei-download-item{min-height:64px;padding:11px}.vei-download-item img{width:24px;height:24px}.vei-download-item span{font-size:11px}}
      `; document.head.appendChild(style);
    }
  };

  const buildFinalFooter = () => {
    const comparison = document.querySelector('.vei-comparison-section'); const footer = document.querySelector('footer'); if (!comparison || !footer) return false;
    setupHeaderControls(); document.querySelectorAll('.section.product, .section.network, .section.plans, section.download, .section.faq, .section.compliance').forEach((el) => el.remove());
    let node = comparison.nextElementSibling; while (node) { const next = node.nextElementSibling; node.remove(); node = next; }
    const devices = document.querySelector('.vei-devices-section'); const faq = document.querySelector('.vei-comparison-faq'); if (devices) devices.id = 'devices'; comparison.id = 'compare'; if (faq) faq.id = 'faq';
    const nav = document.querySelector('.nav nav'); if (nav) nav.innerHTML = `<a href="#home">Inicio</a><a href="#devices">Dispositivos</a><a href="#compare">Comparar</a><a href="#faq">FAQ</a>`;
    const explore = document.querySelector('.vei-hero-actions .ghost'); if (explore) { explore.href = '#devices'; explore.textContent = 'Explorar VeiCloud'; }
    footer.className = 'vei-final-footer'; footer.innerHTML = `<div class="vei-footer-inner"><div class="vei-footer-top"><a class="vei-footer-brand" href="#home" aria-label="VeiCloud VPN"><img class="vei-footer-logo-img" src="assets/veicloud-logo.png" alt="VeiCloud"><span><strong>VeiCloud</strong><small>VPN</small></span></a><p>Privacidad, velocidad y una experiencia sencilla en tus dispositivos compatibles.</p></div><div class="vei-footer-columns"><div class="vei-footer-column"><strong>VeiCloud</strong><a href="#home">Inicio</a><a href="#devices">Dispositivos</a><a href="#compare">VeiCloud vs VPN gratuita</a><a href="/download/VeiCloudVPN.apk" download="VeiCloudVPN.apk">Descargar para Android</a></div><div class="vei-footer-column"><strong>Ayuda</strong><a href="#faq">Preguntas frecuentes</a><a href="contacts.html">Contacto y soporte</a><a href="portal.html">Mi cuenta</a></div><div class="vei-footer-column"><strong>Legal</strong><a href="offer.html">Oferta pública</a><a href="privacy.html">Política de privacidad</a><a href="refund.html">Cancelación y reembolsos</a><a href="contacts.html">Información de contacto</a></div></div><div class="vei-footer-platforms" aria-label="Plataformas compatibles"><div title="Windows"><img src="assets/platforms/windows.webp" alt="Windows"></div><div title="Android"><img src="assets/platforms/android.webp.png" alt="Android"></div><div title="Android TV"><img src="assets/platforms/android-tv.webp.png" alt="Android TV"></div><div title="Chrome"><img src="assets/platforms/chrome.webp.png" alt="Chrome"></div><div title="Firefox"><img src="assets/platforms/firefox.webp.png" alt="Firefox"></div><div title="Edge"><img src="assets/platforms/edge.webp.png" alt="Edge"></div></div><div class="vei-footer-bottom"><span>© 2026 VeiCloud VPN</span><span>Servicio digital · Sin entrega física</span></div></div>`;
    if (!document.querySelector('#vei-final-footer-styles')) { const style = document.createElement('style'); style.id = 'vei-final-footer-styles'; style.textContent = `.vei-final-footer{background:#080b10!important;border-top:1px solid rgba(255,255,255,.06)!important;padding:0!important;color:#fff}.vei-footer-inner{width:min(1120px,calc(100% - 36px));margin:auto;padding:58px 0 28px}.vei-footer-top{display:flex;align-items:center;justify-content:space-between;gap:30px;padding-bottom:38px;border-bottom:1px solid rgba(255,255,255,.07)}.vei-footer-brand{display:flex;align-items:center;gap:12px}.vei-footer-logo-img{width:44px;height:44px;object-fit:contain;display:block}.vei-footer-brand>span:last-child{display:flex;align-items:baseline;gap:7px}.vei-footer-brand strong{font:800 18px Manrope,sans-serif}.vei-footer-brand small{font-size:9px;letter-spacing:1.5px;color:#777f8a}.vei-footer-top p{max-width:520px;margin:0;color:#89919d;font-size:13px;line-height:1.65;text-align:right}.vei-footer-columns{display:grid;grid-template-columns:1.2fr 1fr 1fr;gap:58px;padding:42px 0}.vei-footer-column{display:flex;flex-direction:column;gap:12px}.vei-footer-column strong{font:800 10px Manrope,sans-serif;letter-spacing:1.5px;text-transform:uppercase;color:#ff8069;margin-bottom:5px}.vei-footer-column a{font-size:13px;color:#aab0ba;transition:.2s}.vei-footer-column a:hover{color:#fff}.vei-footer-platforms{display:grid;grid-template-columns:repeat(6,42px);justify-content:center;gap:18px;padding:22px 0;border-top:1px solid rgba(255,255,255,.07);border-bottom:1px solid rgba(255,255,255,.07)}.vei-footer-platforms div{width:42px;height:42px;display:grid;place-items:center;border-radius:13px;background:rgba(255,255,255,.025)}.vei-footer-platforms img{width:22px;height:22px;object-fit:contain}.vei-footer-bottom{display:flex;align-items:center;justify-content:space-between;gap:20px;padding-top:24px;color:#69717c;font-size:10px}@media(max-width:760px){.vei-footer-inner{width:min(100% - 28px,1120px);padding-top:44px}.vei-footer-top{align-items:flex-start;flex-direction:column}.vei-footer-top p{text-align:left}.vei-footer-columns{grid-template-columns:1fr 1fr;gap:32px}.vei-footer-platforms{grid-template-columns:repeat(3,42px);row-gap:18px}.vei-footer-bottom{flex-direction:column;align-items:flex-start}}@media(max-width:480px){.vei-footer-columns{grid-template-columns:1fr}.vei-footer-platforms{grid-template-columns:repeat(3,42px)}}`; document.head.appendChild(style); }
    return true;
  };

  const start = () => { setupHeaderControls(); if (buildFinalFooter()) return; const observer = new MutationObserver(() => { setupHeaderControls(); if (buildFinalFooter()) observer.disconnect(); }); observer.observe(document.body, { childList: true, subtree: true }); setTimeout(() => observer.disconnect(), 7000); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true }); else start();
})();