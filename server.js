const express = require("express");
const path = require("path");
const nodemailer = require("nodemailer");

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

const EMAIL_USER = process.env.EMAIL_USER;

const EMAIL_PASS = process.env.EMAIL_PASS
    ? String(process.env.EMAIL_PASS).replace(/\s/g, "")
    : "";

const EMAIL_FROM =
    process.env.EMAIL_FROM ||
    `VeiCloud <${EMAIL_USER}>`;

const LOGIN_CODE_DURATION_MS = 5 * 60 * 1000;

const LOGIN_CODE_MAX_ATTEMPTS = 5;

const loginCodesByUid = new Map();

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
            limit: "16kb"
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

                const name = part.slice(0, separatorIndex);

                const rawValue = part.slice(separatorIndex + 1);

                try {
                    cookies[name] = decodeURIComponent(rawValue);
                } catch {
                    cookies[name] = rawValue;
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
 * CORREO Y CÓDIGO
 * =========================================================
 */

function requireEmailConfiguration() {
    if (!EMAIL_USER || !EMAIL_PASS) {
        throw new Error("Falta configurar EMAIL_USER y EMAIL_PASS en Render.");
    }

    if (!EMAIL_USER.includes("@")) {
        throw new Error("EMAIL_USER no parece un correo válido.");
    }
}

function createEmailTransporter() {
    requireEmailConfiguration();

    return nodemailer.createTransport(
        {
            host: "smtp.gmail.com",
            port: 465,
            secure: true,

            auth: {
                user: EMAIL_USER,
                pass: EMAIL_PASS
            },

            connectionTimeout: 10000,
            greetingTimeout: 10000,
            socketTimeout: 15000
        }
    );
}

function generateFourDigitCode() {
    return String(
        Math.floor(
            1000 +
            Math.random() * 9000
        )
    );
}

function maskEmail(
    email
) {
    const cleanEmail = String(email || "").trim();

    const [
        name,
        domain
    ] = cleanEmail.split("@");

    if (!name || !domain) {
        return cleanEmail;
    }

    return `${name.slice(0, 2)}***@${domain}`;
}

function createLoginCodeEmailHtml(
    code
) {
    return `
        <div style="background:#050507;padding:28px;font-family:Arial,sans-serif;color:#ffffff;">
            <div style="max-width:520px;margin:0 auto;background:#111116;border-radius:22px;padding:28px;">
                <h1 style="margin:0 0 12px;font-size:28px;font-weight:900;color:#ffffff;">
                    VeiCloud
                </h1>

                <p style="color:#b8b8c2;font-size:15px;line-height:22px;margin:0;">
                    Tu código de verificación para iniciar sesión es:
                </p>

                <div style="margin:24px 0;padding:20px;border-radius:18px;background:#191920;text-align:center;">
                    <span style="font-size:42px;font-weight:900;letter-spacing:10px;color:#E50914;">
                        ${code}
                    </span>
                </div>

                <p style="color:#b8b8c2;font-size:14px;line-height:22px;margin:0;">
                    Este código vence en 5 minutos. Si no fuiste tú, ignora este correo.
                </p>
            </div>
        </div>
    `;
}

async function sendLoginCodeEmail(
    email,
    code
) {
    const transporter = createEmailTransporter();

    console.log(
        "Intentando enviar código a:",
        email
    );

    try {
        const result = await transporter.sendMail(
            {
                from: EMAIL_FROM,
                to: email,
                subject: "Tu código de acceso a VeiCloud",
                text: `Tu código de acceso a VeiCloud es: ${code}. Vence en 5 minutos.`,
                html: createLoginCodeEmailHtml(code)
            }
        );

        console.log(
            "Correo enviado correctamente:",
            result.messageId
        );

        return result;
    } finally {
        transporter.close();
    }
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

    const lookupResponse = await fetch(
        lookupUrl,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json"
            },
            body: JSON.stringify(
                {
                    idToken
                }
            )
        }
    );

    if (!lookupResponse.ok) {
        return null;
    }

    const lookupData = await lookupResponse.json();

    const user = lookupData?.users?.[0];

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

    const formBody = new URLSearchParams();

    formBody.set(
        "grant_type",
        "refresh_token"
    );

    formBody.set(
        "refresh_token",
        refreshToken
    );

    const refreshResponse = await fetch(
        refreshUrl,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                Accept: "application/json"
            },
            body: formBody.toString()
        }
    );

    if (!refreshResponse.ok) {
        return null;
    }

    const refreshData = await refreshResponse.json();

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
    const cookies = parseCookies(
        request.headers.cookie
    );

    const currentIdToken = cookies[ID_TOKEN_COOKIE_NAME];

    const currentRefreshToken = cookies[REFRESH_TOKEN_COOKIE_NAME];

    if (!currentIdToken && !currentRefreshToken) {
        return null;
    }

    if (currentIdToken) {
        const firebaseAccount = await lookupFirebaseAccount(
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

    const renewedSession = await refreshFirebaseSession(
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
 * CÓDIGO DE 4 DÍGITOS PARA ANDROID
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

            const idToken = String(
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

            const account = await lookupFirebaseAccount(
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

            const code = generateFourDigitCode();

            const now = Date.now();

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
                    command: error.command,
                    response: error.response,
                    responseCode: error.responseCode,
                    message: error.message
                }
            );

            response.status(500).json(
                {
                    ok: false,
                    message: `No se pudo enviar el código. ${error.message || "Revisa la configuración del correo."}`
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
            const idToken = String(
                request.body?.idToken || ""
            ).trim();

            const code = String(
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

            const account = await lookupFirebaseAccount(
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

            const savedCodeData = loginCodesByUid.get(
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
                    command: error.command,
                    response: error.response,
                    responseCode: error.responseCode,
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
            const email = String(
                request.body?.email || ""
            )
                .trim()
                .toLowerCase();

            const password = String(
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

            const firebaseResponse = await fetch(
                firebaseLoginUrl,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Accept: "application/json"
                    },
                    body: JSON.stringify(
                        {
                            email,
                            password,
                            returnSecureToken: true
                        }
                    )
                }
            );

            const firebaseData = await firebaseResponse.json();

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
            const session = await getAuthenticatedFirebaseSession(
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

            const databaseBaseUrl = getFirebaseDatabaseBaseUrl();

            const profilesUrl =
                `${databaseBaseUrl}` +
                `/users/${encodeURIComponent(session.uid)}` +
                "/profiles.json" +
                `?auth=${encodeURIComponent(session.idToken)}`;

            const profilesResponse = await fetch(
                profilesUrl,
                {
                    method: "GET",
                    headers: {
                        Accept: "application/json"
                    }
                }
            );

            if (!profilesResponse.ok) {
                const firebaseErrorText = await profilesResponse.text();

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

            const rawProfiles = await profilesResponse.json();

            const profiles = normalizeProfiles(
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

    const profileEntries = Array.isArray(rawProfiles)
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

                const profileName = String(
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
                    iconUrl: String(
                        profile.iconUrl ||
                        profile.profileIconUrl ||
                        profile.avatarUrl ||
                        profile.imageUrl ||
                        ""
                    ).trim(),
                    isKids: parseBoolean(
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
        const randomIndex = Math.floor(
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
    const parsedLimit = Number.parseInt(
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
    const now = Date.now();

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

    const tmdbResponse = await fetch(
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

    const tmdbData = await tmdbResponse.json();

    const usedImages = new Set();

    const normalizedItems = tmdbData
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

            const limit = normalizeLimit(
                request.query.limit
            );

            const allItems = await loadTrendingBackdrops();

            const filteredItems =
                requestedType === "all"
                    ? allItems
                    : allItems.filter(
                        (
                            item
                        ) =>
                            item.type === requestedType
                    );

            const selectedItems = shuffleItems(
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
            EMAIL_USER
                ? `Correo de verificación configurado: ${EMAIL_USER}`
                : "Aviso: falta configurar EMAIL_USER."
        );

        console.log(
            "SMTP Gmail configurado con timeout corto."
        );

        console.log(
            "Catálogo Firebase conectado en /api/catalog."
        );
    }
);
