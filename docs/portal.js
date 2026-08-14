const API_BASE = "https://api.veicloud.online:8443";
const TOKEN_KEY = "veicloud_web_token";

const authView = document.getElementById("authView");
const dashboardView = document.getElementById("dashboardView");
const loginTab = document.getElementById("loginTab");
const registerTab = document.getElementById("registerTab");
const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");
const loginError = document.getElementById("loginError");
const registerError = document.getElementById("registerError");
const logoutButton = document.getElementById("logoutButton");
const refreshButton = document.getElementById("refreshButton");
const devicesList = document.getElementById("devicesList");
const dashboardError = document.getElementById("dashboardError");

const addAccessButton = document.getElementById("addAccessButton");
const accessModal = document.getElementById("accessModal");
const guestOption = document.getElementById("guestOption");
const amneziaOption = document.getElementById("amneziaOption");
const guestAccessPanel = document.getElementById("guestAccessPanel");
const amneziaAccessPanel = document.getElementById("amneziaAccessPanel");
const createInvitationButton = document.getElementById("createInvitationButton");
const invitationResult = document.getElementById("invitationResult");
const amneziaServerSelect = document.getElementById("amneziaServerSelect");
const amneziaDeviceName = document.getElementById("amneziaDeviceName");
const createAmneziaButton = document.getElementById("createAmneziaButton");
const amneziaResult = document.getElementById("amneziaResult");

let amneziaLocationsLoaded = false;

function refreshIcons() {
  if (window.lucide) window.lucide.createIcons();
}

function getToken() {
  return localStorage.getItem(TOKEN_KEY) || "";
}

function saveToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

function showError(element, message) {
  element.textContent = message || "";
  element.classList.toggle("hidden", !message);
}

function setLoading(button, loading, label) {
  if (!button) return;
  button.disabled = loading;
  button.classList.toggle("loading", loading);
  if (label) button.dataset.originalLabel = button.textContent;
}

async function readJson(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function authMessage(status, payload, mode) {
  const detail = payload?.detail;
  if (status === 409) return "Ya existe una cuenta con este correo electrónico.";
  if (status === 401 || status === 403) return "Correo o contraseña incorrectos.";
  if (status === 422 || status === 400) {
    if (Array.isArray(detail)) return "Revisa el correo y la contraseña e inténtalo de nuevo.";
    return typeof detail === "string" ? detail : "Los datos introducidos no son válidos.";
  }
  if (status === 429) return "Demasiados intentos. Espera un momento e inténtalo de nuevo.";
  if (status >= 500) return "VeiCloud no está disponible en este momento.";
  return typeof detail === "string" ? detail : `No se pudo ${mode === "register" ? "crear la cuenta" : "iniciar sesión"}.`;
}

function apiErrorMessage(error, fallback) {
  const detail = error?.payload?.detail;
  if (typeof detail === "string") return detail;
  if (detail?.message) return detail.message;
  if (error?.status === 409) return "No quedan espacios disponibles en tu plan.";
  if (error?.status === 403) return "Necesitas una suscripción activa para realizar esta acción.";
  return fallback;
}

function openLogin() {
  loginTab.classList.add("active");
  registerTab.classList.remove("active");
  loginForm.classList.remove("hidden");
  registerForm.classList.add("hidden");
  history.replaceState(null, "", "#login");
  refreshIcons();
}

function openRegister() {
  registerTab.classList.add("active");
  loginTab.classList.remove("active");
  registerForm.classList.remove("hidden");
  loginForm.classList.add("hidden");
  history.replaceState(null, "", "#register");
  refreshIcons();
}

function showDashboard() {
  authView.classList.add("hidden");
  dashboardView.classList.remove("hidden");
  refreshIcons();
}

function showAuth() {
  dashboardView.classList.add("hidden");
  authView.classList.remove("hidden");
  refreshIcons();
}

async function api(path, options = {}) {
  const token = getToken();
  const headers = {
    Accept: "application/json",
    ...(options.headers || {})
  };

  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
    cache: "no-store"
  });

  const payload = await readJson(response);

  if (response.status === 401 && token) {
    clearToken();
    showAuth();
    openLogin();
    throw new Error("SESSION_EXPIRED");
  }

  if (!response.ok) {
    const error = new Error(
      typeof payload?.detail === "string"
        ? payload.detail
        : payload?.detail?.message || `HTTP ${response.status}`
    );
    error.status = response.status;
    error.payload = payload;
    throw error;
  }

  return payload;
}

function normalizePlan(value) {
  const plan = String(value || "standard").toLowerCase();
  if (plan === "gold") return "Gold";
  if (plan === "premium") return "Premium";
  return "Standard";
}

function formatPublicId(value, fallback) {
  const raw = String(value || fallback || "").replace(/\D/g, "");
  return raw ? raw.padStart(6, "0").slice(-6) : "------";
}

function formatDate(value) {
  if (!value) return "Sin fecha de vencimiento";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Fecha no disponible";
  return new Intl.DateTimeFormat("es", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(date);
}

function devicePresentation(device) {
  const type = String(device?.device_type || "").toLowerCase();
  const accessType = String(device?.access_type || "").toLowerCase();
  const guest = Boolean(device?.is_guest);

  if (accessType === "amnezia" || type.includes("amnezia")) {
    return {
      icon: "key-round",
      badge: "Amnezia VPN",
      badgeClass: "amnezia",
      subtitle: "Acceso Amnezia"
    };
  }

  if (guest || accessType === "veicloud_guest") {
    return {
      icon: "user-round-plus",
      badge: "Invitado VeiCloud VPN",
      badgeClass: "guest",
      subtitle: "Invitado"
    };
  }

  let icon = "smartphone";
  if (type.includes("tv")) icon = "tv";
  else if (type.includes("web") || type.includes("pc") || type.includes("windows")) icon = "monitor";
  else if (type.includes("tablet")) icon = "tablet";

  return {
    icon,
    badge: "VeiCloud VPN",
    badgeClass: "owner",
    subtitle: type ? type.toUpperCase() : "DISPOSITIVO"
  };
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderDevices(data) {
  const items = Array.isArray(data?.devices) ? data.devices : [];

  if (!items.length) {
    devicesList.innerHTML = '<div class="empty-card"><i data-lucide="monitor-off"></i>No hay dispositivos registrados en esta cuenta.</div>';
    refreshIcons();
    return;
  }

  devicesList.innerHTML = items.map((device) => {
    const name = device.device_name || "Dispositivo VeiCloud";
    const active = device.is_active !== false;
    const locationCount = Number(device.server_count || 0);
    const presentation = devicePresentation(device);
    const locationText = locationCount
      ? `${locationCount} ubicacion${locationCount === 1 ? "" : "es"}`
      : "Sin acceso VPN asignado";

    return `
      <article class="device-row">
        <div class="device-main">
          <div class="device-icon"><i data-lucide="${presentation.icon}"></i></div>
          <div class="device-copy">
            <strong>${escapeHtml(name)}<span class="device-badge ${presentation.badgeClass}">${escapeHtml(presentation.badge)}</span></strong>
            <small>${escapeHtml(presentation.subtitle)} · ${escapeHtml(locationText)}</small>
          </div>
        </div>
        <div class="device-meta">
          <span class="${active ? "" : "inactive"}">${active ? "Activo" : "Inactivo"}</span>
          <small>${device.last_seen_at ? `Último acceso ${formatDate(device.last_seen_at)}` : "Registrado en VeiCloud"}</small>
        </div>
      </article>`;
  }).join("");

  refreshIcons();
}

async function loadDashboard() {
  dashboardError.classList.add("hidden");
  devicesList.innerHTML = '<div class="loading-card"><i data-lucide="loader-circle"></i>Cargando dispositivos...</div>';
  refreshIcons();
  refreshButton?.querySelector("svg")?.classList.add("spin");

  try {
    const [user, devices] = await Promise.all([
      api("/api/user/me"),
      api("/api/vpn/devices")
    ]);

    const plan = normalizePlan(devices?.plan || user?.plan);
    const maxDevices = Number(devices?.max_devices ?? user?.max_devices ?? 1);
    const used = Number(devices?.devices_used ?? devices?.devices?.length ?? 0);
    const available = Number(devices?.devices_available ?? Math.max(maxDevices - used, 0));
    const publicId = formatPublicId(user?.public_id, user?.id);
    const email = user?.email || "Cuenta VeiCloud";
    const premiumUntil = devices?.premium_until || user?.premium_until || null;
    const active = user?.is_active !== false;

    document.getElementById("welcomeName").textContent = email.split("@")[0] || "VeiCloud";
    document.getElementById("chipEmail").textContent = email;
    document.getElementById("chipId").textContent = `ID · ${publicId}`;
    document.getElementById("planName").textContent = plan;
    document.getElementById("planStatus").textContent = `${maxDevices} dispositivo${maxDevices === 1 ? "" : "s"} incluido${maxDevices === 1 ? "" : "s"} en tu plan`;
    document.getElementById("devicesFraction").textContent = `${used}/${maxDevices}`;
    document.getElementById("publicId").textContent = publicId;
    document.getElementById("devicesAvailable").textContent = String(available);
    document.getElementById("subscriptionStatus").textContent = active ? "Activa" : "Inactiva";
    document.getElementById("subscriptionUntil").textContent = premiumUntil ? `Válida hasta ${formatDate(premiumUntil)}` : "Cuenta VeiCloud activa";

    const degrees = maxDevices > 0 ? Math.min(used / maxDevices, 1) * 360 : 0;
    document.getElementById("capacityRing").style.setProperty("--usage", `${degrees}deg`);

    if (addAccessButton) {
      addAccessButton.disabled = available <= 0;
      addAccessButton.title = available <= 0 ? "No quedan espacios disponibles en tu plan" : "Añadir un nuevo acceso";
    }

    renderDevices(devices);
  } catch (error) {
    if (error.message === "SESSION_EXPIRED") return;
    dashboardError.textContent = "No se pudieron cargar todos los datos de tu cuenta. Comprueba la conexión e inténtalo de nuevo.";
    dashboardError.classList.remove("hidden");
    devicesList.innerHTML = '<div class="empty-card"><i data-lucide="triangle-alert"></i>No se pudieron cargar los dispositivos.</div>';
    refreshIcons();
  } finally {
    refreshButton?.querySelector("svg")?.classList.remove("spin");
  }
}

function resetAccessResults() {
  invitationResult?.classList.add("hidden");
  amneziaResult?.classList.add("hidden");
  if (invitationResult) invitationResult.innerHTML = "";
  if (amneziaResult) amneziaResult.innerHTML = "";
}

function openAccessModal() {
  resetAccessResults();
  accessModal.classList.remove("hidden");
  accessModal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
  selectGuestAccess();
  refreshIcons();
}

function closeAccessModal() {
  accessModal.classList.add("hidden");
  accessModal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

function selectGuestAccess() {
  guestOption.classList.add("active");
  amneziaOption.classList.remove("active");
  guestAccessPanel.classList.remove("hidden");
  amneziaAccessPanel.classList.add("hidden");
  refreshIcons();
}

async function selectAmneziaAccess() {
  guestOption.classList.remove("active");
  amneziaOption.classList.add("active");
  guestAccessPanel.classList.add("hidden");
  amneziaAccessPanel.classList.remove("hidden");
  refreshIcons();
  if (!amneziaLocationsLoaded) await loadAmneziaLocations();
}

async function loadAmneziaLocations() {
  amneziaServerSelect.innerHTML = '<option value="">Cargando ubicaciones...</option>';

  try {
    const payload = await api("/api/vpn/amnezia-locations");
    const items = Array.isArray(payload?.items) ? payload.items : [];

    if (!items.length) {
      amneziaServerSelect.innerHTML = '<option value="">No hay ubicaciones disponibles</option>';
      return;
    }

    amneziaServerSelect.innerHTML = items.map((server) => {
      const label = [server.country, server.city].filter(Boolean).join(" · ") || server.server_name || `Servidor ${server.server_id}`;
      return `<option value="${Number(server.server_id)}">${escapeHtml(label)}</option>`;
    }).join("");

    if (payload?.recommended_server_id) {
      amneziaServerSelect.value = String(payload.recommended_server_id);
    }

    amneziaLocationsLoaded = true;
  } catch (error) {
    amneziaServerSelect.innerHTML = '<option value="">No se pudieron cargar las ubicaciones</option>';
    showAccessResult(amneziaResult, apiErrorMessage(error, "No se pudieron cargar las ubicaciones."), true);
  }
}

function showAccessResult(element, value, isError = false, title = "") {
  element.classList.remove("hidden", "error");
  if (isError) element.classList.add("error");

  if (isError) {
    element.innerHTML = `<strong>${escapeHtml(value)}</strong>`;
  } else {
    element.innerHTML = `
      <strong>${escapeHtml(title)}</strong>
      <code>${escapeHtml(value)}</code>
      <button class="copy-access" type="button" data-copy-value="${escapeHtml(value)}"><i data-lucide="copy"></i>Copiar</button>`;
  }

  refreshIcons();
}

async function copyText(value, button) {
  try {
    await navigator.clipboard.writeText(value);
    const original = button.innerHTML;
    button.innerHTML = '<i data-lucide="check"></i>Copiado';
    refreshIcons();
    setTimeout(() => {
      button.innerHTML = original;
      refreshIcons();
    }, 1400);
  } catch {
    window.prompt("Copia este valor:", value);
  }
}

async function createInvitation() {
  createInvitationButton.disabled = true;
  const oldText = createInvitationButton.textContent;
  createInvitationButton.textContent = "Generando...";
  invitationResult.classList.add("hidden");

  try {
    const payload = await api("/api/vpn/invitations", {
      method: "POST"
    });

    showAccessResult(
      invitationResult,
      payload?.code || "",
      false,
      "Clave de invitación creada · válida durante 24 horas"
    );
  } catch (error) {
    showAccessResult(
      invitationResult,
      apiErrorMessage(error, "No se pudo generar la invitación."),
      true
    );
  } finally {
    createInvitationButton.disabled = false;
    createInvitationButton.textContent = oldText;
  }
}

async function createAmneziaAccess() {
  const serverId = Number(amneziaServerSelect.value);
  const deviceName = (amneziaDeviceName.value || "AmneziaVPN").trim();

  if (!serverId) {
    showAccessResult(amneziaResult, "Selecciona una ubicación disponible.", true);
    return;
  }

  createAmneziaButton.disabled = true;
  const oldText = createAmneziaButton.textContent;
  createAmneziaButton.textContent = "Creando acceso...";
  amneziaResult.classList.add("hidden");

  try {
    const payload = await api("/api/vpn/amnezia-access", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        device_name: deviceName || "AmneziaVPN",
        server_id: serverId
      })
    });

    const vpnKey = payload?.vpn?.amnezia_vpn_key || payload?.vpn_locations?.[0]?.amnezia_vpn_key;

    if (!vpnKey) {
      showAccessResult(amneziaResult, "El acceso fue creado, pero no se recibió una clave vpn://.", true);
    } else {
      showAccessResult(amneziaResult, vpnKey, false, "Acceso Amnezia VPN creado correctamente");
    }

    await loadDashboard();
  } catch (error) {
    showAccessResult(
      amneziaResult,
      apiErrorMessage(error, "No se pudo crear el acceso Amnezia VPN."),
      true
    );
  } finally {
    createAmneziaButton.disabled = false;
    createAmneziaButton.textContent = oldText;
  }
}

loginTab.addEventListener("click", openLogin);
registerTab.addEventListener("click", openRegister);
document.querySelectorAll("[data-open-register]").forEach((button) => button.addEventListener("click", openRegister));
document.querySelectorAll("[data-open-login]").forEach((button) => button.addEventListener("click", openLogin));

document.querySelectorAll(".toggle-password").forEach((button) => {
  button.addEventListener("click", () => {
    const input = document.getElementById(button.dataset.target);
    const showing = input.type === "text";
    input.type = showing ? "password" : "text";
    button.innerHTML = `<i data-lucide="${showing ? "eye" : "eye-off"}"></i>`;
    button.setAttribute("aria-label", showing ? "Mostrar contraseña" : "Ocultar contraseña");
    refreshIcons();
  });
});

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  showError(loginError, "");

  const email = document.getElementById("loginEmail").value.trim().toLowerCase();
  const password = document.getElementById("loginPassword").value;
  const button = document.getElementById("loginSubmit");
  setLoading(button, true);

  try {
    const response = await fetch(`${API_BASE}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      body: JSON.stringify({ email, password })
    });

    const payload = await readJson(response);

    if (!response.ok) {
      showError(loginError, authMessage(response.status, payload, "login"));
      return;
    }

    if (!payload?.access_token) {
      showError(loginError, "VeiCloud no devolvió una sesión válida.");
      return;
    }

    saveToken(payload.access_token);
    document.getElementById("loginPassword").value = "";
    showDashboard();
    await loadDashboard();
  } catch {
    showError(loginError, "No se pudo conectar con VeiCloud. Revisa tu conexión.");
  } finally {
    setLoading(button, false);
  }
});

registerForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  showError(registerError, "");

  const email = document.getElementById("registerEmail").value.trim().toLowerCase();
  const password = document.getElementById("registerPassword").value;
  const confirm = document.getElementById("registerConfirm").value;
  const button = document.getElementById("registerSubmit");

  if (password.length < 8) {
    showError(registerError, "La contraseña debe tener al menos 8 caracteres.");
    return;
  }

  if (password !== confirm) {
    showError(registerError, "Las contraseñas no coinciden.");
    return;
  }

  setLoading(button, true);

  try {
    const response = await fetch(`${API_BASE}/api/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      body: JSON.stringify({ email, password })
    });

    const payload = await readJson(response);

    if (!response.ok) {
      showError(registerError, authMessage(response.status, payload, "register"));
      return;
    }

    if (!payload?.access_token) {
      showError(registerError, "La cuenta fue creada, pero no se pudo abrir la sesión.");
      return;
    }

    saveToken(payload.access_token);
    document.getElementById("registerPassword").value = "";
    document.getElementById("registerConfirm").value = "";
    showDashboard();
    await loadDashboard();
  } catch {
    showError(registerError, "No se pudo conectar con VeiCloud. Revisa tu conexión.");
  } finally {
    setLoading(button, false);
  }
});

logoutButton.addEventListener("click", () => {
  clearToken();
  closeAccessModal();
  showAuth();
  openLogin();
});

refreshButton.addEventListener("click", loadDashboard);
document.querySelectorAll("[data-scroll-devices]").forEach((button) => {
  button.addEventListener("click", () => {
    document.getElementById("devicesSection").scrollIntoView({ behavior: "smooth" });
  });
});

addAccessButton?.addEventListener("click", openAccessModal);
document.querySelectorAll("[data-close-access]").forEach((element) => element.addEventListener("click", closeAccessModal));
guestOption?.addEventListener("click", selectGuestAccess);
amneziaOption?.addEventListener("click", selectAmneziaAccess);
createInvitationButton?.addEventListener("click", createInvitation);
createAmneziaButton?.addEventListener("click", createAmneziaAccess);

document.addEventListener("click", (event) => {
  const copyButton = event.target.closest("[data-copy-value]");
  if (copyButton) copyText(copyButton.dataset.copyValue || "", copyButton);
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !accessModal?.classList.contains("hidden")) closeAccessModal();
});

window.addEventListener("load", refreshIcons);

(async function boot() {
  refreshIcons();

  if (getToken()) {
    showDashboard();
    await loadDashboard();
    return;
  }

  showAuth();
  if (location.hash === "#register") openRegister();
  else openLogin();
})();