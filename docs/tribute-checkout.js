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
      showTributeMessage(
        "Antes de pagar, vincula tu Telegram a tu cuenta VeiCloud. Después vuelve a elegir el plan. Usa en Tribute el mismo Telegram que vinculaste."
      );
      return;
    }

    if (!response.ok) {
      const message = payload?.detail?.message || payload?.detail || "No se pudo iniciar el pago. Inténtalo de nuevo.";
      showTributeMessage(typeof message === "string" ? message : "No se pudo iniciar el pago. Inténtalo de nuevo.");
      return;
    }

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
  continuePendingTributeCheckout();
});

window.VeiCloudTributeCheckout = openTributeCheckout;
