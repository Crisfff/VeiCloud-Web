(() => {
  'use strict';

  const STORAGE_KEY = 'veicloud-language-v2';

  const translations = {
    es: {
      'nav.product':'Producto','nav.network':'Red','nav.plans':'Planes','nav.download':'Descargar','nav.account':'Mi cuenta',
      'hero.eyebrow':'PRIVACIDAD SIN FRICCIÓN','hero.title':'Internet<br><em>bajo tu control.</em>','hero.text':'VeiCloud VPN protege tu conexión, optimiza tu ruta y se mantiene fuera de tu camino.','hero.download':'Descargar para Android','hero.explore':'Explorar producto','hero.nologs':'Sin registros','hero.devices':'Hasta 8 dispositivos',
      'phone.connected':'Conectado','phone.location':'Ubicación','phone.finland':'Finlandia','phone.downloaded':'Descargado','phone.uploaded':'Subido','phone.home':'Inicio','phone.settings':'Ajustes',
      'metric.latency':'LATENCIA','metric.status':'ESTADO','metric.protected':'Protegido','metric.locations':'UBICACIONES','metric.available':'Disponibles',
      'product.kicker':'PRODUCTO','product.title':'Minimal por fuera.<br><em>Potente por dentro.</em>','product.text':'Una interfaz clara, una red rápida y una arquitectura creada para que la seguridad se sienta inmediata.','product.connection':'CONEXIÓN','product.oneTitle':'Un toque.<br>Todo protegido.','product.oneText':'VeiCloud selecciona una ruta estable y establece el túnel automáticamente.','product.speed':'VELOCIDAD','product.twoTitle':'Rendimiento visible.','product.twoText':'Descarga, subida y latencia en tiempo real.','product.privacy':'PRIVACIDAD','product.threeTitle':'Sin perfiles.<br>Sin historial.','product.threeText':'Tu actividad no se convierte en un producto.','product.platforms':'PLATAFORMAS','product.fourTitle':'Empieza en Android.','product.fourText':'Una base sólida antes de llegar a cada pantalla.',
      'network.kicker':'RED VEICLOUD','network.title':'Tu mejor ruta.<br><em>Sin buscarla.</em>','network.text':'Cuatro ubicaciones disponibles actualmente, con selección de ruta orientada a estabilidad y velocidad.','network.locations':'Ubicaciones','network.hours':'Horas online','network.smart':'Smart Route activa',
      'plans.kicker':'PLANES','plans.title':'Elige tu nivel.<br><em>La red es la misma.</em>','plans.text':'Tres planes mensuales según la cantidad de dispositivos que necesites.','plans.month':'/ mes','plans.standartText':'Para un solo dispositivo.','plans.standart1':'1 dispositivo','plans.goldText':'Más dispositivos, la misma experiencia.','plans.gold1':'3 dispositivos','plans.premiumText':'Máxima capacidad para todos tus dispositivos.','plans.premium1':'8 dispositivos','plans.sharedLocations':'Las 4 ubicaciones actuales','plans.monthlyAccess':'Acceso mensual','plans.chooseStandart':'Elegir Standart','plans.chooseGold':'Elegir Gold','plans.choosePremium':'Elegir Premium',
      'download.title':'Conecta.<br><em>Y sigue.</em>','download.text':'VeiCloud VPN protege tu conexión sin convertir la seguridad en una tarea.','download.button':'Descargar VeiCloud VPN',
      'faq.title':'Preguntas claras.<br><em>Respuestas también.</em>','faq.q1':'¿VeiCloud guarda mi actividad?','faq.a1':'No. La actividad de navegación no forma parte del producto.','faq.q2':'¿Cuántos dispositivos puedo usar?','faq.a2':'Standart incluye 1 dispositivo, Gold 3 dispositivos y Premium 8 dispositivos.','faq.q3':'¿Sirve para streaming y juegos?','faq.a3':'La red está diseñada para priorizar estabilidad y baja latencia.',
      'legal.kicker':'INFORMACIÓN DEL SERVICIO','legal.title':'Todo claro.<br><em>Antes de pagar.</em>','legal.text':'Consulta las condiciones del servicio, privacidad, cancelaciones, reembolsos y datos de contacto.','legal.offer':'Oferta pública y condiciones','legal.privacy':'Política de privacidad','legal.refund':'Cancelación y reembolsos','legal.contacts':'Contacto y soporte','legal.open':'Abrir documento →','legal.delivery':'VeiCloud VPN es un servicio digital. No existe entrega física. El acceso a las funciones contratadas se habilita digitalmente tras la confirmación del pago.',
      'footer.privacy':'Privacidad','footer.offer':'Oferta pública','footer.refund':'Reembolsos','footer.contacts':'Contacto',
      'meta.title':'VeiCloud VPN | Privacidad, velocidad y control','meta.description':'VeiCloud VPN es un servicio VPN centrado en privacidad, velocidad, estabilidad y control, con varias ubicaciones y planes para hasta 8 dispositivos.'
    },
    ru: {
      'nav.product':'Продукт','nav.network':'Сеть','nav.plans':'Тарифы','nav.download':'Скачать','nav.account':'Личный кабинет',
      'hero.eyebrow':'КОНФИДЕНЦИАЛЬНОСТЬ БЕЗ ЛИШНЕГО','hero.title':'Интернет<br><em>под вашим контролем.</em>','hero.text':'VeiCloud VPN защищает соединение, оптимизирует маршрут и не мешает вам пользоваться интернетом.','hero.download':'Скачать для Android','hero.explore':'Подробнее о продукте','hero.nologs':'Без журналов активности','hero.devices':'До 8 устройств',
      'phone.connected':'Подключено','phone.location':'Локация','phone.finland':'Финляндия','phone.downloaded':'Загрузка','phone.uploaded':'Отдача','phone.home':'Главная','phone.settings':'Настройки',
      'metric.latency':'ЗАДЕРЖКА','metric.status':'СТАТУС','metric.protected':'Защищено','metric.locations':'ЛОКАЦИИ','metric.available':'Доступно',
      'product.kicker':'ПРОДУКТ','product.title':'Минимализм снаружи.<br><em>Сила внутри.</em>','product.text':'Понятный интерфейс, быстрая сеть и архитектура, созданная для простой и быстрой защиты соединения.','product.connection':'ПОДКЛЮЧЕНИЕ','product.oneTitle':'Одно нажатие.<br>Соединение защищено.','product.oneText':'VeiCloud выбирает стабильный маршрут и автоматически устанавливает VPN-туннель.','product.speed':'СКОРОСТЬ','product.twoTitle':'Производительность на виду.','product.twoText':'Скорость загрузки, отдачи и задержка в реальном времени.','product.privacy':'КОНФИДЕНЦИАЛЬНОСТЬ','product.threeTitle':'Без профилей.<br>Без истории.','product.threeText':'Активность пользователя не является товаром.','product.platforms':'ПЛАТФОРМЫ','product.fourTitle':'Начинаем с Android.','product.fourText':'Надёжная база перед выходом на другие платформы.',
      'network.kicker':'СЕТЬ VEICLOUD','network.title':'Оптимальный маршрут.<br><em>Без ручного поиска.</em>','network.text':'Сейчас доступны четыре VPN-локации с выбором маршрута, ориентированным на стабильность и скорость.','network.locations':'Локации','network.hours':'Часов онлайн','network.smart':'Smart Route активен',
      'plans.kicker':'ТАРИФЫ','plans.title':'Выберите свой уровень.<br><em>Сеть одна и та же.</em>','plans.text':'Три ежемесячных тарифа в зависимости от количества нужных устройств.','plans.month':'/ месяц','plans.standartText':'Для одного устройства.','plans.standart1':'1 устройство','plans.goldText':'Больше устройств, тот же сервис.','plans.gold1':'3 устройства','plans.premiumText':'Максимальная вместимость для всех ваших устройств.','plans.premium1':'8 устройств','plans.sharedLocations':'Все 4 текущие локации','plans.monthlyAccess':'Ежемесячный доступ','plans.chooseStandart':'Выбрать Standart','plans.chooseGold':'Выбрать Gold','plans.choosePremium':'Выбрать Premium',
      'download.title':'Подключайтесь.<br><em>И продолжайте.</em>','download.text':'VeiCloud VPN защищает интернет-соединение без лишних сложностей.','download.button':'Скачать VeiCloud VPN',
      'faq.title':'Понятные вопросы.<br><em>Понятные ответы.</em>','faq.q1':'VeiCloud хранит мою интернет-активность?','faq.a1':'Нет. История интернет-активности не является частью продукта.','faq.q2':'Сколько устройств можно использовать?','faq.a2':'Standart включает 1 устройство, Gold 3 устройства, Premium 8 устройств.','faq.q3':'Подходит ли сервис для стриминга и игр?','faq.a3':'Сеть спроектирована с приоритетом стабильности и низкой задержки.',
      'legal.kicker':'ИНФОРМАЦИЯ О СЕРВИСЕ','legal.title':'Всё понятно.<br><em>До оплаты.</em>','legal.text':'Ознакомьтесь с условиями сервиса, политикой конфиденциальности, отменой, возвратами и контактами.','legal.offer':'Публичная оферта и условия','legal.privacy':'Политика конфиденциальности','legal.refund':'Отмена и возвраты','legal.contacts':'Контакты и поддержка','legal.open':'Открыть документ →','legal.delivery':'VeiCloud VPN является цифровой услугой. Физическая доставка отсутствует. Доступ к оплаченным функциям предоставляется в цифровом виде после подтверждения платежа.',
      'footer.privacy':'Конфиденциальность','footer.offer':'Публичная оферта','footer.refund':'Возвраты','footer.contacts':'Контакты',
      'meta.title':'VeiCloud VPN | Конфиденциальность, скорость и контроль','meta.description':'VeiCloud VPN защищает соединение и предлагает быстрые маршруты, несколько локаций и тарифы до 8 устройств.'
    },
    en: {
      'nav.product':'Product','nav.network':'Network','nav.plans':'Plans','nav.download':'Download','nav.account':'My account',
      'hero.eyebrow':'PRIVACY WITHOUT FRICTION','hero.title':'Internet<br><em>under your control.</em>','hero.text':'VeiCloud VPN protects your connection, optimizes your route and stays out of your way.','hero.download':'Download for Android','hero.explore':'Explore product','hero.nologs':'No activity logs','hero.devices':'Up to 8 devices',
      'phone.connected':'Connected','phone.location':'Location','phone.finland':'Finland','phone.downloaded':'Download','phone.uploaded':'Upload','phone.home':'Home','phone.settings':'Settings',
      'metric.latency':'LATENCY','metric.status':'STATUS','metric.protected':'Protected','metric.locations':'LOCATIONS','metric.available':'Available',
      'product.kicker':'PRODUCT','product.title':'Minimal outside.<br><em>Powerful inside.</em>','product.text':'A clear interface, a fast network and an architecture designed to make protection feel immediate.','product.connection':'CONNECTION','product.oneTitle':'One tap.<br>Protected.','product.oneText':'VeiCloud selects a stable route and establishes the VPN tunnel automatically.','product.speed':'SPEED','product.twoTitle':'Visible performance.','product.twoText':'Download, upload and latency in real time.','product.privacy':'PRIVACY','product.threeTitle':'No profiles.<br>No history.','product.threeText':'Your activity is not turned into a product.','product.platforms':'PLATFORMS','product.fourTitle':'Starting with Android.','product.fourText':'A solid base before expanding to every screen.',
      'network.kicker':'VEICLOUD NETWORK','network.title':'Your best route.<br><em>Without searching.</em>','network.text':'Four VPN locations are currently available, with route selection focused on stability and speed.','network.locations':'Locations','network.hours':'Hours online','network.smart':'Smart Route active',
      'plans.kicker':'PLANS','plans.title':'Choose your level.<br><em>The network stays the same.</em>','plans.text':'Three monthly plans based on how many devices you need.','plans.month':'/ month','plans.standartText':'For a single device.','plans.standart1':'1 device','plans.goldText':'More devices, the same experience.','plans.gold1':'3 devices','plans.premiumText':'Maximum capacity for all your devices.','plans.premium1':'8 devices','plans.sharedLocations':'All 4 current locations','plans.monthlyAccess':'Monthly access','plans.chooseStandart':'Choose Standart','plans.chooseGold':'Choose Gold','plans.choosePremium':'Choose Premium',
      'download.title':'Connect.<br><em>Keep going.</em>','download.text':'VeiCloud VPN protects your connection without turning security into a chore.','download.button':'Download VeiCloud VPN',
      'faq.title':'Clear questions.<br><em>Clear answers.</em>','faq.q1':'Does VeiCloud store my browsing activity?','faq.a1':'No. Browsing activity history is not part of the product.','faq.q2':'How many devices can I use?','faq.a2':'Standart includes 1 device, Gold 3 devices and Premium 8 devices.','faq.q3':'Is it suitable for streaming and gaming?','faq.a3':'The network is designed to prioritize stability and low latency.',
      'legal.kicker':'SERVICE INFORMATION','legal.title':'Everything clear.<br><em>Before you pay.</em>','legal.text':'Review service terms, privacy, cancellations, refunds and contact information.','legal.offer':'Public offer and terms','legal.privacy':'Privacy policy','legal.refund':'Cancellation and refunds','legal.contacts':'Contact and support','legal.open':'Open document →','legal.delivery':'VeiCloud VPN is a digital service. There is no physical delivery. Paid features are enabled digitally after payment confirmation.',
      'footer.privacy':'Privacy','footer.offer':'Public offer','footer.refund':'Refunds','footer.contacts':'Contact',
      'meta.title':'VeiCloud VPN | Privacy, speed and control','meta.description':'VeiCloud VPN protects your connection with optimized routes, multiple locations and plans for up to 8 devices.'
    }
  };

  const normalize = value => ['es','ru','en'].includes(value) ? value : 'en';

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

    const accountButton = document.querySelector('.account-nav-button');
    if (accountButton) accountButton.textContent = dict['nav.account'];

    document.title = dict['meta.title'];
    const description = document.querySelector('meta[name="description"]');
    if (description) description.setAttribute('content', dict['meta.description']);

    document.querySelectorAll('[data-lang]').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.lang === lang);
    });

    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch (_) {}
  };

  document.addEventListener('DOMContentLoaded', () => {
    let saved = 'en';

    try {
      saved = localStorage.getItem(STORAGE_KEY) || 'en';
    } catch (_) {}

    applyLanguage(saved);

    document.querySelectorAll('[data-lang]').forEach(btn => {
      btn.addEventListener('click', () => applyLanguage(btn.dataset.lang));
    });
  });
})();