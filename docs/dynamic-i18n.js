(() => {
  'use strict';

  const STORAGE_KEY = 'veicloud-language-v2';

  const copy = {
    en: {
      heroBadge:'VEICLOUD VPN · PRIVACY AND SPEED', heroTitle:'Your connection.<br><em>Your private space.</em>', heroText:'VeiCloud VPN encrypts your connection and lets you browse through a stable, fast and simple route, without filling the experience with unnecessary options.', heroDownload:'Download for Android', heroExplore:'Explore VeiCloud',
      mini1Title:'Privacy by design', mini1Text:'An encrypted connection built to protect your traffic without complicating your day.', mini2Title:'Fast and stable network', mini2Text:'Optimized routes for a smooth experience while browsing, gaming or streaming.', mini3Title:'Up to 8 devices', mini3Text:'Choose the plan that fits you best and protect your devices from one account.',
      explainLabel:'Understanding a VPN', explainTitle:'What does a VPN do for you?', explainText:'A VPN creates an encrypted connection between your device and the Internet. VeiCloud uses that tunnel to help you browse with more privacy and a controlled network route.', explainIntro:'Your traffic travels protected inside the VPN tunnel and reaches the Internet from the server you select. This reduces exposure of your real IP address to the services you visit and adds protection when using networks you do not control.',
      ex1Title:'More peace of mind on Wi‑Fi', ex1Text:'Protect traffic leaving your device when using public networks, hotels, airports or cafés.', ex2Title:'Choose your route', ex2Text:'Connect through a VeiCloud location and change the exit route of your connection whenever you need.', ex3Title:'Less exposure', ex3Text:'Sites you visit see the VPN server IP address instead of directly using your connection IP.',
      privacyKick:'Privacy first', privacyTitle:'Your privacy is not the product.', privacyText:'VeiCloud is designed to give you a private and clear connection without turning your activity into a source of revenue.', p1Small:'Connection protection', p1Title:'Your traffic, protected.', p1Text:'When you connect to VeiCloud, your traffic travels through an encrypted tunnel between your device and the VPN server. Security happens in the background without forcing you to manage a mountain of settings.', p2Small:'Personal data', p2Title:'Your data stays yours.', p2Text:'The service is designed around the VPN connection, not around profiling your browsing. Your experience does not depend on selling personal information or filling the app with advertising.',
      protocolSmall:'Connection technology', protocolTitle:'A modern foundation for your VPN tunnel.', protocolText:'VeiCloud uses WireGuard as its connection foundation: a compact architecture built for a fast, stable and simple experience without adding protocols you do not need.', wgText:'A modern lightweight protocol focused on simplicity, performance and current cryptography.', wgTags:['Fast','Lightweight','Secure'],
      supportSmall:'VeiCloud support', supportTitle:'Clear help when you need it.', supportText:'If something does not connect, a configuration resists or you simply have a question, we want getting to a solution to be simple and free of unnecessary technical language.', s1Title:'Continuous support', s1Text:'A help point available when you have questions about your service or connection.', s2Title:'Clear explanations', s2Text:'Direct and understandable answers without turning every question into a networking class.', s3Title:'Configuration help', s3Text:'Guidance to get VeiCloud working correctly on your compatible devices.',
      devicesKick:'Across all your devices', devicesTitle:'One account. Your whole ecosystem.', devicesText:'Use VeiCloud on your main devices and keep a consistent experience without learning a different interface every time.', devicesPanelTitle:'VeiCloud where you need it.', devicesPanelText:'From your computer to your TV or browser, VeiCloud is designed to stay with your connection on the devices you use every day.'
    },
    es: {
      heroBadge:'VEICLOUD VPN · PRIVACIDAD Y VELOCIDAD', heroTitle:'Tu conexión.<br><em>Tu espacio privado.</em>', heroText:'VeiCloud VPN cifra tu conexión y te permite navegar con una ruta estable, rápida y sencilla, sin llenar la experiencia de opciones innecesarias.', heroDownload:'Descargar para Android', heroExplore:'Explorar VeiCloud',
      mini1Title:'Privacidad por diseño', mini1Text:'Una conexión cifrada pensada para proteger tu tráfico sin complicarte el día.', mini2Title:'Red rápida y estable', mini2Text:'Rutas optimizadas para mantener una experiencia fluida al navegar, jugar o ver contenido.', mini3Title:'Hasta 8 dispositivos', mini3Text:'Elige el plan que mejor encaje contigo y protege tus dispositivos desde una sola cuenta.',
      explainLabel:'Entender una VPN', explainTitle:'¿Qué hace una VPN por ti?', explainText:'Una VPN crea una conexión cifrada entre tu dispositivo e Internet. VeiCloud utiliza ese túnel para ayudarte a navegar con más privacidad y una ruta de red controlada.', explainIntro:'Tu tráfico viaja protegido dentro del túnel VPN y sale a Internet desde el servidor que selecciones. Eso reduce la exposición de tu dirección IP real en los servicios que visitas y añade una capa de protección cuando utilizas redes que no controlas.',
      ex1Title:'Más tranquilidad en Wi‑Fi', ex1Text:'Protege el tráfico que sale de tu dispositivo cuando utilizas redes públicas, hoteles, aeropuertos o cafeterías.', ex2Title:'Elige tu ruta', ex2Text:'Conéctate mediante una ubicación VeiCloud y cambia la ruta de salida de tu conexión cuando lo necesites.', ex3Title:'Menos exposición', ex3Text:'Los sitios que visitas ven la dirección IP del servidor VPN en lugar de utilizar directamente la IP de tu conexión.',
      privacyKick:'Privacidad primero', privacyTitle:'Tu privacidad no es el producto.', privacyText:'VeiCloud está pensado para darte una conexión privada y clara, sin convertir tu actividad en una fuente de ingresos.', p1Small:'Protección de conexión', p1Title:'Tu tráfico, protegido.', p1Text:'Cuando te conectas a VeiCloud, tu tráfico viaja por un túnel cifrado entre tu dispositivo y el servidor VPN. La seguridad sucede en segundo plano, sin obligarte a gestionar una montaña de ajustes.', p2Small:'Datos personales', p2Title:'Tus datos siguen siendo tuyos.', p2Text:'El servicio está diseñado alrededor de la conexión VPN, no alrededor de perfilar tu navegación. Tu experiencia no depende de vender información personal ni de llenar la aplicación de publicidad.',
      protocolSmall:'Tecnología de conexión', protocolTitle:'Una base moderna para tu túnel VPN.', protocolText:'VeiCloud utiliza WireGuard como base de conexión: una arquitectura compacta pensada para ofrecer una experiencia rápida, estable y sencilla sin añadir protocolos que no necesitas.', wgText:'Un protocolo moderno y ligero que prioriza simplicidad, rendimiento y criptografía actual.', wgTags:['Rápido','Ligero','Seguro'],
      supportSmall:'Soporte VeiCloud', supportTitle:'Ayuda clara cuando la necesitas.', supportText:'Si algo no conecta, una configuración se resiste o simplemente tienes una duda, queremos que llegar a una solución sea sencillo y sin lenguaje innecesariamente técnico.', s1Title:'Atención continua', s1Text:'Un punto de ayuda disponible para acompañarte cuando tengas dudas sobre tu servicio o conexión.', s2Title:'Explicaciones claras', s2Text:'Respuestas directas y comprensibles, sin convertir cada consulta en una clase de ingeniería de redes.', s3Title:'Ayuda con tu configuración', s3Text:'Orientación para poner VeiCloud a funcionar correctamente en tus dispositivos compatibles.',
      devicesKick:'En todos tus dispositivos', devicesTitle:'Una sola cuenta. Todo tu ecosistema.', devicesText:'Usa VeiCloud en tus dispositivos principales y mantén una experiencia consistente sin tener que aprender una interfaz distinta cada vez.', devicesPanelTitle:'VeiCloud donde lo necesites.', devicesPanelText:'Desde el ordenador hasta el televisor o el navegador, VeiCloud está pensado para acompañar tu conexión en los equipos que usas cada día.'
    },
    ru: {
      heroBadge:'VEICLOUD VPN · КОНФИДЕНЦИАЛЬНОСТЬ И СКОРОСТЬ', heroTitle:'Ваше соединение.<br><em>Ваше личное пространство.</em>', heroText:'VeiCloud VPN шифрует соединение и позволяет пользоваться стабильным, быстрым и простым маршрутом без лишних настроек.', heroDownload:'Скачать для Android', heroExplore:'Узнать о VeiCloud',
      mini1Title:'Конфиденциальность по умолчанию', mini1Text:'Зашифрованное соединение для защиты трафика без лишних сложностей.', mini2Title:'Быстрая и стабильная сеть', mini2Text:'Оптимизированные маршруты для плавной работы, игр и просмотра контента.', mini3Title:'До 8 устройств', mini3Text:'Выберите подходящий тариф и защищайте устройства из одной учётной записи.',
      explainLabel:'Как работает VPN', explainTitle:'Что VPN делает для вас?', explainText:'VPN создаёт зашифрованное соединение между вашим устройством и Интернетом. VeiCloud использует этот туннель для большей приватности и контролируемого сетевого маршрута.', explainIntro:'Ваш трафик защищён внутри VPN-туннеля и выходит в Интернет через выбранный сервер. Это уменьшает раскрытие вашего реального IP-адреса и добавляет защиту в сетях, которые вы не контролируете.',
      ex1Title:'Спокойнее в Wi‑Fi', ex1Text:'Защищайте трафик устройства в публичных сетях, гостиницах, аэропортах и кафе.', ex2Title:'Выбирайте маршрут', ex2Text:'Подключайтесь через локацию VeiCloud и меняйте маршрут выхода при необходимости.', ex3Title:'Меньше раскрытия', ex3Text:'Сайты видят IP-адрес VPN-сервера вместо прямого IP вашего подключения.',
      privacyKick:'Приватность прежде всего', privacyTitle:'Ваша приватность не является товаром.', privacyText:'VeiCloud создан для приватного и понятного соединения без превращения вашей активности в источник дохода.', p1Small:'Защита соединения', p1Title:'Ваш трафик защищён.', p1Text:'При подключении к VeiCloud трафик проходит через зашифрованный туннель между устройством и VPN-сервером. Защита работает в фоне без горы настроек.', p2Small:'Личные данные', p2Title:'Ваши данные остаются вашими.', p2Text:'Сервис построен вокруг VPN-соединения, а не профилирования браузинга. Работа сервиса не зависит от продажи личной информации или рекламы.',
      protocolSmall:'Технология соединения', protocolTitle:'Современная основа VPN-туннеля.', protocolText:'VeiCloud использует WireGuard как основу соединения: компактную архитектуру для быстрого, стабильного и простого использования без лишних протоколов.', wgText:'Современный лёгкий протокол с упором на простоту, производительность и актуальную криптографию.', wgTags:['Быстро','Легко','Безопасно'],
      supportSmall:'Поддержка VeiCloud', supportTitle:'Понятная помощь, когда она нужна.', supportText:'Если что-то не подключается, настройка не поддаётся или просто есть вопрос, мы хотим сделать решение простым и понятным.', s1Title:'Постоянная поддержка', s1Text:'Помощь по вопросам сервиса и подключения, когда она вам нужна.', s2Title:'Понятные объяснения', s2Text:'Прямые и доступные ответы без превращения каждого вопроса в лекцию по сетям.', s3Title:'Помощь с настройкой', s3Text:'Рекомендации для правильной работы VeiCloud на совместимых устройствах.',
      devicesKick:'На всех ваших устройствах', devicesTitle:'Одна учётная запись. Вся экосистема.', devicesText:'Используйте VeiCloud на основных устройствах и сохраняйте единый опыт без изучения нового интерфейса каждый раз.', devicesPanelTitle:'VeiCloud там, где он нужен.', devicesPanelText:'От компьютера до телевизора и браузера, VeiCloud сопровождает ваше соединение на устройствах, которыми вы пользуетесь каждый день.'
    }
  };

  const setText = (selector, value, html = false) => {
    const el = document.querySelector(selector);
    if (!el || value == null) return;
    if (html) el.innerHTML = value; else el.textContent = value;
  };
  const setMany = (selector, values, childSelector) => {
    document.querySelectorAll(selector).forEach((el, i) => {
      const target = childSelector ? el.querySelector(childSelector) : el;
      if (target && values[i] != null) target.textContent = values[i];
    });
  };

  function applyDynamic(lang) {
    const t = copy[lang] || copy.en;
    setText('.vei-badge', t.heroBadge); setText('.vei-hero h1', t.heroTitle, true); setText('.vei-hero-copy>p', t.heroText);
    setMany('.vei-hero-actions a', [t.heroDownload, t.heroExplore]);
    setMany('.vei-mini-card', [t.mini1Title,t.mini2Title,t.mini3Title], 'strong'); setMany('.vei-mini-card', [t.mini1Text,t.mini2Text,t.mini3Text], 'p');
    setText('.vei-explainer-label', t.explainLabel); setText('.vei-explainer-head h2', t.explainTitle); setText('.vei-explainer-head p', t.explainText); setText('.vei-explainer-intro', t.explainIntro);
    setMany('.vei-explainer-card', [t.ex1Title,t.ex2Title,t.ex3Title], 'strong'); setMany('.vei-explainer-card', [t.ex1Text,t.ex2Text,t.ex3Text], 'p');
    setText('.vei-privacy-kicker', t.privacyKick); setText('.vei-privacy-head h3', t.privacyTitle); setText('.vei-privacy-head p', t.privacyText);
    setMany('.vei-privacy-card', [t.p1Small,t.p2Small], 'small'); setMany('.vei-privacy-card', [t.p1Title,t.p2Title], 'h4'); setMany('.vei-privacy-card', [t.p1Text,t.p2Text], 'p');
    setText('.vei-protocol-copy small', t.protocolSmall); setText('.vei-protocol-copy h3', t.protocolTitle); setText('.vei-protocol-copy p', t.protocolText); setText('.vei-wg-body p', t.wgText); setMany('.vei-wg-tags span', t.wgTags);
    setText('.vei-support-copy small', t.supportSmall); setText('.vei-support-copy h3', t.supportTitle); setText('.vei-support-copy p', t.supportText); setMany('.vei-support-card', [t.s1Title,t.s2Title,t.s3Title], 'strong'); setMany('.vei-support-card', [t.s1Text,t.s2Text,t.s3Text], 'p');
    setText('.vei-devices-kicker', t.devicesKick); setText('.vei-devices-head h2', t.devicesTitle); setText('.vei-devices-head p', t.devicesText); setText('.vei-devices-copy h3', t.devicesPanelTitle); setText('.vei-devices-copy p', t.devicesPanelText);
  }

  function currentLang() {
    try { return ['en','es','ru'].includes(localStorage.getItem(STORAGE_KEY)) ? localStorage.getItem(STORAGE_KEY) : 'en'; } catch (_) { return 'en'; }
  }

  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => applyDynamic(currentLang()), 0);
    document.querySelectorAll('[data-lang]').forEach(btn => btn.addEventListener('click', () => setTimeout(() => applyDynamic(btn.dataset.lang), 0)));
    const observer = new MutationObserver(() => applyDynamic(currentLang()));
    observer.observe(document.body, { childList:true, subtree:true });
    setTimeout(() => observer.disconnect(), 3000);
  });
})();
