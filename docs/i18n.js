(() => {
  'use strict';

  const translations = {
    es: {
      'nav.product':'Producto','nav.network':'Red','nav.plans':'Planes','nav.download':'Descargar',
      'hero.eyebrow':'PRIVACIDAD SIN FRICCIÓN','hero.title':'Internet<br><em>bajo tu control.</em>','hero.text':'VeiCloud VPN protege tu conexión, optimiza tu ruta y se mantiene fuera de tu camino.','hero.download':'Descargar para Android','hero.explore':'Explorar producto','hero.nologs':'Sin registros','hero.devices':'3 dispositivos',
      'phone.connected':'Conectado','phone.location':'Ubicación','phone.finland':'Finlandia','phone.downloaded':'Descargado','phone.uploaded':'Subido','phone.home':'Inicio','phone.settings':'Ajustes',
      'metric.latency':'LATENCIA','metric.status':'ESTADO','metric.protected':'Protegido','metric.locations':'UBICACIONES','metric.available':'Disponibles',
      'product.kicker':'PRODUCTO','product.title':'Minimal por fuera.<br><em>Potente por dentro.</em>','product.text':'Una interfaz clara, una red rápida y una arquitectura creada para que la seguridad se sienta inmediata.','product.connection':'CONEXIÓN','product.oneTitle':'Un toque.<br>Todo protegido.','product.oneText':'VeiCloud selecciona una ruta estable y establece el túnel automáticamente.','product.speed':'VELOCIDAD','product.twoTitle':'Rendimiento visible.','product.twoText':'Descarga, subida y latencia en tiempo real.','product.privacy':'PRIVACIDAD','product.threeTitle':'Sin perfiles.<br>Sin historial.','product.threeText':'Tu actividad no se convierte en un producto.','product.platforms':'PLATAFORMAS','product.fourTitle':'Empieza en Android.','product.fourText':'Una base sólida antes de llegar a cada pantalla.',
      'network.kicker':'RED VEICLOUD','network.title':'Tu mejor ruta.<br><em>Sin buscarla.</em>','network.text':'Cuatro ubicaciones disponibles actualmente, con selección de ruta orientada a estabilidad y velocidad.','network.locations':'Ubicaciones','network.hours':'Horas online','network.smart':'Smart Route activa',
      'plans.kicker':'PLANES','plans.title':'Simple de elegir.<br><em>Difícil de dejar.</em>','plans.text':'Empieza gratis o desbloquea toda la red.','plans.freeText':'Para conocer VeiCloud.','plans.free1':'1 dispositivo','plans.free2':'Ubicaciones gratuitas disponibles','plans.free3':'Velocidad estándar','plans.start':'Empezar gratis','plans.month':'/ mes','plans.premiumText':'La experiencia completa.','plans.premium1':'Hasta 3 dispositivos','plans.premium2':'Las 4 ubicaciones actuales','plans.premium3':'Máxima velocidad disponible','plans.premium4':'Soporte prioritario','plans.activate':'Activar Premium',
      'download.title':'Conecta.<br><em>Y sigue.</em>','download.text':'VeiCloud VPN protege tu conexión sin convertir la seguridad en una tarea.','download.button':'Descargar VeiCloud VPN',
      'faq.title':'Preguntas claras.<br><em>Respuestas también.</em>','faq.q1':'¿VeiCloud guarda mi actividad?','faq.a1':'No. La actividad de navegación no forma parte del producto.','faq.q2':'¿Cuántos dispositivos puedo usar?','faq.a2':'Premium permite hasta 3 dispositivos vinculados.','faq.q3':'¿Sirve para streaming y juegos?','faq.a3':'La red está diseñada para priorizar estabilidad y baja latencia.',
      'legal.kicker':'INFORMACIÓN DEL SERVICIO','legal.title':'Todo claro.<br><em>Antes de pagar.</em>','legal.text':'Consulta las condiciones del servicio, privacidad, cancelaciones, reembolsos y datos de contacto.','legal.offer':'Oferta pública y condiciones','legal.privacy':'Política de privacidad','legal.refund':'Cancelación y reembolsos','legal.contacts':'Contacto y soporte','legal.open':'Abrir documento →','legal.delivery':'VeiCloud VPN es un servicio digital. No existe entrega física. El acceso a las funciones contratadas se habilita digitalmente tras la confirmación del pago.',
      'footer.privacy':'Privacidad','footer.offer':'Oferta pública','footer.refund':'Reembolsos','footer.contacts':'Contacto'
    },
    ru: {
      'nav.product':'Продукт','nav.network':'Сеть','nav.plans':'Тарифы','nav.download':'Скачать',
      'hero.eyebrow':'КОНФИДЕНЦИАЛЬНОСТЬ БЕЗ ЛИШНЕГО','hero.title':'Интернет<br><em>под вашим контролем.</em>','hero.text':'VeiCloud VPN защищает соединение, оптимизирует маршрут и не мешает вам пользоваться интернетом.','hero.download':'Скачать для Android','hero.explore':'Подробнее о продукте','hero.nologs':'Без журналов активности','hero.devices':'3 устройства',
      'phone.connected':'Подключено','phone.location':'Локация','phone.finland':'Финляндия','phone.downloaded':'Загрузка','phone.uploaded':'Отдача','phone.home':'Главная','phone.settings':'Настройки',
      'metric.latency':'ЗАДЕРЖКА','metric.status':'СТАТУС','metric.protected':'Защищено','metric.locations':'ЛОКАЦИИ','metric.available':'Доступно',
      'product.kicker':'ПРОДУКТ','product.title':'Минимализм снаружи.<br><em>Сила внутри.</em>','product.text':'Понятный интерфейс, быстрая сеть и архитектура, созданная для простой и быстрой защиты соединения.','product.connection':'ПОДКЛЮЧЕНИЕ','product.oneTitle':'Одно нажатие.<br>Соединение защищено.','product.oneText':'VeiCloud выбирает стабильный маршрут и автоматически устанавливает VPN-туннель.','product.speed':'СКОРОСТЬ','product.twoTitle':'Производительность на виду.','product.twoText':'Скорость загрузки, отдачи и задержка в реальном времени.','product.privacy':'КОНФИДЕНЦИАЛЬНОСТЬ','product.threeTitle':'Без профилей.<br>Без истории.','product.threeText':'Активность пользователя не является товаром.','product.platforms':'ПЛАТФОРМЫ','product.fourTitle':'Начинаем с Android.','product.fourText':'Надёжная база перед выходом на другие платформы.',
      'network.kicker':'СЕТЬ VEICLOUD','network.title':'Оптимальный маршрут.<br><em>Без ручного поиска.</em>','network.text':'Сейчас доступны четыре VPN-локации с выбором маршрута, ориентированным на стабильность и скорость.','network.locations':'Локации','network.hours':'Часов онлайн','network.smart':'Smart Route активен',
      'plans.kicker':'ТАРИФЫ','plans.title':'Простой выбор.<br><em>Понятные условия.</em>','plans.text':'Начните бесплатно или откройте доступ ко всей текущей сети.','plans.freeText':'Чтобы познакомиться с VeiCloud.','plans.free1':'1 устройство','plans.free2':'Доступные бесплатные локации','plans.free3':'Стандартная скорость','plans.start':'Начать бесплатно','plans.month':'/ месяц','plans.premiumText':'Полный доступ к сервису.','plans.premium1':'До 3 устройств','plans.premium2':'Все 4 текущие локации','plans.premium3':'Максимально доступная скорость','plans.premium4':'Приоритетная поддержка','plans.activate':'Подключить Premium',
      'download.title':'Подключайтесь.<br><em>И продолжайте.</em>','download.text':'VeiCloud VPN защищает интернет-соединение без лишних сложностей.','download.button':'Скачать VeiCloud VPN',
      'faq.title':'Понятные вопросы.<br><em>Понятные ответы.</em>','faq.q1':'VeiCloud хранит мою интернет-активность?','faq.a1':'Нет. История интернет-активности не является частью продукта.','faq.q2':'Сколько устройств можно использовать?','faq.a2':'Premium позволяет подключить до 3 устройств.','faq.q3':'Подходит ли сервис для стриминга и игр?','faq.a3':'Сеть спроектирована с приоритетом стабильности и низкой задержки.',
      'legal.kicker':'ИНФОРМАЦИЯ О СЕРВИСЕ','legal.title':'Всё понятно.<br><em>До оплаты.</em>','legal.text':'Ознакомьтесь с условиями сервиса, политикой конфиденциальности, отменой, возвратами и контактами.','legal.offer':'Публичная оферта и условия','legal.privacy':'Политика конфиденциальности','legal.refund':'Отмена и возвраты','legal.contacts':'Контакты и поддержка','legal.open':'Открыть документ →','legal.delivery':'VeiCloud VPN является цифровой услугой. Физическая доставка отсутствует. Доступ к оплаченным функциям предоставляется в цифровом виде после подтверждения платежа.',
      'footer.privacy':'Конфиденциальность','footer.offer':'Публичная оферта','footer.refund':'Возвраты','footer.contacts':'Контакты'
    },
    en: {
      'nav.product':'Product','nav.network':'Network','nav.plans':'Plans','nav.download':'Download',
      'hero.eyebrow':'PRIVACY WITHOUT FRICTION','hero.title':'Internet<br><em>under your control.</em>','hero.text':'VeiCloud VPN protects your connection, optimizes your route and stays out of your way.','hero.download':'Download for Android','hero.explore':'Explore product','hero.nologs':'No activity logs','hero.devices':'3 devices',
      'phone.connected':'Connected','phone.location':'Location','phone.finland':'Finland','phone.downloaded':'Download','phone.uploaded':'Upload','phone.home':'Home','phone.settings':'Settings',
      'metric.latency':'LATENCY','metric.status':'STATUS','metric.protected':'Protected','metric.locations':'LOCATIONS','metric.available':'Available',
      'product.kicker':'PRODUCT','product.title':'Minimal outside.<br><em>Powerful inside.</em>','product.text':'A clear interface, a fast network and an architecture designed to make protection feel immediate.','product.connection':'CONNECTION','product.oneTitle':'One tap.<br>Protected.','product.oneText':'VeiCloud selects a stable route and establishes the VPN tunnel automatically.','product.speed':'SPEED','product.twoTitle':'Visible performance.','product.twoText':'Download, upload and latency in real time.','product.privacy':'PRIVACY','product.threeTitle':'No profiles.<br>No history.','product.threeText':'Your activity is not turned into a product.','product.platforms':'PLATFORMS','product.fourTitle':'Starting with Android.','product.fourText':'A solid base before expanding to every screen.',
      'network.kicker':'VEICLOUD NETWORK','network.title':'Your best route.<br><em>Without searching.</em>','network.text':'Four VPN locations are currently available, with route selection focused on stability and speed.','network.locations':'Locations','network.hours':'Hours online','network.smart':'Smart Route active',
      'plans.kicker':'PLANS','plans.title':'Easy to choose.<br><em>Clear to understand.</em>','plans.text':'Start free or unlock the entire current network.','plans.freeText':'A simple way to try VeiCloud.','plans.free1':'1 device','plans.free2':'Available free locations','plans.free3':'Standard speed','plans.start':'Start free','plans.month':'/ month','plans.premiumText':'The complete experience.','plans.premium1':'Up to 3 devices','plans.premium2':'All 4 current locations','plans.premium3':'Maximum available speed','plans.premium4':'Priority support','plans.activate':'Activate Premium',
      'download.title':'Connect.<br><em>Keep going.</em>','download.text':'VeiCloud VPN protects your connection without turning security into a chore.','download.button':'Download VeiCloud VPN',
      'faq.title':'Clear questions.<br><em>Clear answers.</em>','faq.q1':'Does VeiCloud store my browsing activity?','faq.a1':'No. Browsing activity history is not part of the product.','faq.q2':'How many devices can I use?','faq.a2':'Premium supports up to 3 linked devices.','faq.q3':'Is it suitable for streaming and gaming?','faq.a3':'The network is designed to prioritize stability and low latency.',
      'legal.kicker':'SERVICE INFORMATION','legal.title':'Everything clear.<br><em>Before you pay.</em>','legal.text':'Review service terms, privacy, cancellations, refunds and contact information.','legal.offer':'Public offer and terms','legal.privacy':'Privacy policy','legal.refund':'Cancellation and refunds','legal.contacts':'Contact and support','legal.open':'Open document →','legal.delivery':'VeiCloud VPN is a digital service. There is no physical delivery. Paid features are enabled digitally after payment confirmation.',
      'footer.privacy':'Privacy','footer.offer':'Public offer','footer.refund':'Refunds','footer.contacts':'Contact'
    }
  };

  const normalize = value => ['es','ru','en'].includes(value) ? value : 'es';
  const applyLanguage = lang => {
    lang = normalize(lang);
    const dict = translations[lang];
    document.documentElement.lang = lang;
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.dataset.i18n;
      if (dict[key] !== undefined) el.textContent = dict[key];
    });
    document.querySelectorAll('[data-i18n-html]').forEach(el => {
      const key = el.dataset.i18nHtml;
      if (dict[key] !== undefined) el.innerHTML = dict[key];
    });
    document.querySelectorAll('[data-lang]').forEach(btn => btn.classList.toggle('active', btn.dataset.lang === lang));
    try { localStorage.setItem('veicloud-language', lang); } catch (_) {}
  };

  document.addEventListener('DOMContentLoaded', () => {
    let saved = 'es';
    try { saved = localStorage.getItem('veicloud-language') || 'es'; } catch (_) {}
    applyLanguage(saved);
    document.querySelectorAll('[data-lang]').forEach(btn => btn.addEventListener('click', () => applyLanguage(btn.dataset.lang)));
  });
})();