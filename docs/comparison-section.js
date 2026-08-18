(() => {
  'use strict';

  const loadFinalFooter = () => {
    if (document.querySelector('script[data-vei-final-footer]')) return;
    const script = document.createElement('script');
    script.src = 'final-footer.js?v=20260818-2';
    script.defer = true;
    script.dataset.veiFinalFooter = '1';
    document.head.appendChild(script);
  };

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

        <div class="vei-comparison-faq">
          <div class="vei-comparison-faq-head">
            <span>Preguntas frecuentes</span>
            <h3>Lo importante, sin letra pequeña.</h3>
          </div>

          <div class="vei-comparison-faq-list">
            <details>
              <summary>¿Por qué necesito una VPN?<i></i></summary>
              <p>Una VPN cifra el tráfico entre tu dispositivo y el servidor VPN, reduce la exposición de tu dirección IP real y añade una capa de protección cuando utilizas redes que no controlas.</p>
            </details>
            <details>
              <summary>¿Qué hace diferente a VeiCloud?<i></i></summary>
              <p>VeiCloud busca una experiencia simple: conexión rápida, tráfico ilimitado, una interfaz clara y soporte para los dispositivos que utilizas, sin llenar la aplicación de funciones innecesarias.</p>
            </details>
            <details>
              <summary>¿Por qué elegir VeiCloud frente a una VPN gratuita?<i></i></summary>
              <p>Los servicios gratuitos suelen compensar sus costes con límites, publicidad, menor soporte o modelos de datos menos transparentes. VeiCloud funciona mediante una suscripción y centra el producto en el servicio VPN.</p>
            </details>
            <details>
              <summary>¿Es legal utilizar una VPN?<i></i></summary>
              <p>La legalidad depende del país y del uso que hagas del servicio. Una VPN no convierte en legal una actividad que ya sea ilegal, por lo que debes respetar las leyes aplicables donde te encuentres.</p>
            </details>
            <details>
              <summary>¿Qué dispositivos son compatibles con VeiCloud?<i></i></summary>
              <p>Actualmente la web muestra compatibilidad con Windows, Android, Android TV, Chrome, Firefox y Edge. La disponibilidad concreta de cada cliente puede variar según la plataforma.</p>
            </details>
            <details>
              <summary>¿Puedo usar mi suscripción en varios dispositivos?<i></i></summary>
              <p>Sí. El número de dispositivos simultáneos depende de tu plan: Standard incluye 1 dispositivo, Gold 3 y Premium hasta 8.</p>
            </details>
            <details>
              <summary>¿VeiCloud tiene límite mensual de datos?<i></i></summary>
              <p>No se aplica un límite mensual de tráfico por gigabytes. La velocidad real puede depender de tu conexión, ubicación, servidor y condiciones de red.</p>
            </details>
          </div>
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
        .vei-comparison-copy span,.vei-comparison-faq-head span{display:inline-block;color:#ff8069;font:800 10px Manrope,sans-serif;letter-spacing:1.4px;text-transform:uppercase;margin-bottom:16px}
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
        .vei-comparison-faq{margin-top:96px}
        .vei-comparison-faq-head{text-align:center;max-width:760px;margin:0 auto 34px}
        .vei-comparison-faq-head h3{margin:0;color:#fff;font:800 clamp(34px,4.6vw,54px)/1.02 Manrope,sans-serif;letter-spacing:-2.5px}
        .vei-comparison-faq-list{max-width:940px;margin:auto}
        .vei-comparison-faq-list details{border-bottom:1px solid rgba(255,255,255,.07)}
        .vei-comparison-faq-list summary{list-style:none;cursor:pointer;display:flex;align-items:center;justify-content:space-between;gap:24px;padding:24px 4px;color:#eef3f7;font:700 15px/1.4 Manrope,sans-serif}
        .vei-comparison-faq-list summary::-webkit-details-marker{display:none}
        .vei-comparison-faq-list summary i{position:relative;flex:0 0 22px;width:22px;height:22px}
        .vei-comparison-faq-list summary i::before,.vei-comparison-faq-list summary i::after{content:"";position:absolute;left:50%;top:50%;width:10px;height:2px;background:#8fa0ae;border-radius:2px;transition:transform .2s ease}
        .vei-comparison-faq-list summary i::before{transform:translate(-8px,-50%) rotate(45deg)}
        .vei-comparison-faq-list summary i::after{transform:translate(-2px,-50%) rotate(-45deg)}
        .vei-comparison-faq-list details[open] summary i::before{transform:translate(-8px,-50%) rotate(-45deg)}
        .vei-comparison-faq-list details[open] summary i::after{transform:translate(-2px,-50%) rotate(45deg)}
        .vei-comparison-faq-list details p{margin:0;padding:0 42px 24px 4px;color:#96a7b5;font-size:13px;line-height:1.75;max-width:860px}
        @media(max-width:800px){.vei-comparison-head{grid-template-columns:1fr;text-align:center;gap:24px}.vei-comparison-head img{justify-self:center}.vei-comparison-copy p{margin-inline:auto}.vei-comparison-table{overflow-x:auto}.vei-comparison-row{min-width:720px}.vei-comparison-faq{margin-top:72px}}
        @media(max-width:520px){.vei-comparison-section{padding:72px 14px 78px}.vei-comparison-copy h2{font-size:clamp(34px,10vw,46px);letter-spacing:-2px}.vei-comparison-copy p{font-size:13px}.vei-comparison-faq-head h3{font-size:clamp(30px,9vw,42px);letter-spacing:-2px}.vei-comparison-faq-list summary{font-size:14px;padding:20px 2px}.vei-comparison-faq-list details p{padding:0 34px 20px 2px;font-size:12px}}
      `;
      document.head.appendChild(style);
    }

    loadFinalFooter();
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
