const API_BASE = "https://api.veicloud.online:8443";

const params = new URLSearchParams(window.location.search);
const sessionId = (params.get("session") || "").trim();

const registerState = document.getElementById("register-state");
const invalidSession = document.getElementById("invalid-session");
const expiredSession = document.getElementById("expired-session");
const successState = document.getElementById("success-state");
const form = document.getElementById("tv-register-form");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const confirmPasswordInput = document.getElementById("confirm-password");
const togglePassword = document.getElementById("toggle-password");
const toggleConfirmPassword = document.getElementById("toggle-confirm-password");
const submitButton = document.getElementById("submit-button");
const buttonLabel = submitButton?.querySelector(".button-label");
const buttonLoader = submitButton?.querySelector(".button-loader");
const formError = document.getElementById("form-error");

function showOnly(target) {
  [registerState, invalidSession, expiredSession, successState].forEach((node) => {
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
    buttonLabel.textContent = loading ? "Creando cuenta..." : "Crear cuenta en TV";
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

function registerErrorMessage(status, payload) {
  const detail = payload?.detail;

  if (status === 409) {
    return "Ya existe una cuenta con este correo electrónico.";
  }

  if (status === 400 || status === 422) {
    if (Array.isArray(detail)) {
      return "Revisa el correo y utiliza una contraseña de al menos 8 caracteres.";
    }
    return typeof detail === "string" ? detail : "Los datos de registro no son válidos.";
  }

  if (status === 429) {
    return "Demasiados intentos. Espera un momento e inténtalo otra vez.";
  }

  if (status >= 500) {
    return "VeiCloud no está disponible en este momento. Inténtalo nuevamente.";
  }

  return typeof detail === "string" ? detail : "No se pudo crear la cuenta.";
}

function approvalErrorMessage(status, payload) {
  const detail = payload?.detail;

  if (status === 404 || status === 410) {
    return "SESSION_EXPIRED";
  }

  if (status === 401 || status === 403) {
    return "La cuenta fue creada, pero no se pudo autorizar la TV.";
  }

  if (status >= 500) {
    return "La cuenta fue creada, pero VeiCloud no pudo completar la autorización de la TV.";
  }

  return typeof detail === "string" ? detail : "No se pudo autorizar la TV.";
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
        headers: { Accept: "application/json" },
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

    showOnly(registerState);
    emailInput?.focus();
    return true;
  } catch {
    showOnly(registerState);
    return true;
  }
}

function bindPasswordToggle(button, input) {
  button?.addEventListener("click", () => {
    const showing = input.type === "text";
    input.type = showing ? "password" : "text";
    button.textContent = showing ? "Ver" : "Ocultar";
    input.focus();
  });
}

bindPasswordToggle(togglePassword, passwordInput);
bindPasswordToggle(toggleConfirmPassword, confirmPasswordInput);

form?.addEventListener("submit", async (event) => {
  event.preventDefault();
  setError("");

  if (!validSessionId(sessionId)) {
    showOnly(invalidSession);
    return;
  }

  const email = (emailInput.value || "").trim().toLowerCase();
  const password = passwordInput.value || "";
  const confirmPassword = confirmPasswordInput.value || "";

  if (!email) {
    setError("Escribe tu correo electrónico.");
    emailInput.focus();
    return;
  }

  if (password.length < 8) {
    setError("La contraseña debe tener al menos 8 caracteres.");
    passwordInput.focus();
    return;
  }

  if (password !== confirmPassword) {
    setError("Las contraseñas no coinciden.");
    confirmPasswordInput.focus();
    return;
  }

  setLoading(true);

  try {
    const registerResponse = await fetch(`${API_BASE}/api/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      body: JSON.stringify({ email, password })
    });

    const registerPayload = await readJsonSafely(registerResponse);

    if (!registerResponse.ok) {
      setError(registerErrorMessage(registerResponse.status, registerPayload));
      return;
    }

    const accessToken = registerPayload?.access_token;

    if (!accessToken) {
      setError("La cuenta fue creada, pero VeiCloud no devolvió una sesión válida.");
      return;
    }

    const approveResponse = await fetch(
      `${API_BASE}/api/tv-auth/session/${encodeURIComponent(sessionId)}/approve`,
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${accessToken}`
        }
      }
    );

    const approvePayload = await readJsonSafely(approveResponse);

    if (!approveResponse.ok) {
      const message = approvalErrorMessage(approveResponse.status, approvePayload);
      if (message === "SESSION_EXPIRED") {
        showOnly(expiredSession);
        return;
      }
      setError(message);
      return;
    }

    passwordInput.value = "";
    confirmPasswordInput.value = "";
    showOnly(successState);
  } catch {
    setError("No se pudo conectar con VeiCloud. Revisa tu conexión e inténtalo nuevamente.");
  } finally {
    setLoading(false);
  }
});

validateSession();
