(() => {
  'use strict';

  const buildFinalFooter = () => {
    const comparison = document.querySelector('.vei-comparison-section');
    const footer = document.querySelector('footer');
    if (!comparison || !footer) return false;

    // Remove the old homepage sections explicitly.
    document.querySelectorAll('.section.product, .section.network, .section.plans, section.download, .section.faq, .section.compliance').forEach((el) => el.remove());

    // Remove any remaining legacy section that sits after the new comparison block.
    let node = comparison.nextElementSibling;
    while (node) {
      const next = node.nextElementSibling;
      node.remove();
      node = next;
    }

    const devices = document.querySelector('.vei-devices-section');
    const faq = document.querySelector('.vei-comparison-faq');
    if (devices) devices.id = 'devices';
    comparison.id = 'compare';
    if (faq) faq.id = 'faq';

    const nav = document.querySelector('.nav nav');
    if (nav) {
      nav.innerHTML = `
        <a href="#home">Inicio</a>
        <a href="#devices">Dispositivos</a>
        <a href="#compare">Comparar</a>
        <a href="#faq">FAQ</a>
      `;
    }

    const explore = document.querySelector('.vei-hero-actions .ghost');
    if (explore) {
      explore.href = '#devices';
      explore.textContent = 'Explorar VeiCloud';
    }

    footer.className = 'vei-final-footer';
    footer.innerHTML = `
      <div class="vei-footer-inner">
        <div class="vei-footer-top">
          <a class="vei-footer-brand" href="#home" aria-label="VeiCloud VPN">
            <span class="vei-footer-logo">V</span>
            <span><strong>VeiCloud</strong><small>VPN</small></span>
          </a>
          <p>Privacidad, velocidad y una experiencia sencilla en tus dispositivos compatibles.</p>
        </div>

        <div class="vei-footer-columns">
          <div class="vei-footer-column">
            <strong>VeiCloud</strong>
            <a href="#home">Inicio</a>
            <a href="#devices">Dispositivos</a>
            <a href="#compare">VeiCloud vs VPN gratuita</a>
            <a href="/download/VeiCloudVPN.apk" download="VeiCloudVPN.apk">Descargar para Android</a>
          </div>
          <div class="vei-footer-column">
            <strong>Ayuda</strong>
            <a href="#faq">Preguntas frecuentes</a>
            <a href="contacts.html">Contacto y soporte</a>
            <a href="portal.html">Mi cuenta</a>
          </div>
          <div class="vei-footer-column">
            <strong>Legal</strong>
            <a href="offer.html">Oferta pública</a>
            <a href="privacy.html">Política de privacidad</a>
            <a href="refund.html">Cancelación y reembolsos</a>
            <a href="contacts.html">Información de contacto</a>
          </div>
        </div>

        <div class="vei-footer-platforms" aria-label="Plataformas compatibles">
          <div><img src="assets/platforms/windows.webp" alt="Windows"><span>Windows</span></div>
          <div><img src="assets/platforms/android.webp.png" alt="Android"><span>Android</span></div>
          <div><img src="assets/platforms/android-tv.webp.png" alt="Android TV"><span>Android TV</span></div>
          <div><img src="assets/platforms/chrome.webp.png" alt="Chrome"><span>Chrome</span></div>
          <div><img src="assets/platforms/firefox.webp.png" alt="Firefox"><span>Firefox</span></div>
          <div><img src="assets/platforms/edge.webp.png" alt="Edge"><span>Edge</span></div>
        </div>

        <div class="vei-footer-bottom">
          <span>© 2026 VeiCloud VPN</span>
          <span>Servicio digital · Sin entrega física</span>
        </div>
      </div>
    `;

    if (!document.querySelector('#vei-final-footer-styles')) {
      const style = document.createElement('style');
      style.id = 'vei-final-footer-styles';
      style.textContent = `
        .vei-final-footer{background:#080b10!important;border-top:1px solid rgba(255,255,255,.06)!important;padding:0!important;color:#fff}
        .vei-footer-inner{width:min(1120px,calc(100% - 36px));margin:auto;padding:58px 0 28px}
        .vei-footer-top{display:flex;align-items:center;justify-content:space-between;gap:30px;padding-bottom:38px;border-bottom:1px solid rgba(255,255,255,.07)}
        .vei-footer-brand{display:flex;align-items:center;gap:12px}
        .vei-footer-logo{width:42px;height:42px;border-radius:13px;background:#ff4325;display:grid;place-items:center;font:800 22px Manrope,sans-serif;color:#fff}
        .vei-footer-brand>span:last-child{display:flex;align-items:baseline;gap:7px}.vei-footer-brand strong{font:800 18px Manrope,sans-serif}.vei-footer-brand small{font-size:9px;letter-spacing:1.5px;color:#777f8a}
        .vei-footer-top p{max-width:520px;margin:0;color:#89919d;font-size:13px;line-height:1.65;text-align:right}
        .vei-footer-columns{display:grid;grid-template-columns:1.2fr 1fr 1fr;gap:58px;padding:42px 0}
        .vei-footer-column{display:flex;flex-direction:column;gap:12px}.vei-footer-column strong{font:800 10px Manrope,sans-serif;letter-spacing:1.5px;text-transform:uppercase;color:#ff8069;margin-bottom:5px}.vei-footer-column a{font-size:13px;color:#aab0ba;transition:.2s}.vei-footer-column a:hover{color:#fff}
        .vei-footer-platforms{display:grid;grid-template-columns:repeat(6,1fr);gap:10px;padding:22px 0;border-top:1px solid rgba(255,255,255,.07);border-bottom:1px solid rgba(255,255,255,.07)}
        .vei-footer-platforms div{display:flex;align-items:center;justify-content:center;gap:9px;min-width:0}.vei-footer-platforms img{width:22px;height:22px;object-fit:contain}.vei-footer-platforms span{font:700 10px Manrope,sans-serif;color:#b8bdc5;white-space:nowrap}
        .vei-footer-bottom{display:flex;align-items:center;justify-content:space-between;gap:20px;padding-top:24px;color:#69717c;font-size:10px}
        @media(max-width:760px){.vei-footer-inner{width:min(100% - 28px,1120px);padding-top:44px}.vei-footer-top{align-items:flex-start;flex-direction:column}.vei-footer-top p{text-align:left}.vei-footer-columns{grid-template-columns:1fr 1fr;gap:32px}.vei-footer-platforms{grid-template-columns:repeat(3,1fr);row-gap:18px}.vei-footer-bottom{flex-direction:column;align-items:flex-start}}
        @media(max-width:480px){.vei-footer-columns{grid-template-columns:1fr}.vei-footer-platforms{grid-template-columns:repeat(2,1fr)}.vei-footer-platforms div{justify-content:flex-start}}
      `;
      document.head.appendChild(style);
    }

    return true;
  };

  const start = () => {
    if (buildFinalFooter()) return;
    const observer = new MutationObserver(() => {
      if (buildFinalFooter()) observer.disconnect();
    });
    observer.observe(document.body, { childList: true, subtree: true });
    setTimeout(() => observer.disconnect(), 7000);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();
