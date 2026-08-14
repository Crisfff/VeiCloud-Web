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

function setLoading(button, loading) {
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

function openLogin() {
  loginTab.classList.add("active");
  registerTab.classList.remove("active");
  loginForm.classList.remove("hidden");
  registerForm.classList.add("hidden");
  history.replaceState(null, "", "#login");
}

function openRegister() {
  registerTab.classList.add("active");
  loginTab.classList.remove("active");
  registerForm.classList.remove("hidden");
  loginForm.classList.add("hidden");
  history.replaceState(null, "", "#register");
}

function showDashboard() {
  authView.classList.add("hidden");
  dashboardView.classList.remove("hidden");
}

function showAuth() {
  dashboardView.classList.add("hidden");
  authView.classList.remove("hidden");
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
    const error = new Error(payload?.detail || `HTTP ${response.status}`);
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
  return new Intl.DateTimeFormat("es", { day: "2-digit", month: "short", year: "numeric" }).format(date);
}

function deviceIcon(type, guest) {
  if (guest) return "◇";
  const value = String(type || "").toLowerCase();
  if (value.includes("tv")) return "▭";
  if (value.includes("web")) return "◫";
  return "▯";
}

function renderDevices(data) {
  const items = Array.isArray(data?.devices) ? data.devices : [];
  if (!items.length) {
    devicesList.innerHTML = '<div class="empty-card">No hay dispositivos registrados en esta cuenta.</div>';
    return;
  }

  devicesList.innerHTML = items.map((device) => {
    const name = device.device_name || "Dispositivo VeiCloud";
    const type = device.device_type || (device.is_guest ? "invitado" : "android");
    const guest = Boolean(device.is_guest);
    const active = device.is_active !== false;
    const locationCount = Number(device.server_count || 0);
    const subtitle = guest ? "Invitado" : type.toUpperCase();
    const locationText = locationCount ? `${locationCount} ubicacion${locationCount === 1 ? "" : "es"}` : "Acceso VeiCloud";
    return `
      <article class="device-row">
        <div class="device-main">
          <div class="device-icon">${deviceIcon(type, guest)}</div>
          <div class="device-copy">
            <strong>${escapeHtml(name)}</strong>
            <small>${escapeHtml(subtitle)} · ${escapeHtml(locationText)}</small>
          </div>
        </div>
        <div class="device-meta">
          <span>${active ? "Activo" : "Inactivo"}</span>
          <small>${device.last_seen_at ? `Último acceso ${formatDate(device.last_seen_at)}` : "Registrado en VeiCloud"}</small>
        </div>
      </article>`;
  }).join("");
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function loadDashboard() {
  dashboardError.classList.add("hidden");
  devicesList.innerHTML = '<div class="loading-card">Cargando dispositivos...</div>';

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
    document.getElementById("accountInitial").textContent = (email[0] || "V").toUpperCase();
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

    renderDevices(devices);
  } catch (error) {
    if (error.message === "SESSION_EXPIRED") return;
    dashboardError.textContent = "No se pudieron cargar todos los datos de tu cuenta. Comprueba la conexión e inténtalo de nuevo.";
    dashboardError.classList.remove("hidden");
    devicesList.innerHTML = '<div class="empty-card">No se pudieron cargar los dispositivos.</div>';
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
    button.textContent = showing ? "Ver" : "Ocultar";
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
      headers: { "Content-Type": "application/json", Accept: "application/json" },
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
      headers: { "Content-Type": "application/json", Accept: "application/json" },
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
  showAuth();
  openLogin();
});

refreshButton.addEventListener("click", loadDashboard);
document.querySelectorAll("[data-scroll-devices]").forEach((button) => button.addEventListener("click", () => document.getElementById("devicesSection").scrollIntoView({ behavior: "smooth" })));

(async function boot() {
  if (getToken()) {
    showDashboard();
    await loadDashboard();
    return;
  }
  showAuth();
  if (location.hash === "#register") openRegister();
  else openLogin();
})();
