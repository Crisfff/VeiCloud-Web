(() => {
  'use strict';

  const mountComparison = () => {
    const performance = document.querySelector('.vei-performance-section');
    if (!performance || document.querySelector('.vei-comparison-section')) return false;

    const section = document.createElement('section');
    section.className = 'vei-comparison-section';
    section.innerHTML = `
      <div class="vei-comparison-inner">
        <div class="vei-comparison-head">
          <div class="vei-comparison-copy">
            <span>Comparación clara</span>
            <h2>VeiCloud frente a una VPN gratuita.</h2>
            <p>Una VPN gratuita puede parecer suficiente al principio, pero normalmente implica más límites, menos soporte y menos control sobre cómo se usa tu conexión.</p>
          </div>
          <img src="assets/vpn-comparison.webp" alt="Comparación de VeiCloud VPN" loading="lazy" decoding="async">
        </div>

        <div class="vei-comparison-table" role="table" aria-label="Comparación VeiCloud y VPN gratuita">
          <div class="vei-comparison-row vei-comparison-header" role="row">
            <div></div>
            <strong>VeiCloud</strong>
            <strong>VPN gratuita</strong>
          </div>
          <div class="vei-comparison-row" role="row"><span>Velocidad</span><b>Alta y estable</b><em>Variable o limitada</em></div>
          <div class="vei-comparison-row" role="row"><span>Tráfico mensual</span><b>Ilimitado</b><em>Puede tener límites</em></div>
          <div class="vei-comparison-row" role="row"><span>Soporte</span><b>Ayuda disponible</b><em>Limitado o inexistente</em></div>
          <div class="vei-comparison-row" role="row"><span>Dispositivos compatibles</span><b>Windows, Android, TV y navegadores</b><em>Compatibilidad reducida</em></div>
          <div class="vei-comparison-row" role="row"><span>Privacidad</span><b>La actividad no es el producto</b><em>Modelo de datos menos claro</em></div>
          <div class="vei-comparison-row" role="row"><span>Conexiones simultáneas</span><b>Según tu plan</b><em>Normalmente limitadas</em></div>
        </div>
      </div>
    `;

    performance.insertAdjacentElement('afterend', section);

    if (!document.querySelector('#vei-comparison-styles')) {
      const style = document.createElement('style');
      style.id = 'vei-comparison-styles';
      style.textContent = `
        .vei-comparison-section{background:#0b121a;padding:96px 18px 110px;color:#fff}
        .vei-comparison-inner{width:min(1120px,100%);margin:auto}
        .vei-comparison-head{display:grid;grid-template-columns:minmax(0,1.15fr) minmax(260px,.85fr);gap:48px;align-items:center;margin-bottom:52px}
        .vei-comparison-copy span{display:inline-block;color:#ff8069;font:800 10px Manrope,sans-serif;letter-spacing:1.4px;text-transform:uppercase;margin-bottom:16px}
        .vei-comparison-copy h2{margin:0 0 16px;font:800 clamp(38px,5vw,62px)/1 Manrope,sans-serif;letter-spacing:-3px;color:#fff}
        .vei-comparison-copy p{margin:0;max-width:700px;color:#9eafbe;font-size:15px;line-height:1.75}
        .vei-comparison-head img{justify-self:end;width:min(100%,330px);max-height:240px;object-fit:contain;filter:drop-shadow(0 24px 38px rgba(0,0,0,.3))}
        .vei-comparison-table{background:#101923;border-radius:28px;overflow:hidden}
        .vei-comparison-row{display:grid;grid-template-columns:minmax(220px,1.3fr) minmax(220px,1fr) minmax(220px,1fr);align-items:center;min-height:74px;border-bottom:1px solid rgba(255,255,255,.055)}
        .vei-comparison-row:last-child{border-bottom:0}
        .vei-comparison-row>span,.vei-comparison-row>b,.vei-comparison-row>em,.vei-comparison-row>strong,.vei-comparison-row>div{padding:18px 24px}
        .vei-comparison-row>span{color:#d8e0e7;font-size:13px;font-weight:600}
        .vei-comparison-row>b{color:#fff;font-size:13px;font-style:normal;font-weight:700;background:rgba(255,67,37,.045)}
        .vei-comparison-row>em{color:#81909e;font-size:13px;font-style:normal}
        .vei-comparison-header{min-height:62px;background:#111d28}
        .vei-comparison-header strong{font:800 13px Manrope,sans-serif;color:#fff}
        .vei-comparison-header strong:first-of-type{color:#ff8069}
        @media(max-width:800px){.vei-comparison-head{grid-template-columns:1fr;text-align:center;gap:24px}.vei-comparison-head img{justify-self:center}.vei-comparison-copy p{margin-inline:auto}.vei-comparison-table{overflow-x:auto}.vei-comparison-row{min-width:720px}}
        @media(max-width:520px){.vei-comparison-section{padding:72px 14px 78px}.vei-comparison-copy h2{font-size:clamp(34px,10vw,46px);letter-spacing:-2px}.vei-comparison-copy p{font-size:13px}}
      `;
      document.head.appendChild(style);
    }

    return true;
  };

  document.addEventListener('DOMContentLoaded', () => {
    if (mountComparison()) return;
    const observer = new MutationObserver(() => {
      if (mountComparison()) observer.disconnect();
    });
    observer.observe(document.body, {childList:true, subtree:true});
    setTimeout(() => observer.disconnect(), 5000);
  });
})();
