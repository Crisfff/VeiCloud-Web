const express = require("express");
const path = require("path");
const crypto = require("crypto");
const admin = require("firebase-admin");

const registerCatalogRoutes = require("./catalog-routes");

const app = express();

const PORT = process.env.PORT || 3000;

/*
 * =========================================================
 * VARIABLES PRIVADAS GUARDADAS EN RENDER
 * =========================================================
 */

const TMDB_TOKEN = process.env.TMDB_TOKEN;

const FIREBASE_WEB_API_KEY = process.env.FIREBASE_WEB_API_KEY;

const FIREBASE_DATABASE_URL = process.env.FIREBASE_DATABASE_URL;

const FIREBASE_SERVICE_ACCOUNT_JSON = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

const BREVO_API_KEY = process.env.BREVO_API_KEY;

const EMAIL_FROM =
    process.env.EMAIL_FROM ||
    "VeiCloud <no-reply@veicloud.online>";

const PUBLIC_BASE_URL =
    process.env.PUBLIC_BASE_URL ||
    "https://veicloud.online";

const APP_DEEP_LINK =
    process.env.APP_DEEP_LINK ||
    "veicloud://login";

const LOGIN_CODE_DURATION_MS = 5 * 60 * 1000;

const LOGIN_CODE_RESEND_COOLDOWN_MS = 60 * 1000;

const LOGIN_CODE_MAX_ATTEMPTS = 5;

const PASSWORD_RESET_LINK_DURATION_MS = 15 * 60 * 1000;

const PASSWORD_RESET_RESEND_COOLDOWN_MS = 60 * 1000;

const loginCodesByUid = new Map();

const passwordResetLinksByEmail = new Map();

const passwordResetLinksByToken = new Map();

/*
 * =========================================================
 * CONFIGURACIÓN GENERAL
 * =========================================================
 */

const TMDB_API_BASE_URL = "https://api.themoviedb.org/3";

const TMDB_IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w1280";

const TMDB_CACHE_DURATION_MS = 15 * 60 * 1000;

const ID_TOKEN_COOKIE_NAME = "veicloud_id_token";

const REFRESH_TOKEN_COOKIE_NAME = "veicloud_refresh_token";

const ID_TOKEN_COOKIE_DURATION_SECONDS = 60 * 60;

const REFRESH_TOKEN_COOKIE_DURATION_SECONDS = 30 * 24 * 60 * 60;

app.use(
    express.json(
        {
            limit: "64kb"
        }
    )
);

/*
 * =========================================================
 * BLOQUEO DE ARCHIVOS INTERNOS
 * =========================================================
 */

app.use(
    (
        request,
        response,
        next
    ) => {
        const blockedPaths = [
            "/server.js",
            "/catalog-routes.js",
            "/package.json",
            "/package-lock.json",
            "/node_modules",
            "/.git",
            "/.env"
        ];

        const isBlocked = blockedPaths.some(
            (
                blockedPath
            ) =>
                request.path === blockedPath ||
                request.path.startsWith(`${blockedPath}/`)
        );

        if (isBlocked) {
            response.status(404).end();
            return;
        }

        next();
    }
);

/*
 * =========================================================
 * COOKIES
 * =========================================================
 */

function parseCookies(
    cookieHeader
) {
    if (!cookieHeader) {
        return {};
    }

    return cookieHeader
        .split(";")
        .map(
            (
                part
            ) => part.trim()
        )
        .filter(Boolean)
        .reduce(
            (
                cookies,
                part
            ) => {
                const separatorIndex = part.indexOf("=");

                if (separatorIndex === -1) {
                    return cookies;
                }

                const name =
                    part.slice(
                        0,
                        separatorIndex
                    );

                const rawValue =
                    part.slice(
                        separatorIndex + 1
                    );

                try {
                    cookies[name] =
                        decodeURIComponent(rawValue);
                } catch {
                    cookies[name] =
                        rawValue;
                }

                return cookies;
            },
            {}
        );
}

function createSecureCookie(
    name,
    value,
    maxAgeSeconds
) {
    return [
        `${name}=${encodeURIComponent(value)}`,
        "HttpOnly",
        "Secure",
        "SameSite=Lax",
        "Path=/",
        `Max-Age=${maxAgeSeconds}`
    ].join("; ");
}

function createExpiredCookie(
    name
) {
    return [
        `${name}=`,
        "HttpOnly",
        "Secure",
        "SameSite=Lax",
        "Path=/",
        "Max-Age=0"
    ].join("; ");
}

function setSessionCookies(
    response,
    idToken,
    refreshToken
) {
    response.setHeader(
        "Set-Cookie",
        [
            createSecureCookie(
                ID_TOKEN_COOKIE_NAME,
                idToken,
                ID_TOKEN_COOKIE_DURATION_SECONDS
            ),
            createSecureCookie(
                REFRESH_TOKEN_COOKIE_NAME,
                refreshToken,
                REFRESH_TOKEN_COOKIE_DURATION_SECONDS
            )
        ]
    );
}

function clearSessionCookies(
    response
) {
    response.setHeader(
        "Set-Cookie",
        [
            createExpiredCookie(ID_TOKEN_COOKIE_NAME),
            createExpiredCookie(REFRESH_TOKEN_COOKIE_NAME)
        ]
    );
}

/*
 * =========================================================
 * FIREBASE
 * =========================================================
 */

function requireFirebaseConfiguration() {
    if (!FIREBASE_WEB_API_KEY) {
        throw new Error("Falta configurar FIREBASE_WEB_API_KEY en Render.");
    }

    if (!FIREBASE_DATABASE_URL) {
        throw new Error("Falta configurar FIREBASE_DATABASE_URL en Render.");
    }
}

function getFirebaseDatabaseBaseUrl() {
    requireFirebaseConfiguration();

    return FIREBASE_DATABASE_URL.replace(/\/+$/, "");
}

function getReadableFirebaseAuthError(
    firebaseErrorCode
) {
    const knownErrors = {
        EMAIL_NOT_FOUND:
            "No existe una cuenta vinculada a ese correo.",
        INVALID_PASSWORD:
            "La contraseña es incorrecta.",
        INVALID_LOGIN_CREDENTIALS:
            "El correo o la contraseña son incorrectos.",
        USER_DISABLED:
            "Esta cuenta se encuentra desactivada.",
        TOO_MANY_ATTEMPTS_TRY_LATER:
            "Demasiados intentos. Espera unos minutos antes de volver a intentarlo.",
        OPERATION_NOT_ALLOWED:
            "El inicio de sesión con contraseña no está habilitado."
    };

    return (
        knownErrors[firebaseErrorCode] ||
        "No fue posible iniciar sesión. Revisa tus datos."
    );
}

function parseBoolean(
    value
) {
    return (
        value === true ||
        value === "true" ||
        value === 1 ||
        value === "1"
    );
}

/*
 * =========================================================
 * FIREBASE ADMIN
 * =========================================================
 */

function requireFirebaseAdminConfiguration() {
    if (!FIREBASE_SERVICE_ACCOUNT_JSON) {
        throw new Error("Falta configurar FIREBASE_SERVICE_ACCOUNT_JSON en Render.");
    }
}

function getFirebaseAdminAuth() {
    requireFirebaseAdminConfiguration();

    if (admin.apps.length > 0) {
        return admin.auth();
    }

    let serviceAccount;

    try {
        serviceAccount =
            JSON.parse(FIREBASE_SERVICE_ACCOUNT_JSON);
    } catch {
        throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON no tiene formato JSON válido.");
    }

    if (!serviceAccount.project_id) {
        throw new Error("El JSON de Firebase Admin no tiene project_id.");
    }

    if (!serviceAccount.client_email) {
        throw new Error("El JSON de Firebase Admin no tiene client_email.");
    }

    if (!serviceAccount.private_key) {
        throw new Error("El JSON de Firebase Admin no tiene private_key.");
    }

    const privateKey =
        String(serviceAccount.private_key)
            .replace(/\\n/g, "\n");

    admin.initializeApp(
        {
            credential:
                admin.credential.cert(
                    {
                        projectId: serviceAccount.project_id,
                        clientEmail: serviceAccount.client_email,
                        privateKey
                    }
                )
        }
    );

    return admin.auth();
}

function normalizeEmailAddress(
    email
) {
    return String(email || "")
        .trim()
        .toLowerCase();
}

function isValidEmailAddress(
    email
) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/*
 * =========================================================
 * BREVO API HTTPS
 * =========================================================
 */

function requireBrevoConfiguration() {
    if (!BREVO_API_KEY) {
        throw new Error("Falta configurar BREVO_API_KEY en Render.");
    }

    if (!EMAIL_FROM) {
        throw new Error("Falta configurar EMAIL_FROM en Render.");
    }
}

function parseEmailFrom(
    value
) {
    const rawValue =
        String(value || "").trim();

    const match =
        rawValue.match(/^(.*?)\s*<([^>]+)>$/);

    if (match) {
        const name =
            match[1]
                .replace(/^"|"$/g, "")
                .trim() ||
            "VeiCloud";

        const email =
            match[2]
                .trim()
                .toLowerCase();

        return {
            name,
            email
        };
    }

    return {
        name: "VeiCloud",
        email: rawValue.toLowerCase()
    };
}

async function sendCustomEmail(
    {
        to,
        subject,
        text,
        html
    }
) {
    requireBrevoConfiguration();

    const sender =
        parseEmailFrom(EMAIL_FROM);

    if (!isValidEmailAddress(sender.email)) {
        throw new Error("EMAIL_FROM no tiene un correo válido.");
    }

    const brevoResponse =
        await fetch(
            "https://api.brevo.com/v3/smtp/email",
            {
                method: "POST",
                headers: {
                    "api-key": BREVO_API_KEY,
                    "Content-Type": "application/json",
                    Accept: "application/json"
                },
                body:
                    JSON.stringify(
                        {
                            sender: {
                                name: sender.name,
                                email: sender.email
                            },
                            to: [
                                {
                                    email: to
                                }
                            ],
                            subject,
                            htmlContent: html,
                            textContent: text
                        }
                    )
            }
        );

    const brevoData =
        await brevoResponse.json().catch(
            () => ({})
        );

    if (!brevoResponse.ok) {
        throw new Error(
            brevoData?.message ||
            brevoData?.error ||
            `Brevo API respondió con código ${brevoResponse.status}.`
        );
    }

    console.log(
        "Correo enviado correctamente por Brevo API:",
        brevoData.messageId || brevoData
    );

    return brevoData;
}

/*
 * =========================================================
 * UTILIDADES
 * =========================================================
 */

function generateFourDigitCode() {
    return String(
        Math.floor(
            1000 +
            Math.random() * 9000
        )
    );
}

function generateResetToken() {
    return crypto
        .randomBytes(32)
        .toString("hex");
}

function maskEmail(
    email
) {
    const cleanEmail =
        String(email || "").trim();

    const [
        name,
        domain
    ] = cleanEmail.split("@");

    if (!name || !domain) {
        return cleanEmail;
    }

    return `${name.slice(0, 2)}***@${domain}`;
}

function escapeHtml(
    value
) {
    return String(value || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

function getPublicBaseUrl() {
    return String(PUBLIC_BASE_URL || "")
        .replace(/\/+$/, "");
}

function createPasswordResetUrl(
    token
) {
    return `${getPublicBaseUrl()}/reset-password.html?token=${encodeURIComponent(token)}`;
}

function cleanupExpiredPasswordResetLinks() {
    const now =
        Date.now();

    for (
        const [
            token,
            resetData
        ] of passwordResetLinksByToken.entries()
    ) {
        if (
            !resetData ||
            resetData.expiresAt < now ||
            resetData.used === true
        ) {
            passwordResetLinksByToken.delete(token);

            if (resetData?.email) {
                const emailReset =
                    passwordResetLinksByEmail.get(resetData.email);

                if (emailReset?.token === token) {
                    passwordResetLinksByEmail.delete(resetData.email);
                }
            }
        }
    }
}

/*
 * =========================================================
 * CORREO DE CÓDIGO DE INICIO
 * =========================================================
 */

function createLoginCodeEmailText(
    code
) {
    return [
        "VeiCloud",
        "",
        `Tu código de verificación es: ${code}`,
        "",
        "Este código vence en 5 minutos.",
        "No compartas este código con nadie.",
        "",
        "Si no solicitaste este acceso, puedes ignorar este mensaje."
    ].join("\n");
}

function createLoginCodeEmailHtml(
    code
) {
    const safeCode =
        escapeHtml(code);

    return `
<!doctype html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Código de verificación de VeiCloud</title>
</head>
<body style="margin:0;padding:0;background:#050507;font-family:Arial,Helvetica,sans-serif;color:#ffffff;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#050507;padding:24px 12px;">
        <tr>
            <td align="center">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:520px;background:#111116;border-radius:20px;padding:28px;">
                    <tr>
                        <td>
                            <div style="font-size:26px;font-weight:800;color:#ffffff;margin-bottom:18px;">
                                VeiCloud
                            </div>

                            <div style="font-size:15px;line-height:22px;color:#c8c8d2;margin-bottom:18px;">
                                Usa este código para verificar tu inicio de sesión:
                            </div>

                            <div style="background:#18181f;border-radius:16px;padding:18px;text-align:center;margin-bottom:18px;">
                                <span style="font-size:38px;font-weight:900;letter-spacing:8px;color:#E50914;">
                                    ${safeCode}
                                </span>
                            </div>

                            <div style="font-size:14px;line-height:22px;color:#b8b8c2;margin-bottom:10px;">
                                Este código vence en 5 minutos.
                            </div>

                            <div style="font-size:14px;line-height:22px;color:#b8b8c2;">
                                No compartas este código con nadie. Si no solicitaste este acceso, puedes ignorar este mensaje.
                            </div>
                        </td>
                    </tr>
                </table>

                <div style="max-width:520px;margin:14px auto 0;font-size:12px;line-height:18px;color:#777783;text-align:center;">
                    Mensaje automático de VeiCloud.
                </div>
            </td>
        </tr>
    </table>
</body>
</html>
    `.trim();
}

async function sendLoginCodeEmail(
    email,
    code
) {
    console.log(
        "Intentando enviar código de inicio por Brevo API a:",
        email
    );

    return sendCustomEmail(
        {
            to: email,
            subject: "Código de verificación de VeiCloud",
            text: createLoginCodeEmailText(code),
            html: createLoginCodeEmailHtml(code)
        }
    );
}

/*
 * =========================================================
 * CORREO DE RECUPERACIÓN CON ENLACE
 * =========================================================
 */

function createPasswordResetLinkEmailText(
    resetUrl
) {
    return [
        "VeiCloud",
        "",
        "Recibimos una solicitud para restablecer tu contraseña.",
        "",
        "Abre este enlace para crear una nueva contraseña:",
        resetUrl,
        "",
        "Este enlace vence en 15 minutos y solo se puede usar una vez.",
        "",
        "Si no solicitaste este cambio, puedes ignorar este mensaje."
    ].join("\n");
}

function createPasswordResetLinkEmailHtml(
    resetUrl
) {
    const safeResetUrl =
        escapeHtml(resetUrl);

    return `
<!doctype html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Restablecer contraseña de VeiCloud</title>
</head>
<body style="margin:0;padding:0;background:#050507;font-family:Arial,Helvetica,sans-serif;color:#ffffff;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#050507;padding:24px 12px;">
        <tr>
            <td align="center">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:520px;background:#111116;border-radius:20px;padding:28px;">
                    <tr>
                        <td>
                            <div style="font-size:26px;font-weight:800;color:#ffffff;margin-bottom:18px;">
                                VeiCloud
                            </div>

                            <div style="font-size:18px;font-weight:800;color:#ffffff;margin-bottom:12px;">
                                Restablecer contraseña
                            </div>

                            <div style="font-size:15px;line-height:22px;color:#c8c8d2;margin-bottom:22px;">
                                Recibimos una solicitud para restablecer la contraseña de tu cuenta.
                            </div>

                            <a href="${safeResetUrl}" style="display:block;text-decoration:none;background:#E50914;color:#ffffff;font-size:16px;font-weight:800;text-align:center;padding:16px 20px;border-radius:16px;margin-bottom:22px;">
                                Crear nueva contraseña
                            </a>

                            <div style="font-size:14px;line-height:22px;color:#b8b8c2;margin-bottom:10px;">
                                Este enlace vence en 15 minutos y solo se puede usar una vez.
                            </div>

                            <div style="font-size:14px;line-height:22px;color:#b8b8c2;">
                                Si no solicitaste este cambio, puedes ignorar este mensaje.
                            </div>
                        </td>
                    </tr>
                </table>

                <div style="max-width:520px;margin:14px auto 0;font-size:12px;line-height:18px;color:#777783;text-align:center;">
                    Mensaje automático de VeiCloud.
                </div>
            </td>
        </tr>
    </table>
</body>
</html>
    `.trim();
}

async function sendPasswordResetLinkEmail(
    email,
    resetUrl
) {
    console.log(
        "Intentando enviar enlace de recuperación por Brevo API a:",
        email
    );

    return sendCustomEmail(
        {
            to: email,
            subject: "Restablecer contraseña de VeiCloud",
            text: createPasswordResetLinkEmailText(resetUrl),
            html: createPasswordResetLinkEmailHtml(resetUrl)
        }
    );
}

/*
 * =========================================================
 * SESIÓN FIREBASE
 * =========================================================
 */

async function lookupFirebaseAccount(
    idToken
) {
    if (!idToken) {
        return null;
    }

    if (!FIREBASE_WEB_API_KEY) {
        throw new Error("Falta configurar FIREBASE_WEB_API_KEY en Render.");
    }

    const lookupUrl =
        "https://identitytoolkit.googleapis.com/" +
        "v1/accounts:lookup" +
        `?key=${encodeURIComponent(FIREBASE_WEB_API_KEY)}`;

    const lookupResponse =
        await fetch(
            lookupUrl,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json"
                },
                body:
                    JSON.stringify(
                        {
                            idToken
                        }
                    )
            }
        );

    if (!lookupResponse.ok) {
        return null;
    }

    const lookupData =
        await lookupResponse.json();

    const user =
        lookupData?.users?.[0];

    if (!user?.localId) {
        return null;
    }

    return {
        uid: user.localId,
        email: user.email || ""
    };
}

async function refreshFirebaseSession(
    refreshToken
) {
    if (!refreshToken) {
        return null;
    }

    if (!FIREBASE_WEB_API_KEY) {
        throw new Error("Falta configurar FIREBASE_WEB_API_KEY en Render.");
    }

    const refreshUrl =
        "https://securetoken.googleapis.com/" +
        "v1/token" +
        `?key=${encodeURIComponent(FIREBASE_WEB_API_KEY)}`;

    const formBody =
        new URLSearchParams();

    formBody.set(
        "grant_type",
        "refresh_token"
    );

    formBody.set(
        "refresh_token",
        refreshToken
    );

    const refreshResponse =
        await fetch(
            refreshUrl,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                    Accept: "application/json"
                },
                body:
                    formBody.toString()
            }
        );

    if (!refreshResponse.ok) {
        return null;
    }

    const refreshData =
        await refreshResponse.json();

    if (
        !refreshData.id_token ||
        !refreshData.refresh_token ||
        !refreshData.user_id
    ) {
        return null;
    }

    return {
        uid: refreshData.user_id,
        idToken: refreshData.id_token,
        refreshToken: refreshData.refresh_token
    };
}

async function getAuthenticatedFirebaseSession(
    request,
    response
) {
    const cookies =
        parseCookies(
            request.headers.cookie
        );

    const currentIdToken =
        cookies[ID_TOKEN_COOKIE_NAME];

    const currentRefreshToken =
        cookies[REFRESH_TOKEN_COOKIE_NAME];

    if (!currentIdToken && !currentRefreshToken) {
        return null;
    }

    if (currentIdToken) {
        const firebaseAccount =
            await lookupFirebaseAccount(
                currentIdToken
            );

        if (firebaseAccount) {
            return {
                uid: firebaseAccount.uid,
                email: firebaseAccount.email,
                idToken: currentIdToken,
                refreshToken: currentRefreshToken || ""
            };
        }
    }

    if (!currentRefreshToken) {
        clearSessionCookies(response);
        return null;
    }

    const renewedSession =
        await refreshFirebaseSession(
            currentRefreshToken
        );

    if (!renewedSession) {
        clearSessionCookies(response);
        return null;
    }

    setSessionCookies(
        response,
        renewedSession.idToken,
        renewedSession.refreshToken
    );

    return {
        uid: renewedSession.uid,
        email: "",
        idToken: renewedSession.idToken,
        refreshToken: renewedSession.refreshToken
    };
}

/*
 * =========================================================
 * CÓDIGO DE INICIO PARA ANDROID
 * =========================================================
 */

app.post(
    "/api/send-login-code",
    async (
        request,
        response
    ) => {
        try {
            console.log(
                "Solicitud recibida en /api/send-login-code"
            );

            const idToken =
                String(
                    request.body?.idToken || ""
                ).trim();

            if (!idToken) {
                response.status(401).json(
                    {
                        ok: false,
                        message: "Sesión no válida. Inicia sesión nuevamente."
                    }
                );

                return;
            }

            const account =
                await lookupFirebaseAccount(
                    idToken
                );

            if (!account || !account.uid || !account.email) {
                response.status(401).json(
                    {
                        ok: false,
                        message: "No se pudo verificar tu cuenta."
                    }
                );

                return;
            }

            const activeCodeData =
                loginCodesByUid.get(
                    account.uid
                );

            if (
                activeCodeData &&
                activeCodeData.expiresAt > Date.now() &&
                Date.now() - activeCodeData.createdAt < LOGIN_CODE_RESEND_COOLDOWN_MS
            ) {
                response.status(429).json(
                    {
                        ok: false,
                        message: "Espera un minuto antes de pedir otro código."
                    }
                );

                return;
            }

            const code =
                generateFourDigitCode();

            const now =
                Date.now();

            loginCodesByUid.set(
                account.uid,
                {
                    code,
                    email: account.email,
                    createdAt: now,
                    expiresAt: now + LOGIN_CODE_DURATION_MS,
                    attempts: 0
                }
            );

            await sendLoginCodeEmail(
                account.email,
                code
            );

            response.setHeader(
                "Cache-Control",
                "no-store"
            );

            response.json(
                {
                    ok: true,
                    message: "Código enviado correctamente.",
                    email: maskEmail(account.email)
                }
            );
        } catch (
            error
        ) {
            console.error(
                "Error enviando código de inicio de sesión:",
                {
                    name: error.name,
                    code: error.code,
                    message: error.message
                }
            );

            response.status(500).json(
                {
                    ok: false,
                    message: `No se pudo enviar el código. ${error.message || "Revisa Brevo API."}`
                }
            );
        }
    }
);

app.post(
    "/api/verify-login-code",
    async (
        request,
        response
    ) => {
        try {
            const idToken =
                String(
                    request.body?.idToken || ""
                ).trim();

            const code =
                String(
                    request.body?.code || ""
                )
                    .trim()
                    .replace(/\D/g, "");

            if (!idToken) {
                response.status(401).json(
                    {
                        ok: false,
                        message: "Sesión no válida. Inicia sesión nuevamente."
                    }
                );

                return;
            }

            if (code.length !== 4) {
                response.status(400).json(
                    {
                        ok: false,
                        message: "Escribe el código de 4 dígitos."
                    }
                );

                return;
            }

            const account =
                await lookupFirebaseAccount(
                    idToken
                );

            if (!account || !account.uid) {
                response.status(401).json(
                    {
                        ok: false,
                        message: "No se pudo verificar tu cuenta."
                    }
                );

                return;
            }

            const savedCodeData =
                loginCodesByUid.get(
                    account.uid
                );

            if (!savedCodeData) {
                response.status(404).json(
                    {
                        ok: false,
                        message: "No hay código activo. Solicita uno nuevo."
                    }
                );

                return;
            }

            if (savedCodeData.expiresAt < Date.now()) {
                loginCodesByUid.delete(
                    account.uid
                );

                response.status(410).json(
                    {
                        ok: false,
                        message: "El código venció. Solicita uno nuevo."
                    }
                );

                return;
            }

            if (savedCodeData.attempts >= LOGIN_CODE_MAX_ATTEMPTS) {
                loginCodesByUid.delete(
                    account.uid
                );

                response.status(429).json(
                    {
                        ok: false,
                        message: "Demasiados intentos. Solicita un código nuevo."
                    }
                );

                return;
            }

            if (savedCodeData.code !== code) {
                savedCodeData.attempts += 1;

                loginCodesByUid.set(
                    account.uid,
                    savedCodeData
                );

                response.status(400).json(
                    {
                        ok: false,
                        message: "Código incorrecto."
                    }
                );

                return;
            }

            loginCodesByUid.delete(
                account.uid
            );

            response.setHeader(
                "Cache-Control",
                "no-store"
            );

            response.json(
                {
                    ok: true,
                    message: "Código verificado correctamente."
                }
            );
        } catch (
            error
        ) {
            console.error(
                "Error verificando código de inicio de sesión:",
                {
                    name: error.name,
                    code: error.code,
                    message: error.message
                }
            );

            response.status(500).json(
                {
                    ok: false,
                    message: "No se pudo verificar el código."
                }
            );
        }
    }
);

/*
 * =========================================================
 * RECUPERAR CONTRASEÑA CON LINK
 * =========================================================
 */

app.post(
    "/api/send-password-reset",
    async (
        request,
        response
    ) => {
        try {
            console.log(
                "Solicitud recibida en /api/send-password-reset"
            );

            cleanupExpiredPasswordResetLinks();

            const email =
                normalizeEmailAddress(
                    request.body?.email
                );

            if (!email) {
                response.status(400).json(
                    {
                        ok: false,
                        message: "Escribe tu correo electrónico."
                    }
                );

                return;
            }

            if (!isValidEmailAddress(email)) {
                response.status(400).json(
                    {
                        ok: false,
                        message: "Escribe un correo electrónico válido."
                    }
                );

                return;
            }

            const activeResetData =
                passwordResetLinksByEmail.get(email);

            if (
                activeResetData &&
                activeResetData.expiresAt > Date.now() &&
                Date.now() - activeResetData.createdAt < PASSWORD_RESET_RESEND_COOLDOWN_MS
            ) {
                response.status(429).json(
                    {
                        ok: false,
                        message: "Espera un minuto antes de pedir otro enlace."
                    }
                );

                return;
            }

            const firebaseAdminAuth =
                getFirebaseAdminAuth();

            let firebaseUser =
                null;

            try {
                firebaseUser =
                    await firebaseAdminAuth.getUserByEmail(
                        email
                    );
            } catch (
                error
            ) {
                if (error.code === "auth/user-not-found") {
                    response.setHeader(
                        "Cache-Control",
                        "no-store"
                    );

                    response.json(
                        {
                            ok: true,
                            message: "Si existe una cuenta con ese correo, enviaremos un enlace para restablecer la contraseña."
                        }
                    );

                    return;
                }

                throw error;
            }

            if (!firebaseUser || !firebaseUser.uid) {
                response.status(404).json(
                    {
                        ok: false,
                        message: "No se pudo encontrar la cuenta."
                    }
                );

                return;
            }

            const oldResetData =
                passwordResetLinksByEmail.get(email);

            if (oldResetData?.token) {
                passwordResetLinksByToken.delete(oldResetData.token);
            }

            const token =
                generateResetToken();

            const now =
                Date.now();

            const resetData = {
                token,
                uid: firebaseUser.uid,
                email,
                createdAt: now,
                expiresAt: now + PASSWORD_RESET_LINK_DURATION_MS,
                used: false
            };

            passwordResetLinksByEmail.set(
                email,
                resetData
            );

            passwordResetLinksByToken.set(
                token,
                resetData
            );

            const resetUrl =
                createPasswordResetUrl(token);

            await sendPasswordResetLinkEmail(
                email,
                resetUrl
            );

            response.setHeader(
                "Cache-Control",
                "no-store"
            );

            response.json(
                {
                    ok: true,
                    message: "Te enviamos un enlace para restablecer tu contraseña."
                }
            );
        } catch (
            error
        ) {
            console.error(
                "Error enviando recuperación de contraseña:",
                {
                    name: error.name,
                    code: error.code,
                    message: error.message
                }
            );

            response.status(500).json(
                {
                    ok: false,
                    message: `No se pudo enviar el correo de recuperación. ${error.message || ""}`.trim()
                }
            );
        }
    }
);

app.post(
    "/api/confirm-password-reset",
    async (
        request,
        response
    ) => {
        try {
            cleanupExpiredPasswordResetLinks();

            const token =
                String(
                    request.body?.token || ""
                ).trim();

            const newPassword =
                String(
                    request.body?.newPassword || ""
                );

            if (!token) {
                response.status(400).json(
                    {
                        ok: false,
                        message: "El enlace no es válido."
                    }
                );

                return;
            }

            if (newPassword.length < 6) {
                response.status(400).json(
                    {
                        ok: false,
                        message: "La nueva contraseña debe tener al menos 6 caracteres."
                    }
                );

                return;
            }

            const resetData =
                passwordResetLinksByToken.get(token);

            if (!resetData) {
                response.status(404).json(
                    {
                        ok: false,
                        message: "El enlace no existe o ya fue usado."
                    }
                );

                return;
            }

            if (resetData.used === true) {
                passwordResetLinksByToken.delete(token);

                response.status(410).json(
                    {
                        ok: false,
                        message: "Este enlace ya fue usado."
                    }
                );

                return;
            }

            if (resetData.expiresAt < Date.now()) {
                passwordResetLinksByToken.delete(token);

                const emailReset =
                    passwordResetLinksByEmail.get(resetData.email);

                if (emailReset?.token === token) {
                    passwordResetLinksByEmail.delete(resetData.email);
                }

                response.status(410).json(
                    {
                        ok: false,
                        message: "El enlace venció. Solicita uno nuevo."
                    }
                );

                return;
            }

            const firebaseAdminAuth =
                getFirebaseAdminAuth();

            await firebaseAdminAuth.updateUser(
                resetData.uid,
                {
                    password: newPassword
                }
            );

            resetData.used = true;

            passwordResetLinksByToken.delete(token);

            const emailReset =
                passwordResetLinksByEmail.get(resetData.email);

            if (emailReset?.token === token) {
                passwordResetLinksByEmail.delete(resetData.email);
            }

            response.setHeader(
                "Cache-Control",
                "no-store"
            );

            response.json(
                {
                    ok: true,
                    message: "Contraseña actualizada correctamente.",
                    appUrl: APP_DEEP_LINK,
                    fallbackUrl: `${getPublicBaseUrl()}/login.html`
                }
            );
        } catch (
            error
        ) {
            console.error(
                "Error confirmando recuperación de contraseña:",
                {
                    name: error.name,
                    code: error.code,
                    message: error.message
                }
            );

            response.status(500).json(
                {
                    ok: false,
                    message: `No se pudo actualizar la contraseña. ${error.message || ""}`.trim()
                }
            );
        }
    }
);

/*
 * =========================================================
 * INICIAR SESIÓN WEB
 * =========================================================
 */

app.post(
    "/api/auth/login",
    async (
        request,
        response
    ) => {
        try {
            const email =
                String(
                    request.body?.email || ""
                )
                    .trim()
                    .toLowerCase();

            const password =
                String(
                    request.body?.password || ""
                );

            if (!email || !password) {
                response.status(400).json(
                    {
                        ok: false,
                        message: "Escribe tu correo y contraseña."
                    }
                );

                return;
            }

            if (email.length > 180 || password.length > 256) {
                response.status(400).json(
                    {
                        ok: false,
                        message: "Los datos introducidos no son válidos."
                    }
                );

                return;
            }

            requireFirebaseConfiguration();

            const firebaseLoginUrl =
                "https://identitytoolkit.googleapis.com/" +
                "v1/accounts:signInWithPassword" +
                `?key=${encodeURIComponent(FIREBASE_WEB_API_KEY)}`;

            const firebaseResponse =
                await fetch(
                    firebaseLoginUrl,
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            Accept: "application/json"
                        },
                        body:
                            JSON.stringify(
                                {
                                    email,
                                    password,
                                    returnSecureToken: true
                                }
                            )
                    }
                );

            const firebaseData =
                await firebaseResponse.json();

            if (!firebaseResponse.ok) {
                const firebaseErrorCode =
                    firebaseData?.error?.message ||
                    "UNKNOWN_AUTH_ERROR";

                const statusCode =
                    firebaseErrorCode === "TOO_MANY_ATTEMPTS_TRY_LATER"
                        ? 429
                        : 401;

                response.status(statusCode).json(
                    {
                        ok: false,
                        message: getReadableFirebaseAuthError(firebaseErrorCode)
                    }
                );

                return;
            }

            if (
                !firebaseData.idToken ||
                !firebaseData.refreshToken ||
                !firebaseData.localId
            ) {
                throw new Error(
                    "Firebase no devolvió una sesión válida."
                );
            }

            setSessionCookies(
                response,
                firebaseData.idToken,
                firebaseData.refreshToken
            );

            response.setHeader(
                "Cache-Control",
                "no-store"
            );

            response.status(200).json(
                {
                    ok: true,
                    message: "Sesión iniciada correctamente.",
                    redirectUrl: "/profiles.html"
                }
            );
        } catch (
            error
        ) {
            console.error(
                "Error iniciando sesión con Firebase:",
                error.message
            );

            response.status(500).json(
                {
                    ok: false,
                    message: "Ocurrió un error al conectar con el servidor."
                }
            );
        }
    }
);

/*
 * =========================================================
 * CERRAR SESIÓN
 * =========================================================
 */

app.post(
    "/api/auth/logout",
    (
        request,
        response
    ) => {
        clearSessionCookies(
            response
        );

        response.setHeader(
            "Cache-Control",
            "no-store"
        );

        response.json(
            {
                ok: true
            }
        );
    }
);

/*
 * =========================================================
 * PERFILES DEL USUARIO
 * =========================================================
 */

app.get(
    "/api/profiles",
    async (
        request,
        response
    ) => {
        try {
            const session =
                await getAuthenticatedFirebaseSession(
                    request,
                    response
                );

            if (!session) {
                response.status(401).json(
                    {
                        ok: false,
                        message: "Tu sesión ha caducado. Inicia sesión nuevamente.",
                        redirectUrl: "/login.html"
                    }
                );

                return;
            }

            const databaseBaseUrl =
                getFirebaseDatabaseBaseUrl();

            const profilesUrl =
                `${databaseBaseUrl}` +
                `/users/${encodeURIComponent(session.uid)}` +
                "/profiles.json" +
                `?auth=${encodeURIComponent(session.idToken)}`;

            const profilesResponse =
                await fetch(
                    profilesUrl,
                    {
                        method: "GET",
                        headers: {
                            Accept: "application/json"
                        }
                    }
                );

            if (!profilesResponse.ok) {
                const firebaseErrorText =
                    await profilesResponse.text();

                console.error(
                    "Firebase no permitió leer los perfiles:",
                    firebaseErrorText
                );

                response.status(403).json(
                    {
                        ok: false,
                        message: "No fue posible acceder a los perfiles de esta cuenta."
                    }
                );

                return;
            }

            const rawProfiles =
                await profilesResponse.json();

            const profiles =
                normalizeProfiles(
                    rawProfiles
                );

            response.setHeader(
                "Cache-Control",
                "no-store"
            );

            response.json(
                {
                    ok: true,
                    count: profiles.length,
                    profiles
                }
            );
        } catch (
            error
        ) {
            console.error(
                "Error cargando perfiles:",
                error.message
            );

            response.status(500).json(
                {
                    ok: false,
                    message: "No fue posible cargar los perfiles."
                }
            );
        }
    }
);

function normalizeProfiles(
    rawProfiles
) {
    if (!rawProfiles || typeof rawProfiles !== "object") {
        return [];
    }

    const profileEntries =
        Array.isArray(rawProfiles)
            ? rawProfiles.map(
                (
                    profile,
                    index
                ) => [
                    String(index),
                    profile
                ]
            )
            : Object.entries(rawProfiles);

    return profileEntries
        .map(
            (
                [
                    profileId,
                    profile
                ]
            ) => {
                if (!profile || typeof profile !== "object") {
                    return null;
                }

                const profileName =
                    String(
                        profile.name ||
                        profile.profileName ||
                        ""
                    ).trim();

                if (!profileName) {
                    return null;
                }

                return {
                    id: String(profileId),
                    name: profileName,
                    iconUrl:
                        String(
                            profile.iconUrl ||
                            profile.profileIconUrl ||
                            profile.avatarUrl ||
                            profile.imageUrl ||
                            ""
                        ).trim(),
                    isKids:
                        parseBoolean(
                            profile.isKids ??
                            profile.kids ??
                            false
                        )
                };
            }
        )
        .filter(Boolean);
}

/*
 * =========================================================
 * CATÁLOGO REAL DE FIREBASE
 * =========================================================
 */

registerCatalogRoutes(
    {
        app,
        getAuthenticatedFirebaseSession,
        getFirebaseDatabaseBaseUrl
    }
);

/*
 * =========================================================
 * TMDB
 * =========================================================
 */

let backdropCache = {
    expiresAt: 0,
    items: []
};

function shuffleItems(
    items
) {
    const shuffled = [
        ...items
    ];

    for (
        let index = shuffled.length - 1;
        index > 0;
        index -= 1
    ) {
        const randomIndex =
            Math.floor(
                Math.random() * (index + 1)
            );

        [
            shuffled[index],
            shuffled[randomIndex]
        ] = [
            shuffled[randomIndex],
            shuffled[index]
        ];
    }

    return shuffled;
}

function normalizeLimit(
    rawLimit
) {
    const parsedLimit =
        Number.parseInt(
            rawLimit,
            10
        );

    if (Number.isNaN(parsedLimit)) {
        return 8;
    }

    return Math.min(
        Math.max(
            parsedLimit,
            4
        ),
        16
    );
}

async function loadTrendingBackdrops() {
    const now =
        Date.now();

    if (
        backdropCache.items.length > 0 &&
        backdropCache.expiresAt > now
    ) {
        return backdropCache.items;
    }

    if (!TMDB_TOKEN) {
        throw new Error("Falta configurar TMDB_TOKEN en Render.");
    }

    const tmdbUrl =
        `${TMDB_API_BASE_URL}` +
        "/trending/all/week" +
        "?language=es-ES";

    const tmdbResponse =
        await fetch(
            tmdbUrl,
            {
                method: "GET",
                headers: {
                    Accept: "application/json",
                    Authorization: `Bearer ${TMDB_TOKEN}`
                }
            }
        );

    if (!tmdbResponse.ok) {
        throw new Error(
            `TMDB respondió con el código ${tmdbResponse.status}.`
        );
    }

    const tmdbData =
        await tmdbResponse.json();

    const usedImages =
        new Set();

    const normalizedItems =
        tmdbData
            .results
            .filter(
                (
                    item
                ) =>
                    (
                        item.media_type === "movie" ||
                        item.media_type === "tv"
                    ) &&
                    Boolean(item.backdrop_path)
            )
            .map(
                (
                    item
                ) => {
                    return {
                        id: item.id,
                        type: item.media_type,
                        title: item.title || item.name || "Sin título",
                        backdropUrl: `${TMDB_IMAGE_BASE_URL}${item.backdrop_path}`
                    };
                }
            )
            .filter(
                (
                    item
                ) => {
                    if (usedImages.has(item.backdropUrl)) {
                        return false;
                    }

                    usedImages.add(item.backdropUrl);

                    return true;
                }
            );

    backdropCache = {
        expiresAt: now + TMDB_CACHE_DURATION_MS,
        items: normalizedItems
    };

    return normalizedItems;
}

app.get(
    "/api/tmdb/backdrops",
    async (
        request,
        response
    ) => {
        try {
            const requestedType =
                request.query.type === "movie" ||
                request.query.type === "tv"
                    ? request.query.type
                    : "all";

            const limit =
                normalizeLimit(
                    request.query.limit
                );

            const allItems =
                await loadTrendingBackdrops();

            const filteredItems =
                requestedType === "all"
                    ? allItems
                    : allItems.filter(
                        (
                            item
                        ) =>
                            item.type === requestedType
                    );

            const selectedItems =
                shuffleItems(
                    filteredItems
                ).slice(
                    0,
                    limit
                );

            response.setHeader(
                "Cache-Control",
                "public, max-age=300"
            );

            response.json(
                {
                    count: selectedItems.length,
                    type: requestedType,
                    images: selectedItems
                }
            );
        } catch (
            error
        ) {
            console.error(
                "Error cargando portadas desde TMDB:",
                error.message
            );

            response.status(500).json(
                {
                    error: "No se pudieron cargar las portadas desde TMDB."
                }
            );
        }
    }
);

/*
 * =========================================================
 * ARCHIVOS PÚBLICOS
 * =========================================================
 */

app.use(
    express.static(
        path.join(__dirname),
        {
            index: false,
            dotfiles: "deny"
        }
    )
);

app.get(
    "/",
    (
        request,
        response
    ) => {
        response.sendFile(
            path.join(
                __dirname,
                "index.html"
            )
        );
    }
);

/*
 * =========================================================
 * ARRANQUE
 * =========================================================
 */

app.listen(
    PORT,
    () => {
        console.log(
            `VeiCloud Web funcionando en el puerto ${PORT}.`
        );

        console.log(
            FIREBASE_DATABASE_URL
                ? "Firebase Database URL configurada."
                : "Aviso: falta configurar FIREBASE_DATABASE_URL."
        );

        console.log(
            FIREBASE_SERVICE_ACCOUNT_JSON
                ? "Firebase Admin configurado."
                : "Aviso: falta configurar FIREBASE_SERVICE_ACCOUNT_JSON."
        );

        console.log(
            BREVO_API_KEY
                ? "Brevo API HTTPS configurado para envío de correos."
                : "Aviso: falta configurar BREVO_API_KEY."
        );

        console.log(
            EMAIL_FROM
                ? `Remitente configurado: ${EMAIL_FROM}`
                : "Aviso: falta configurar EMAIL_FROM."
        );

        console.log(
            "Catálogo Firebase conectado en /api/catalog."
        );
    }
);
