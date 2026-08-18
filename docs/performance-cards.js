(() => {
  'use strict';

  const mountPerformanceCards = () => {
    const devices = document.querySelector('.vei-devices-section');
    if (!devices || document.querySelector('.vei-performance-section')) return false;

    const section = document.createElement('section');
    section.className = 'vei-performance-section';
    section.innerHTML = `
      <div class="vei-performance-inner">
        <div class="vei-performance-grid">
          <article class="vei-performance-card">
            <div class="vei-performance-copy">
              <h3>Tráfico ilimitado</h3>
              <p>Navega, descarga y disfruta de tu conexión sin límites de tráfico. VeiCloud está pensado para acompañarte durante todo el mes sin contar cada gigabyte.</p>
            </div>
            <img src="assets/traffic-unlimited.webp" alt="Tráfico ilimitado con VeiCloud VPN" loading="lazy" decoding="async">
          </article>
          <article class="vei-performance-card">
            <div class="vei-performance-copy">
              <h3>Alta velocidad</h3>
              <p>Una red optimizada para mantener una conexión rápida y estable al navegar, ver contenido, descargar o jugar, según la ruta y el servidor disponibles.</p>
            </div>
            <img src="assets/speed-fast.webp" alt="Conexión rápida con VeiCloud VPN" loading="lazy" decoding="async">
          </article>
        </div>
      </div>
    `;

    devices.insertAdjacentElement('afterend', section);

    const style = document.createElement('style');
    style.id = 'vei-performance-card-styles';
    style.textContent = `
      .vei-performance-section{background:#050505;padding:0 18px 110px}
      .vei-performance-inner{width:min(1120px,100%);margin:auto}
      .vei-performance-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px}
      .vei-performance-card{position:relative;min-height:390px;padding:36px;border-radius:30px;background:#17191e;overflow:hidden;display:flex;flex-direction:column}
      .vei-performance-copy{position:relative;z-index:2;max-width:500px}
      .vei-performance-card h3{margin:0 0 16px;color:#fff;font:800 clamp(27px,3vw,38px)/1.05 Manrope,sans-serif;letter-spacing:-1.5px}
      .vei-performance-card p{margin:0;color:#9aa0aa;font-size:14px;line-height:1.72}
      .vei-performance-card img{position:absolute;right:18px;bottom:0;width:min(47%,280px);height:190px;object-fit:contain;object-position:right bottom;display:block}
      @media(max-width:800px){.vei-performance-grid{grid-template-columns:1fr}.vei-performance-card{min-height:350px}.vei-performance-card img{height:170px}}
      @media(max-width:520px){.vei-performance-section{padding:0 14px 78px}.vei-performance-card{padding:26px;min-height:330px;border-radius:24px}.vei-performance-card p{font-size:13px}.vei-performance-card img{width:52%;height:150px;right:10px}}
    `;
    document.head.appendChild(style);
    return true;
  };

  document.addEventListener('DOMContentLoaded', () => {
    if (mountPerformanceCards()) return;
    const observer = new MutationObserver(() => {
      if (mountPerformanceCards()) observer.disconnect();
    });
    observer.observe(document.body, {childList:true, subtree:true});
    setTimeout(() => observer.disconnect(), 5000);
  });
})();
