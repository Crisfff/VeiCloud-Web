const API_BASE = "https://api.veicloud.online:8443";

const params = new URLSearchParams(window.location.search);
const sessionId = (params.get("session") || "").trim();

const loginState = document.getElementById("login-state");
const invalidSession = document.getElementById("invalid-session");
const expiredSession = document.getElementById("expired-session");
const successState = document.getElementById("success-state");
const form = document.getElementById("tv-login-form");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const togglePassword = document.getElementById("toggle-password");
const submitButton = document.getElementById("submit-button");
const buttonLabel = submitButton?.querySelector(".button-label");
const buttonLoader = submitButton?.querySelector(".button-loader");
const formError = document.getElementById("form-error");

function showOnly(target) {
  [loginState, invalidSession, expiredSession, successState].forEach((node) => {
    if (!node) return;
    node.classList.toggle("hidden", node !== target);
  });
}

function setError(message) {
  if (!formError) return;
  formError.textContent = message || "";
  formError.classList.toggle("hidden", !message);
}

function setLoading(loading) {
  if (!submitButton) return;
  submitButton.disabled = loading;

  if (buttonLabel) {
    buttonLabel.textContent = loading ? "Autorizando TV..." : "Iniciar sesión en TV";
  }

  if (buttonLoader) {
    buttonLoader.classList.toggle("hidden", !loading);
  }
}

function validSessionId(value) {
  return /^[A-Za-z0-9_-]{16,160}$/.test(value);
}

async function readJsonSafely(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function apiErrorMessage(status, payload) {
  const detail = payload?.detail;

  if (status === 400) {
    return typeof detail === "string" ? detail : "La solicitud no es válida.";
  }

  if (status === 401 || status === 403) {
    return "Correo o contraseña incorrectos.";
  }

  if (status === 404 || status === 410) {
    return "SESSION_EXPIRED";
  }

  if (status === 429) {
    return "Demasiados intentos. Espera un momento e inténtalo otra vez.";
  }

  if (status >= 500) {
    return "VeiCloud no está disponible en este momento. Inténtalo de nuevo.";
  }

  return typeof detail === "string"
    ? detail
    : "No se pudo autorizar la TV.";
}

async function validateSession() {
  if (!validSessionId(sessionId)) {
    showOnly(invalidSession);
    return false;
  }

  try {
    const response = await fetch(
      `${API_BASE}/api/tv-auth/session/${encodeURIComponent(sessionId)}`,
      {
        method: "GET",
        headers: {
          Accept: "application/json"
        },
        cache: "no-store"
      }
    );

    const payload = await readJsonSafely(response);

    if (response.status === 404 || response.status === 410) {
      showOnly(expiredSession);
      return false;
    }

    if (!response.ok) {
      throw new Error(payload?.detail || `HTTP ${response.status}`);
    }

    if (payload?.status === "approved" || payload?.status === "consumed") {
      showOnly(successState);
      return false;
    }

    showOnly(loginState);
    emailInput?.focus();
    return true;
  } catch {
    // La página sigue mostrando el formulario si la validación previa no
    // está disponible. El POST de autorización hará la validación definitiva.
    showOnly(loginState);
    return true;
  }
}

togglePassword?.addEventListener("click", () => {
  const showing = passwordInput.type === "text";
  passwordInput.type = showing ? "password" : "text";
  togglePassword.textContent = showing ? "Ver" : "Ocultar";
  togglePassword.setAttribute(
    "aria-label",
    showing ? "Mostrar contraseña" : "Ocultar contraseña"
  );
  passwordInput.focus();
});

form?.addEventListener("submit", async (event) => {
  event.preventDefault();
  setError("");

  if (!validSessionId(sessionId)) {
    showOnly(invalidSession);
    return;
  }

  const email = (emailInput.value || "").trim().toLowerCase();
  const password = passwordInput.value || "";

  if (!email) {
    setError("Escribe tu correo electrónico.");
    emailInput.focus();
    return;
  }

  if (!password) {
    setError("Escribe tu contraseña.");
    passwordInput.focus();
    return;
  }

  setLoading(true);

  try {
    const response = await fetch(`${API_BASE}/api/tv-auth/authorize`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      body: JSON.stringify({
        session_id: sessionId,
        email,
        password
      })
    });

    const payload = await readJsonSafely(response);

    if (!response.ok) {
      const message = apiErrorMessage(response.status, payload);

      if (message === "SESSION_EXPIRED") {
        showOnly(expiredSession);
        return;
      }

      setError(message);
      return;
    }

    passwordInput.value = "";
    showOnly(successState);
  } catch {
    setError("No se pudo conectar con VeiCloud. Revisa tu conexión e inténtalo nuevamente.");
  } finally {
    setLoading(false);
  }
});

validateSession();
