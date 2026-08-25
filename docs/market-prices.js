(() => {
  const API_BASE = "https://api.veicloud.online:8443";
  const TOKEN_KEY = "veicloud_web_token";
  const PLAN_PRICES_RUB = [199.99, 449.99, 905];
  const PLAN_KEYS = ["standard", "gold", "premium"];
  const PLAN_NAMES = ["Standard", "Gold", "Premium"];
  const FALLBACK_USD_RUB = 83.88;
  const CACHE_KEY = "veicloud_usd_rub_rate";
  const CACHE_MAX_AGE_MS = 6 * 60 * 60 * 1000;
  const REFRESH_INTERVAL_MS = 30 * 60 * 1000;

  function priceElements() {
    return Array.from(document.querySelectorAll(".plan-choice-price strong"));
  }

  function formatUsd(value) {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
  }

  function renderPrices(usdRubRate) {
    if (!Number.isFinite(usdRubRate) || usdRubRate <= 0) return;
    const elements = priceElements();
    PLAN_PRICES_RUB.forEach((rubPrice, index) => {
      if (!elements[index]) return;
      elements[index].textContent = formatUsd(rubPrice / usdRubRate);
      elements[index].dataset.usdPrice = String(rubPrice / usdRubRate);
      elements[index].dataset.rubPrice = String(rubPrice);
    });
  }

  function readCachedRate() {
    try {
      const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || "null");
      if (!cached || !Number.isFinite(cached.rate) || cached.rate <= 0 || !Number.isFinite(cached.savedAt)) return null;
      if (Date.now() - cached.savedAt > CACHE_MAX_AGE_MS) return null;
      return cached.rate;
    } catch { return null; }
  }

  function saveRate(rate) {
    try { localStorage.setItem(CACHE_KEY, JSON.stringify({ rate, savedAt: Date.now() })); } catch {}
  }

  async function fetchUsdRubRate() {
    const sources = [
      async () => {
        const response = await fetch("https://open.er-api.com/v6/latest/USD", { cache: "no-store" });
        if (!response.ok) throw new Error("FX_SOURCE_1");
        return Number((await response.json())?.rates?.RUB);
      },
      async () => {
        const response = await fetch("https://api.frankfurter.app/latest?from=USD&to=RUB", { cache: "no-store" });
        if (!response.ok) throw new Error("FX_SOURCE_2");
        return Number((await response.json())?.rates?.RUB);
      }
    ];
    for (const source of sources) {
      try {
        const rate = await source();
        if (Number.isFinite(rate) && rate > 0) return rate;
      } catch {}
    }
    return null;
  }

  async function refreshMarketPrices() {
    const liveRate = await fetchUsdRubRate();
    if (liveRate) { saveRate(liveRate); renderPrices(liveRate); return; }
    renderPrices(readCachedRate() || FALLBACK_USD_RUB);
  }

  function ensurePaymentStyles() {
    if (document.getElementById("veicloudPaymentStyles")) return;
    const style = document.createElement("style");
    style.id = "veicloudPaymentStyles";
    style.textContent = `
      .payment-method-modal{position:fixed;inset:0;z-index:220;display:grid;place-items:center;padding:24px}.payment-method-modal.hidden{display:none!important}.payment-method-backdrop{position:absolute;inset:0;background:rgba(0,0,0,.74);backdrop-filter:blur(14px)}.payment-method-card{position:relative;width:min(520px,94vw);background:linear-gradient(180deg,#14171c,#0b0d11);border:1px solid rgba(255,255,255,.1);border-radius:24px;padding:22px;box-shadow:0 34px 110px rgba(0,0,0,.65);overflow:hidden}.payment-method-head{display:flex;align-items:flex-start;justify-content:space-between;gap:18px;margin-bottom:18px}.payment-method-eyebrow{display:block;color:#ff6a4d;font-size:9px;font-weight:800;letter-spacing:.16em;text-transform:uppercase;margin-bottom:7px}.payment-method-head h2{margin:0;font-family:Manrope,Inter,sans-serif;font-size:25px;letter-spacing:-.035em;color:#fff}.payment-method-close{width:38px;height:38px;border-radius:11px;border:1px solid rgba(255,255,255,.08);background:#101217;color:#9da2ac;display:grid;place-items:center;cursor:pointer;font-size:20px}.payment-plan-summary{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:14px 15px;border-radius:15px;background:#0b0e12;border:1px solid rgba(255,255,255,.07);margin-bottom:14px}.payment-plan-summary span{display:block;color:#727984;font-size:9px;font-weight:800;letter-spacing:.09em;text-transform:uppercase;margin-bottom:4px}.payment-plan-summary strong{font-size:14px;color:#f6f7f9}.payment-plan-price{font-family:Manrope,Inter,sans-serif!important;font-size:18px!important;color:#fff!important;text-align:right}.payment-method-label{display:block;margin:17px 2px 9px;color:#777d87;font-size:9px;font-weight:800;letter-spacing:.14em;text-transform:uppercase}.payment-method-list{display:grid;gap:10px}.payment-method-option,.crypto-coin-option{width:100%;border:1px solid rgba(255,255,255,.09);border-radius:17px;background:#0c0f13;color:#fff;padding:15px;display:flex;align-items:center;gap:14px;text-align:left;cursor:pointer;transition:.2s ease}.payment-method-option:hover,.crypto-coin-option:hover{transform:translateY(-1px);border-color:rgba(255,67,37,.34);background:#11151a}.payment-method-icon,.crypto-coin-icon{width:48px;height:48px;border-radius:14px;background:#171a20;border:1px solid rgba(255,255,255,.07);display:grid;place-items:center;flex:0 0 auto;overflow:hidden}.payment-method-icon img,.crypto-coin-icon img{width:34px;height:34px;object-fit:contain}.payment-method-copy,.crypto-coin-copy{min-width:0;flex:1}.payment-method-copy strong,.crypto-coin-copy strong{display:block;font-size:13px;margin-bottom:4px}.payment-method-copy small,.crypto-coin-copy small{display:block;color:#737a84;font-size:10px;line-height:1.45}.payment-method-arrow{font-size:21px;color:#6d737c}.payment-method-note{margin:13px 2px 0;color:#626974;font-size:9px;line-height:1.55}.payment-stage-window{overflow:hidden}.payment-stage-track{display:flex;width:200%;transition:transform .36s cubic-bezier(.22,.8,.25,1)}.payment-stage{width:50%;flex:0 0 50%}.payment-stage-track.show-coins{transform:translateX(-50%)}.crypto-stage-head{display:flex;align-items:center;gap:10px;margin:2px 0 14px}.crypto-back{width:36px;height:36px;border-radius:11px;border:1px solid rgba(255,255,255,.08);background:#101217;color:#d8dbe0;cursor:pointer;font-size:20px}.crypto-stage-head strong{color:#fff;font-size:15px}.crypto-stage-head small{display:block;color:#737a84;font-size:9px;margin-top:2px}.crypto-coin-list{display:grid;gap:10px}.crypto-coin-option.selected{border-color:rgba(255,67,37,.55);background:rgba(255,67,37,.07)}.crypto-coin-option:disabled{opacity:.55;cursor:wait;transform:none}.crypto-payment-error{margin-top:11px;padding:10px 12px;border-radius:11px;border:1px solid rgba(255,86,65,.2);background:rgba(255,67,37,.07);color:#ff9d8b;font-size:9px;line-height:1.5}.crypto-payment-error.hidden{display:none}@media(max-width:620px){.payment-method-card{border-radius:20px;padding:18px}.payment-plan-summary{align-items:flex-start}.payment-method-head h2{font-size:22px}}
    `;
    document.head.appendChild(style);
  }

  function selectedPlanDetail(modal) {
    const selected = modal.dataset.plan || "standard";
    const index = Math.max(0, PLAN_KEYS.indexOf(selected));
    const priceElement = priceElements()[index];
    return { plan: PLAN_KEYS[index], planName: PLAN_NAMES[index], rubPrice: PLAN_PRICES_RUB[index], usdPrice: Number(priceElement?.dataset.usdPrice || 0) };
  }

  function paymentMethodFromButton(button) {
    return button.dataset.cryptoCurrency === "usdt" ? "USDT_BEP20" : "LTC";
  }

  async function createInvoiceAndRedirect(modal, button) {
    const token = localStorage.getItem(TOKEN_KEY) || "";
    if (!token) {
      location.href = "portal.html#login";
      return;
    }

    const errorBox = modal.querySelector("#cryptoPaymentError");
    errorBox?.classList.add("hidden");
    modal.querySelectorAll("[data-crypto-currency]").forEach((item) => { item.disabled = true; });
    const originalHtml = button.innerHTML;
    const copy = button.querySelector(".crypto-coin-copy");
    if (copy) copy.innerHTML = `<strong>Creating payment…</strong><small>Please wait</small>`;

    try {
      const detail = selectedPlanDetail(modal);
      const response = await fetch(`${API_BASE}/api/payments/crypto/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          plan: detail.plan,
          payment_method: paymentMethodFromButton(button)
        })
      });

      let payload = null;
      try { payload = await response.json(); } catch {}

      if (!response.ok) {
        const message = payload?.detail?.message || payload?.detail || "No se pudo crear la factura.";
        throw new Error(String(message));
      }

      if (!payload?.checkout_url) throw new Error("The payment link was not generated.");
      location.href = payload.checkout_url;
    } catch (error) {
      if (copy) button.innerHTML = originalHtml;
      if (errorBox) {
        errorBox.textContent = error.message || "Could not create the payment. Please try again.";
        errorBox.classList.remove("hidden");
      }
      modal.querySelectorAll("[data-crypto-currency]").forEach((item) => { item.disabled = false; });
    }
  }

  function ensurePaymentModal() {
    let modal = document.getElementById("paymentMethodModal");
    if (modal) return modal;
    ensurePaymentStyles();
    modal = document.createElement("div");
    modal.id = "paymentMethodModal";
    modal.className = "payment-method-modal hidden";
    modal.setAttribute("aria-hidden", "true");
    modal.innerHTML = `
      <div class="payment-method-backdrop" data-close-payment></div>
      <section class="payment-method-card" role="dialog" aria-modal="true" aria-labelledby="paymentMethodTitle">
        <header class="payment-method-head"><div><span class="payment-method-eyebrow">PAGO</span><h2 id="paymentMethodTitle">Elige cómo pagar</h2></div><button class="payment-method-close" type="button" data-close-payment aria-label="Cerrar">×</button></header>
        <div class="payment-plan-summary"><div><span>Plan seleccionado</span><strong id="paymentSelectedPlan">Standard</strong></div><strong class="payment-plan-price" id="paymentSelectedPrice">$0.00</strong></div>
        <div class="payment-stage-window"><div class="payment-stage-track" id="paymentStageTrack">
          <div class="payment-stage">
            <span class="payment-method-label">Método de pago</span>
            <div class="payment-method-list">
              <button class="payment-method-option" id="sbpPaymentsOption" type="button"><span class="payment-method-icon"><img src="https://sbp.nspk.ru/images/stub/logo.svg" alt="СБП"></span><span class="payment-method-copy"><strong>СБП</strong><small>Оплата через Систему быстрых платежей</small></span><span class="payment-method-arrow">›</span></button>
              <button class="payment-method-option" id="cryptoPaymentsOption" type="button"><span class="payment-method-icon"><img src="assets/payments/crypto-payments.svg" alt="Crypto Payments"></span><span class="payment-method-copy"><strong>Crypto Payments</strong><small>Paga de forma segura con LTC o USDT</small></span><span class="payment-method-arrow">›</span></button>
            </div>
            <p class="payment-method-note">Selecciona el método de pago que prefieras.</p>
          </div>
          <div class="payment-stage">
            <div class="crypto-stage-head"><button class="crypto-back" id="cryptoBackButton" type="button" aria-label="Volver">‹</button><div><strong>Elige la moneda</strong><small>Selecciona la red con la que quieres pagar</small></div></div>
            <div class="crypto-coin-list">
              <button class="crypto-coin-option" type="button" data-crypto-currency="usdt" data-crypto-network="bep20"><span class="crypto-coin-icon"><img src="assets/payments/usdt-bep20.png" alt="USDT"></span><span class="crypto-coin-copy"><strong>USDT</strong><small>BNB Smart Chain · BEP20</small></span><span class="payment-method-arrow">›</span></button>
              <button class="crypto-coin-option" type="button" data-crypto-currency="ltc" data-crypto-network="litecoin"><span class="crypto-coin-icon"><img src="assets/payments/ltc-litecoin.png" alt="Litecoin"></span><span class="crypto-coin-copy"><strong>LTC</strong><small>Litecoin</small></span><span class="payment-method-arrow">›</span></button>
            </div>
            <div class="crypto-payment-error hidden" id="cryptoPaymentError"></div>
            <p class="payment-method-note">La dirección y el importe exacto aparecerán en el siguiente paso.</p>
          </div>
        </div>
      </section>`;
    document.body.appendChild(modal);
    modal.querySelectorAll("[data-close-payment]").forEach((el) => el.addEventListener("click", closePaymentModal));
    modal.querySelector("#cryptoPaymentsOption")?.addEventListener("click", () => modal.querySelector("#paymentStageTrack")?.classList.add("show-coins"));
    modal.querySelector("#cryptoBackButton")?.addEventListener("click", () => modal.querySelector("#paymentStageTrack")?.classList.remove("show-coins"));
    modal.querySelectorAll("[data-crypto-currency]").forEach((button) => button.addEventListener("click", () => createInvoiceAndRedirect(modal, button)));
    return modal;
  }

  function openPaymentModal(index) {
    const modal = ensurePaymentModal();
    const priceElement = priceElements()[index];
    modal.dataset.plan = PLAN_KEYS[index] || PLAN_KEYS[0];
    modal.querySelector("#paymentSelectedPlan").textContent = PLAN_NAMES[index] || PLAN_NAMES[0];
    modal.querySelector("#paymentSelectedPrice").textContent = priceElement?.textContent?.trim() || formatUsd(PLAN_PRICES_RUB[index] / (readCachedRate() || FALLBACK_USD_RUB));
    modal.querySelector("#paymentStageTrack")?.classList.remove("show-coins");
    modal.querySelector("#cryptoPaymentError")?.classList.add("hidden");
    modal.querySelectorAll("[data-crypto-currency]").forEach((item) => { item.disabled = false; });
    modal.classList.remove("hidden");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }

  function closePaymentModal() {
    const modal = document.getElementById("paymentMethodModal");
    if (!modal) return;
    modal.classList.add("hidden");
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }

  function bindPlanPaymentSelectors() {
    document.querySelectorAll(".plan-choice").forEach((planElement, index) => planElement.addEventListener("click", (event) => { event.preventDefault(); openPaymentModal(index); }));
    document.addEventListener("keydown", (event) => { if (event.key === "Escape") closePaymentModal(); });
  }

  function bootMarketPrices() {
    renderPrices(readCachedRate() || FALLBACK_USD_RUB);
    refreshMarketPrices();
    bindPlanPaymentSelectors();
    setInterval(() => { if (!document.hidden) refreshMarketPrices(); }, REFRESH_INTERVAL_MS);
    document.addEventListener("visibilitychange", () => { if (!document.hidden) refreshMarketPrices(); });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", bootMarketPrices, { once: true });
  else bootMarketPrices();
})();