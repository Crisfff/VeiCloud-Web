const TRIBUTE_API_BASE = "https://api.veicloud.online:8443";
const TRIBUTE_TOKEN_KEY = "veicloud_web_token";
const TRIBUTE_VALID_PLANS = new Set(["standard", "gold", "premium"]);

function normalizeTributePlan(value) {
  const plan = String(value || "").trim().toLowerCase();
  return TRIBUTE_VALID_PLANS.has(plan) ? plan : "";
}

function getTributeToken() {
  return localStorage.getItem(TRIBUTE_TOKEN_KEY) || "";
}

function clearTributeDashboardMessage() {
  const dashboardError = document.getElementById("dashboardError");
  if (!dashboardError) return;
  dashboardError.textContent = "";
  dashboardError.classList.add("hidden");
}

function showTributeMessage(message) {
  const dashboardError = document.getElementById("dashboardError");
  if (dashboardError) {
    dashboardError.textContent = message;
    dashboardError.classList.remove("hidden");
    dashboardError.scrollIntoView({ behavior: "smooth", block: "center" });
    return;
  }

  window.alert(message);
}

function ensureTelegramLinkStyles() {
  if (document.getElementById("veicloudTelegramLinkStyles")) return;

  const style = document.createElement("style");
  style.id = "veicloudTelegramLinkStyles";
  style.textContent = `
    .telegram-link-alert{display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap}
    .telegram-link-alert-copy{display:flex;align-items:flex-start;gap:10px;min-width:0;flex:1}
    .telegram-link-alert-copy svg{width:18px;height:18px;flex:0 0 auto;margin-top:1px}
    .telegram-link-alert-copy span{line-height:1.55}
    .telegram-link-action{border:0;border-radius:11px;background:linear-gradient(135deg,#ff684c,#ff4325);color:#fff;font-weight:800;font-size:11px;padding:10px 14px;cursor:pointer;white-space:nowrap;box-shadow:0 8px 20px rgba(255,67,37,.18)}
    .telegram-link-modal{position:fixed;inset:0;z-index:260;display:grid;place-items:center;padding:22px}
    .telegram-link-modal.hidden{display:none!important}
    .telegram-link-backdrop{position:absolute;inset:0;background:rgba(0,0,0,.76);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px)}
    .telegram-link-card{position:relative;width:min(500px,94vw);background:linear-gradient(180deg,#15181d,#0b0d11);border:1px solid rgba(255,255,255,.1);border-radius:24px;padding:23px;box-shadow:0 34px 110px rgba(0,0,0,.65)}
    .telegram-link-head{display:flex;justify-content:space-between;align-items:flex-start;gap:18px;margin-bottom:18px}
    .telegram-link-kicker{display:block;color:#ff7258;font-size:9px;font-weight:800;letter-spacing:.16em;margin-bottom:7px}
    .telegram-link-head h2{margin:0;color:#fff;font:800 25px/1.1 Manrope,Inter,sans-serif;letter-spacing:-.8px}
    .telegram-link-close{width:38px;height:38px;border-radius:11px;border:1px solid rgba(255,255,255,.08);background:#101217;color:#a1a6ae;font-size:20px;cursor:pointer}
    .telegram-link-intro{margin:0 0 17px;color:#8d939d;font-size:12px;line-height:1.65}
    .telegram-link-steps{display:grid;gap:9px;margin:0 0 18px;padding:0;list-style:none;counter-reset:tgstep}
    .telegram-link-steps li{counter-increment:tgstep;display:flex;align-items:flex-start;gap:10px;color:#bbc0c7;font-size:11px;line-height:1.5}
    .telegram-link-steps li::before{content:counter(tgstep);width:23px;height:23px;flex:0 0 auto;border-radius:8px;display:grid;place-items:center;background:rgba(255,67,37,.1);color:#ff7258;font-size:10px;font-weight:800}
    .telegram-link-label{display:block;color:#8f959e;font-size:10px;font-weight:700;margin-bottom:7px}
    .telegram-link-input{width:100%;height:48px;box-sizing:border-box;border-radius:12px;border:1px solid rgba(255,255,255,.1);background:#090b0e;color:#fff;padding:0 13px;outline:none;font-size:15px;letter-spacing:.08em;text-transform:uppercase}
    .telegram-link-input:focus{border-color:rgba(255,67,37,.5);box-shadow:0 0 0 3px rgba(255,67,37,.08)}
    .telegram-link-error{display:none;margin:10px 0 0;padding:10px 12px;border-radius:10px;background:rgba(255,67,37,.07);border:1px solid rgba(255,67,37,.18);color:#ff9a87;font-size:10px;line-height:1.5}
    .telegram-link-error.visible{display:block}
    .telegram-link-submit{width:100%;height:47px;margin-top:15px;border:0;border-radius:12px;background:linear-gradient(135deg,#ff684c,#ff4325);color:#fff;font-weight:800;cursor:pointer}
    .telegram-link-submit:disabled{opacity:.6;cursor:wait}
    .telegram-link-foot{margin:12px 2px 0;color:#686e77;font-size:9px;line-height:1.55}
    @media(max-width:620px){.telegram-link-alert{align-items:stretch}.telegram-link-action{width:100%}.telegram-link-card{padding:19px;border-radius:20px}}
  `;
  document.head.appendChild(style);
}

function ensureTelegramLinkModal() {
  let modal = document.getElementById("telegramLinkModal");
  if (modal) return modal;

  ensureTelegramLinkStyles();

  modal = document.createElement("div");
  modal.id = "telegramLinkModal";
  modal.className = "telegram-link-modal hidden";
  modal.setAttribute("aria-hidden", "true");
  modal.innerHTML = `
    <div class="telegram-link-backdrop" data-close-telegram-link></div>
    <section class="telegram-link-card" role="dialog" aria-modal="true" aria-labelledby="telegramLinkTitle">
      <header class="telegram-link-head">
        <div><span class="telegram-link-kicker">TELEGRAM</span><h2 id="telegramLinkTitle">Vincular Telegram</h2></div>
        <button class="telegram-link-close" type="button" data-close-telegram-link aria-label="Cerrar">×</button>
      </header>
      <p class="telegram-link-intro">Vincula la misma cuenta de Telegram que utilizarás para pagar en Tribute. Así VeiCloud sabrá exactamente qué cuenta debe activar.</p>
      <ol class="telegram-link-steps">
        <li>Abre el bot de VeiCloud en Telegram y solicita vincular tu cuenta.</li>
        <li>El bot te dará un código temporal de vinculación.</li>
        <li>Pega ese código aquí y confirma.</li>
      </ol>
      <label class="telegram-link-label" for="telegramLinkCode">Código de vinculación</label>
      <input class="telegram-link-input" id="telegramLinkCode" type="text" autocomplete="one-time-code" spellcheck="false" placeholder="Pega el código aquí">
      <div class="telegram-link-error" id="telegramLinkError"></div>
      <button class="telegram-link-submit" id="telegramLinkSubmit" type="button">Vincular y continuar</button>
      <p class="telegram-link-foot">El código es de un solo uso y caduca automáticamente. No compartas códigos de vinculación con otras personas.</p>
    </section>`;

  document.body.appendChild(modal);

  const close = () => {
    modal.classList.add("hidden");
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  };

  modal.querySelectorAll("[data-close-telegram-link]").forEach((element) => {
    element.addEventListener("click", close);
  });

  modal.addEventListener("keydown", (event) => {
    if (event.key === "Escape") close();
  });

  return modal;
}

function openTelegramLinkModal(planValue) {
  const plan = normalizeTributePlan(planValue);
  if (!plan) return;

  const modal = ensureTelegramLinkModal();
  modal.dataset.plan = plan;

  const input = modal.querySelector("#telegramLinkCode");
  const errorBox = modal.querySelector("#telegramLinkError");
  const submit = modal.querySelector("#telegramLinkSubmit");

  if (input) input.value = "";
  errorBox?.classList.remove("visible");
  if (errorBox) errorBox.textContent = "";
  if (submit) {
    submit.disabled = false;
    submit.textContent = "Vincular y continuar";
  }

  modal.classList.remove("hidden");
  modal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";

  window.setTimeout(() => input?.focus(), 80);
}

function showTelegramLinkAction(planValue) {
  const plan = normalizeTributePlan(planValue);
  if (!plan) return;

  ensureTelegramLinkStyles();

  const dashboardError = document.getElementById("dashboardError");
  if (!dashboardError) {
    openTelegramLinkModal(plan);
    return;
  }

  dashboardError.textContent = "";

  const wrapper = document.createElement("div");
  wrapper.className = "telegram-link-alert";

  const copy = document.createElement("div");
  copy.className = "telegram-link-alert-copy";
  copy.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z"></path><path d="m8 10 2.5 2.5L16 7"></path></svg><span>Antes de pagar, vincula tu Telegram a tu cuenta VeiCloud. Usa en Tribute esa misma cuenta de Telegram.</span>`;

  const button = document.createElement("button");
  button.type = "button";
  button.className = "telegram-link-action";
  button.textContent = "Vincular Telegram";
  button.addEventListener("click", () => openTelegramLinkModal(plan));

  wrapper.append(copy, button);
  dashboardError.appendChild(wrapper);
  dashboardError.classList.remove("hidden");
  dashboardError.scrollIntoView({ behavior: "smooth", block: "center" });
}

async function confirmTelegramLink(planValue) {
  const plan = normalizeTributePlan(planValue);
  const modal = ensureTelegramLinkModal();
  const token = getTributeToken();
  const input = modal.querySelector("#telegramLinkCode");
  const errorBox = modal.querySelector("#telegramLinkError");
  const submit = modal.querySelector("#telegramLinkSubmit");
  const code = String(input?.value || "").trim();

  if (!token) {
    location.href = `portal.html?plan=${encodeURIComponent(plan)}#login`;
    return;
  }

  if (!code) {
    if (errorBox) {
      errorBox.textContent = "Introduce el código que te dio el bot de VeiCloud.";
      errorBox.classList.add("visible");
    }
    input?.focus();
    return;
  }

  if (submit) {
    submit.disabled = true;
    submit.textContent = "Vinculando…";
  }
  errorBox?.classList.remove("visible");

  try {
    const response = await fetch(`${TRIBUTE_API_BASE}/api/telegram/link/confirm`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ code })
    });

    let payload = null;
    try {
      payload = await response.json();
    } catch {
      payload = null;
    }

    if (response.status === 401) {
      localStorage.removeItem(TRIBUTE_TOKEN_KEY);
      location.href = `portal.html?plan=${encodeURIComponent(plan)}#login`;
      return;
    }

    if (!response.ok || payload?.linked !== true) {
      const message = payload?.detail?.message || payload?.detail || "No se pudo vincular Telegram.";
      throw new Error(typeof message === "string" ? message : "No se pudo vincular Telegram.");
    }

    clearTributeDashboardMessage();
    modal.classList.add("hidden");
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";

    await openTributeCheckout(plan);
  } catch (error) {
    if (errorBox) {
      errorBox.textContent = error?.message || "No se pudo vincular Telegram. Revisa el código e inténtalo otra vez.";
      errorBox.classList.add("visible");
    }
    if (submit) {
      submit.disabled = false;
      submit.textContent = "Vincular y continuar";
    }
  }
}

async function openTributeCheckout(planValue) {
  const plan = normalizeTributePlan(planValue);
  if (!plan) return;

  const token = getTributeToken();

  if (!token) {
    const destination = `portal.html?plan=${encodeURIComponent(plan)}#login`;
    if (!location.pathname.endsWith("/portal.html") && !location.pathname.endsWith("portal.html")) {
      location.href = destination;
    }
    return;
  }

  try {
    const response = await fetch(
      `${TRIBUTE_API_BASE}/api/payments/tribute/checkout/${encodeURIComponent(plan)}`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`
        },
        cache: "no-store"
      }
    );

    let payload = null;
    try {
      payload = await response.json();
    } catch {
      payload = null;
    }

    if (response.status === 401) {
      localStorage.removeItem(TRIBUTE_TOKEN_KEY);
      location.href = `portal.html?plan=${encodeURIComponent(plan)}#login`;
      return;
    }

    if (response.status === 409 && payload?.detail?.code === "TELEGRAM_NOT_LINKED") {
      showTelegramLinkAction(plan);
      return;
    }

    if (!response.ok) {
      const message = payload?.detail?.message || payload?.detail || "No se pudo iniciar el pago. Inténtalo de nuevo.";
      showTributeMessage(typeof message === "string" ? message : "No se pudo iniciar el pago. Inténtalo de nuevo.");
      return;
    }

    clearTributeDashboardMessage();

    const checkoutUrl = String(payload?.checkout_url || "").trim();
    if (!checkoutUrl.startsWith("https://web.tribute.tg/")) {
      showTributeMessage("El enlace de pago no está disponible en este momento.");
      return;
    }

    location.href = checkoutUrl;
  } catch {
    showTributeMessage("No se pudo conectar con el sistema de pagos. Inténtalo de nuevo en unos segundos.");
  }
}

function wireTributeButtons() {
  document.querySelectorAll("[data-tribute-plan]").forEach((element) => {
    element.addEventListener("click", (event) => {
      event.preventDefault();
      openTributeCheckout(element.dataset.tributePlan);
    });
  });
}

function wireTelegramLinkModal() {
  const modal = ensureTelegramLinkModal();
  const submit = modal.querySelector("#telegramLinkSubmit");
  const input = modal.querySelector("#telegramLinkCode");

  submit?.addEventListener("click", () => confirmTelegramLink(modal.dataset.plan));
  input?.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      confirmTelegramLink(modal.dataset.plan);
    }
  });
}

function continuePendingTributeCheckout() {
  const params = new URLSearchParams(location.search);
  const plan = normalizeTributePlan(params.get("plan"));
  if (!plan) return;

  let completed = false;
  let attempts = 0;

  const tryCheckout = async () => {
    if (completed) return;
    attempts += 1;

    if (getTributeToken()) {
      completed = true;
      await openTributeCheckout(plan);
      return;
    }

    if (attempts >= 1200) {
      completed = true;
    }
  };

  tryCheckout();
  const timer = setInterval(() => {
    if (completed) {
      clearInterval(timer);
      return;
    }
    tryCheckout();
  }, 500);
}

document.addEventListener("DOMContentLoaded", () => {
  wireTributeButtons();
  wireTelegramLinkModal();
  continuePendingTributeCheckout();
});

window.VeiCloudTributeCheckout = openTributeCheckout;
window.VeiCloudTelegramLink = openTelegramLinkModal;
