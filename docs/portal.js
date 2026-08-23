const API_BASE = "https://api.veicloud.online:8443";
const TOKEN_KEY = "veicloud_web_token";
const DEVICE_ID_KEY = "veicloud_web_device_id";

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

function getOrCreateDeviceId() {
  const existing = localStorage.getItem(DEVICE_ID_KEY);
  if (existing) return existing;

  let randomPart = "";

  if (window.crypto?.randomUUID) {
    randomPart = window.crypto.randomUUID();
  } else if (window.crypto?.getRandomValues) {
    const bytes = new Uint8Array(16);
    window.crypto.getRandomValues(bytes);
    randomPart = Array.from(bytes, (value) => value.toString(16).padStart(2, "0")).join("");
  } else {
    randomPart = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }

  const deviceId = `web:${randomPart}`.slice(0, 120);
  localStorage.setItem(DEVICE_ID_KEY, deviceId);
  return deviceId;
}

function getWebDeviceName() {
  const platform = String(
    navigator.userAgentData?.platform
      || navigator.platform
      || "Navegador"
  ).trim();

  return `VeiCloud Web · ${platform || "Navegador"}`.slice(0, 120);
}

function getAuthDevicePayload() {
  return {
    device_id: getOrCreateDeviceId(),
    device_name: getWebDeviceName(),
    device_type: "web"
  };
}

function showError(element, message) {
  if (!element) return;
  element.textContent = message || "";
  element.classList.toggle("hidden", !message);
}

function setLoading(button, loading) {
  if (!button) return;
  button.disabled = loading;
  button.classList.toggle("loading", loading);
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
  const detailCode = typeof detail === "object" && detail ? detail.code : null;
  const detailMessage = typeof detail === "object" && detail ? detail.message : null;

  if (detailCode === "DEVICE_LIMIT_REACHED") {
    return detailMessage || "Has alcanzado el límite de dispositivos de tu plan.";
  }

  if (detailCode === "DEVICE_ALREADY_REGISTERED") {
    return detailMessage || "Este navegador ya está asociado a otra sesión.";
  }

  if (detailCode === "DEVICE_ID_REQUIRED") {
    return "No se pudo identificar este navegador. Recarga la página e inténtalo de nuevo.";
  }

  if (status === 409) {
    return detailMessage || "Ya existe una cuenta con este correo electrónico.";
  }

  if (status === 401 || status === 403) return "Correo o contraseña incorrectos.";

  if (status === 422 || status === 400) {
    if (Array.isArray(detail)) return "Revisa el correo y la contraseña e inténtalo de nuevo.";
    if (typeof detail === "string") return detail;
    if (detailMessage) return detailMessage;
    return "Los datos introducidos no son válidos.";
  }

  if (status === 429) return "Demasiados intentos. Espera un momento e inténtalo de nuevo.";
  if (status >= 500) return "VeiCloud no está disponible en este momento.";

  return typeof detail === "string"
    ? detail
    : detailMessage || `No se pudo ${mode === "register" ? "crear la cuenta" : "iniciar sesión"}.`;
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

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
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
      subtitle: "Acceso Amnezia",
      deleteLabel: "Eliminar acceso Amnezia VPN"
    };
  }

  if (guest || accessType === "veicloud_guest") {
    return {
      icon: "user-round-plus",
      badge: "Invitado VeiCloud VPN",
      badgeClass: "guest",
      subtitle: "Invitado",
      deleteLabel: "Eliminar invitado VeiCloud VPN"
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
    subtitle: type ? type.toUpperCase() : "DISPOSITIVO",
    deleteLabel: "Eliminar dispositivo VeiCloud VPN"
  };
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
    const databaseId = Number(device.id);

    return `
      <article class="device-row" data-device-row="${databaseId}">
        <div class="device-main">
          <div class="device-icon"><i data-lucide="${presentation.icon}"></i></div>
          <div class="device-copy">
            <strong>${escapeHtml(name)}<span class="device-badge ${presentation.badgeClass}">${escapeHtml(presentation.badge)}</span></strong>
            <small>${escapeHtml(presentation.subtitle)} · ${escapeHtml(locationText)}</small>
          </div>
        </div>
        <div style="display:flex;align-items:center;gap:12px;flex:0 0 auto">
          <div class="device-meta">
            <span class="${active ? "" : "inactive"}">${active ? "Activo" : "Inactivo"}</span>
            <small>${device.last_seen_at ? `Último acceso ${formatDate(device.last_seen_at)}` : "Registrado en VeiCloud"}</small>
          </div>
          <button
            type="button"
            data-delete-device="${databaseId}"
            data-device-name="${escapeHtml(name)}"
            data-delete-label="${escapeHtml(presentation.deleteLabel)}"
            aria-label="${escapeHtml(presentation.deleteLabel)}"
            title="${escapeHtml(presentation.deleteLabel)}"
            style="width:38px;height:38px;border-radius:11px;border:1px solid rgba(255,67,37,.18);background:rgba(255,67,37,.055);color:#ff6a50;display:grid;place-items:center;cursor:pointer;flex:0 0 auto;transition:.2s"
          ><i data-lucide="trash-2"></i></button>
        </div>
      </article>`;
  }).join("");

  refreshIcons();
}

async function deleteDevice(deviceId, deviceName, deleteLabel, button) {
  if (!deviceId) return;

  const confirmed = window.confirm(
    `${deleteLabel || "Eliminar acceso"}\n\n` +
    `¿Seguro que quieres eliminar “${deviceName || "este dispositivo"}”?\n\n` +
    "Se revocarán sus configuraciones VPN y perderá el acceso inmediatamente."
  );

  if (!confirmed) return;

  const originalHtml = button?.innerHTML || "";

  try {
    if (button) {
      button.disabled = true;
      button.style.opacity = ".55";
      button.style.cursor = "wait";
      button.innerHTML = '<i data-lucide="loader-circle"></i>';
      refreshIcons();
      button.querySelector("svg")?.classList.add("spin");
    }

    dashboardError.classList.add("hidden");

    await api(`/api/vpn/devices/${deviceId}`, {
      method: "DELETE"
    });

    await loadDashboard();
  } catch (error) {
    dashboardError.textContent = apiErrorMessage(
      error,
      "No se pudo eliminar el dispositivo o acceso. Inténtalo de nuevo."
    );
    dashboardError.classList.remove("hidden");

    if (button) {
      button.disabled = false;
      button.style.opacity = "1";
      button.style.cursor = "pointer";
      button.innerHTML = originalHtml;
      refreshIcons();
    }
  }
}

async function loadDashboard() {
  dashboardError.classList.add("hidden");
  devicesList.innerHTML = '<div class="loading-card"><i data-lucide="loader-circle"></i>Cargando dispositivos...</div>';
  refreshIcons();
  refreshButton?.querySelector("svg")?.classList.add("spin");

  try {
    const user = await api("/api/user/me");

    let devices = null;
    try {
      devices = await api("/api/vpn/devices");
    } catch (error) {
      if (error.message === "SESSION_EXPIRED") throw error;
      devices = null;
    }

    const publicId = formatPublicId(user?.public_id, user?.id);
    const email = user?.email || "Cuenta VeiCloud";
    const premiumUntil = devices?.premium_until || user?.premium_until || null;
    const premiumFlag = Boolean(devices?.is_premium ?? user?.is_premium);
    const premiumUntilDate = premiumUntil ? new Date(premiumUntil) : null;
    const subscriptionActive = premiumFlag && (
      !premiumUntilDate
      || Number.isNaN(premiumUntilDate.getTime())
      || premiumUntilDate.getTime() > Date.now()
    );

    const plan = subscriptionActive
      ? normalizePlan(devices?.plan || user?.plan)
      : "Plan inactivo";

    const maxDevices = subscriptionActive
      ? Number(devices?.max_devices ?? user?.max_devices ?? 1)
      : 0;

    const used = subscriptionActive
      ? Number(devices?.devices_used ?? devices?.devices?.length ?? 0)
      : 0;

    const available = subscriptionActive
      ? Number(devices?.devices_available ?? Math.max(maxDevices - used, 0))
      : 0;

    document.getElementById("welcomeName").textContent = email.split("@")[0] || "VeiCloud";
    document.getElementById("chipEmail").textContent = email;
    document.getElementById("chipId").textContent = `ID · ${publicId}`;
    document.getElementById("planName").textContent = plan;
    document.getElementById("planStatus").textContent = subscriptionActive
      ? `${maxDevices} dispositivo${maxDevices === 1 ? "" : "s"} incluido${maxDevices === 1 ? "" : "s"} en tu plan`
      : `ID · ${publicId} · ${email}`;
    document.getElementById("devicesFraction").textContent = subscriptionActive
      ? `${used}/${maxDevices}`
      : "0/0";
    document.getElementById("publicId").textContent = publicId;
    document.getElementById("devicesAvailable").textContent = String(available);
    document.getElementById("subscriptionStatus").textContent = subscriptionActive ? "Activa" : "Inactiva";
    document.getElementById("subscriptionUntil").textContent = subscriptionActive && premiumUntil
      ? `Válida hasta ${formatDate(premiumUntil)}`
      : "Sin suscripción activa";

    const degrees = maxDevices > 0 ? Math.min(used / maxDevices, 1) * 360 : 0;
    document.getElementById("capacityRing").style.setProperty("--usage", `${degrees}deg`);

    if (addAccessButton) {
      addAccessButton.disabled = !subscriptionActive || available <= 0;
      addAccessButton.title = !subscriptionActive
        ? "Activa un plan para añadir dispositivos"
        : available <= 0
          ? "No quedan espacios disponibles en tu plan"
          : "Añadir un nuevo acceso";
    }

    if (!subscriptionActive) {
      devicesList.innerHTML = '<div class="empty-card"><i data-lucide="shield-off"></i>Activa un plan para empezar a conectar dispositivos.</div>';
      refreshIcons();
      return;
    }

    if (devices) {
      renderDevices(devices);
    } else {
      devicesList.innerHTML = '<div class="empty-card"><i data-lucide="triangle-alert"></i>No se pudieron cargar los dispositivos.</div>';
      refreshIcons();
    }
  } catch (error) {
    if (error.message === "SESSION_EXPIRED") return;
    dashboardError.textContent = "No se pudieron cargar los datos de tu cuenta. Comprueba la conexión e inténtalo de nuevo.";
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
  if (!accessModal) return;
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
      const label = [server.country, server.city].filter(Boolean).join(" · ")
        || server.server_name
        || `Servidor ${server.server_id}`;
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

    const vpnKey = payload?.vpn?.amnezia_vpn_key
      || payload?.vpn_locations?.[0]?.amnezia_vpn_key;

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
document.querySelectorAll("[data-open-register]").forEach((button) => {
  button.addEventListener("click", openRegister);
});
document.querySelectorAll("[data-open-login]").forEach((button) => {
  button.addEventListener("click", openLogin);
});

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
      body: JSON.stringify({
        email,
        password,
        ...getAuthDevicePayload()
      })
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
      body: JSON.stringify({
        email,
        password,
        ...getAuthDevicePayload()
      })
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
    document.getElementById("devicesSection").scrollIntoView({
      behavior: "smooth"
    });
  });
});

addAccessButton?.addEventListener("click", openAccessModal);
document.querySelectorAll("[data-close-access]").forEach((element) => {
  element.addEventListener("click", closeAccessModal);
});
guestOption?.addEventListener("click", selectGuestAccess);
amneziaOption?.addEventListener("click", selectAmneziaAccess);
createInvitationButton?.addEventListener("click", createInvitation);
createAmneziaButton?.addEventListener("click", createAmneziaAccess);

document.addEventListener("click", (event) => {
  const copyButton = event.target.closest("[data-copy-value]");
  if (copyButton) {
    copyText(copyButton.dataset.copyValue || "", copyButton);
    return;
  }

  const deleteButton = event.target.closest("[data-delete-device]");
  if (deleteButton) {
    deleteDevice(
      Number(deleteButton.dataset.deleteDevice),
      deleteButton.dataset.deviceName || "Dispositivo",
      deleteButton.dataset.deleteLabel || "Eliminar acceso",
      deleteButton
    );
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !accessModal?.classList.contains("hidden")) {
    closeAccessModal();
  }
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