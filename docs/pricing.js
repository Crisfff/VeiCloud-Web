(() => {
  'use strict';

  const STORAGE_KEY = 'veicloud-language-v2';
  const PLAN_RUB = { standard: 199.99, gold: 449.99, premium: 905 };
  const FALLBACK_USD_RUB = 83.88;

  const copy = {
    en: {
      'nav.home':'Home','nav.pricing':'Pricing','nav.account':'My account','hero.kicker':'SIMPLE PRICING','hero.title':'Pick the plan that fits your devices.','hero.text':'The same VeiCloud network on every plan. You only choose how many devices you want to protect.','hero.monthly':'Monthly billing','hero.cancel':'No automatic renewal','plans.personal':'PERSONAL','plans.standardDesc':'Everything you need for one device.','plans.goldDesc':'A balanced plan for your everyday devices.','plans.premiumDesc':'Maximum capacity for your full device setup.','plans.month':'/ month','plans.oneDevice':'1 device','plans.threeDevices':'3 devices','plans.eightDevices':'8 devices','plans.allLocations':'All current locations','plans.unlimited':'Unlimited traffic','plans.support':'VeiCloud support','plans.chooseStandard':'Choose Standard','plans.chooseGold':'Choose Gold','plans.choosePremium':'Choose Premium','plans.popular':'MOST POPULAR','payment.kicker':'PAYMENT','payment.title':'A simple checkout, paid with crypto.','payment.text':'For now, VeiCloud accepts cryptocurrency payments through our secure checkout. Your subscription activates automatically after the required blockchain confirmations.','payment.cryptoSub':'Available with USDT BEP20 and Litecoin','details.kicker':'GOOD TO KNOW','details.title':'Clear terms, no tiny-print maze.','details.activationTitle':'Automatic activation','details.activationText':'Once the payment is confirmed, your plan is activated automatically on your VeiCloud account.','details.monthlyTitle':'30-day access','details.monthlyText':'Each purchase adds one monthly subscription period to the selected plan.','details.exactTitle':'Exact crypto amount','details.exactText':'The checkout shows the exact crypto amount and wallet address to use for your invoice.','details.expiryTitle':'Timed invoices','details.expiryText':'Crypto invoices expire after their payment window. If one expires, simply create a new invoice.','legal.kicker':'TERMS','legal.title':'Before you subscribe','legal.text':'VeiCloud VPN is a digital service. There is no physical delivery. Availability, performance and supported locations may vary by network conditions and platform. By purchasing a plan, you agree to the service terms and refund policy.','legal.offer':'Public offer','legal.privacy':'Privacy policy','legal.refund':'Refund policy','legal.contact':'Contact','footer.back':'Back to VeiCloud'
    },
    es: {
      'nav.home':'Inicio','nav.pricing':'Precios','nav.account':'Mi cuenta','hero.kicker':'PRECIOS SIMPLES','hero.title':'Elige el plan que encaje con tus dispositivos.','hero.text':'La misma red VeiCloud en todos los planes. Solo eliges cuántos dispositivos quieres proteger.','hero.monthly':'Facturación mensual','hero.cancel':'Sin renovación automática','plans.personal':'PERSONAL','plans.standardDesc':'Todo lo que necesitas para un dispositivo.','plans.goldDesc':'Un plan equilibrado para tus dispositivos diarios.','plans.premiumDesc':'Máxima capacidad para todo tu ecosistema.','plans.month':'/ mes','plans.oneDevice':'1 dispositivo','plans.threeDevices':'3 dispositivos','plans.eightDevices':'8 dispositivos','plans.allLocations':'Todas las ubicaciones actuales','plans.unlimited':'Tráfico ilimitado','plans.support':'Soporte VeiCloud','plans.chooseStandard':'Elegir Standard','plans.chooseGold':'Elegir Gold','plans.choosePremium':'Elegir Premium','plans.popular':'MÁS POPULAR','payment.kicker':'PAGO','payment.title':'Un checkout sencillo, pagado con crypto.','payment.text':'Por ahora, VeiCloud acepta pagos con criptomonedas mediante nuestro checkout seguro. Tu suscripción se activa automáticamente tras las confirmaciones necesarias de la blockchain.','payment.cryptoSub':'Disponible con USDT BEP20 y Litecoin','details.kicker':'BUENO SABERLO','details.title':'Condiciones claras, sin laberinto de letra pequeña.','details.activationTitle':'Activación automática','details.activationText':'Cuando el pago se confirma, el plan se activa automáticamente en tu cuenta VeiCloud.','details.monthlyTitle':'Acceso de 30 días','details.monthlyText':'Cada compra añade un periodo mensual de suscripción al plan seleccionado.','details.exactTitle':'Cantidad crypto exacta','details.exactText':'El checkout muestra la cantidad exacta en crypto y la dirección de wallet para tu factura.','details.expiryTitle':'Facturas con tiempo','details.expiryText':'Las facturas crypto vencen al terminar su ventana de pago. Si vence una, simplemente crea otra.','legal.kicker':'CONDICIONES','legal.title':'Antes de suscribirte','legal.text':'VeiCloud VPN es un servicio digital. No existe entrega física. La disponibilidad, rendimiento y ubicaciones compatibles pueden variar según la red y la plataforma. Al comprar un plan aceptas las condiciones del servicio y la política de reembolsos.','legal.offer':'Oferta pública','legal.privacy':'Privacidad','legal.refund':'Reembolsos','legal.contact':'Contacto','footer.back':'Volver a VeiCloud'
    },
    ru: {
      'nav.home':'Главная','nav.pricing':'Цены','nav.account':'Личный кабинет','hero.kicker':'ПРОСТЫЕ ЦЕНЫ','hero.title':'Выберите тариф под количество ваших устройств.','hero.text':'Одна и та же сеть VeiCloud во всех тарифах. Вы выбираете только количество защищаемых устройств.','hero.monthly':'Ежемесячная оплата','hero.cancel':'Без автопродления','plans.personal':'ЛИЧНЫЙ','plans.standardDesc':'Всё необходимое для одного устройства.','plans.goldDesc':'Сбалансированный тариф для повседневных устройств.','plans.premiumDesc':'Максимальная вместимость для всей экосистемы устройств.','plans.month':'/ месяц','plans.oneDevice':'1 устройство','plans.threeDevices':'3 устройства','plans.eightDevices':'8 устройств','plans.allLocations':'Все текущие локации','plans.unlimited':'Безлимитный трафик','plans.support':'Поддержка VeiCloud','plans.chooseStandard':'Выбрать Standard','plans.chooseGold':'Выбрать Gold','plans.choosePremium':'Выбрать Premium','plans.popular':'ПОПУЛЯРНЫЙ','payment.kicker':'ОПЛАТА','payment.title':'Простой checkout с оплатой криптовалютой.','payment.text':'Сейчас VeiCloud принимает криптовалюту через защищённую страницу оплаты. Подписка активируется автоматически после необходимых подтверждений блокчейна.','payment.cryptoSub':'Доступны USDT BEP20 и Litecoin','details.kicker':'ВАЖНО ЗНАТЬ','details.title':'Понятные условия без мелкого шрифта.','details.activationTitle':'Автоматическая активация','details.activationText':'После подтверждения платежа тариф автоматически активируется в вашей учётной записи VeiCloud.','details.monthlyTitle':'Доступ на 30 дней','details.monthlyText':'Каждая покупка добавляет один месячный период выбранного тарифа.','details.exactTitle':'Точная сумма в криптовалюте','details.exactText':'Checkout показывает точную сумму и адрес кошелька для вашей оплаты.','details.expiryTitle':'Ограниченное время','details.expiryText':'Крипто-счёт действует ограниченное время. После истечения просто создайте новый.','legal.kicker':'УСЛОВИЯ','legal.title':'Перед подпиской','legal.text':'VeiCloud VPN является цифровой услугой без физической доставки. Доступность, скорость и локации могут зависеть от сети и платформы. Покупая тариф, вы принимаете условия сервиса и политику возвратов.','legal.offer':'Публичная оферта','legal.privacy':'Конфиденциальность','legal.refund':'Возвраты','legal.contact':'Контакты','footer.back':'Вернуться в VeiCloud'
    }
  };

  function language() {
    try { return ['en','es','ru'].includes(localStorage.getItem(STORAGE_KEY)) ? localStorage.getItem(STORAGE_KEY) : 'en'; }
    catch { return 'en'; }
  }

  function applyLanguage() {
    const lang = language();
    const dict = copy[lang] || copy.en;
    document.documentElement.lang = lang;
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const value = dict[el.dataset.i18n];
      if (value !== undefined) el.textContent = value;
    });
    document.title = `${dict['nav.pricing']} | VeiCloud VPN`;
  }

  function renderPrices(rate) {
    if (!Number.isFinite(rate) || rate <= 0) rate = FALLBACK_USD_RUB;
    Object.entries(PLAN_RUB).forEach(([plan, rub]) => {
      const el = document.querySelector(`[data-plan-price="${plan}"]`);
      if (el) el.textContent = new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',minimumFractionDigits:2,maximumFractionDigits:2}).format(rub/rate);
    });
  }

  async function fetchRate() {
    const sources = [
      async () => Number((await (await fetch('https://open.er-api.com/v6/latest/USD',{cache:'no-store'})).json())?.rates?.RUB),
      async () => Number((await (await fetch('https://api.frankfurter.app/latest?from=USD&to=RUB',{cache:'no-store'})).json())?.rates?.RUB)
    ];
    for (const source of sources) {
      try { const value = await source(); if (Number.isFinite(value) && value > 0) return value; } catch {}
    }
    return FALLBACK_USD_RUB;
  }

  document.addEventListener('DOMContentLoaded', async () => {
    applyLanguage();
    renderPrices(FALLBACK_USD_RUB);
    renderPrices(await fetchRate());
  });
})();