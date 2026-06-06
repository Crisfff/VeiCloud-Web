const express = require("express");
const path = require("path");

const app = express();

const PORT =
    process.env.PORT ||
    3000;

/*
 * =========================================================
 * VARIABLES PRIVADAS DE RENDER
 * =========================================================
 */

const TMDB_TOKEN =
    process.env.TMDB_TOKEN;

const FIREBASE_WEB_API_KEY =
    process.env.FIREBASE_WEB_API_KEY;

const FIREBASE_DATABASE_URL =
    process.env.FIREBASE_DATABASE_URL;

/*
 * =========================================================
 * CONFIGURACIÓN GENERAL
 * =========================================================
 */

const TMDB_API_BASE_URL =
    "https://api.themoviedb.org/3";

const TMDB_IMAGE_BASE_URL =
    "https://image.tmdb.org/t/p/w1280";

const TMDB_CACHE_DURATION_MS =
    15 * 60 * 1000;

const ID_TOKEN_COOKIE_NAME =
    "veicloud_id_token";

const REFRESH_TOKEN_COOKIE_NAME =
    "veicloud_refresh_token";

const ID_TOKEN_COOKIE_DURATION_SECONDS =
    60 * 60;

const REFRESH_TOKEN_COOKIE_DURATION_SECONDS =
    30 * 24 * 60 * 60;

/*
 * Permite recibir formularios JSON desde el navegador.
 */
app.use(
    express.json(
        {
            limit: "16kb"
        }
    )
);

/*
 * =========================================================
 * PROTECCIÓN DE ARCHIVOS INTERNOS
 * =========================================================
 *
 * Evita que ciertos archivos del servidor puedan descargarse
 * directamente desde el navegador.
 */

app.use(
    (
        request,
        response,
        next
    ) => {
        const blockedPaths = [
            "/server.js",
            "/package.json",
            "/package-lock.json",
            "/node_modules",
            "/.git"
        ];

        const isBlocked =
            blockedPaths.some(
                (blockedPath) =>
                    request.path ===
                        blockedPath ||
                    request.path.startsWith(
                        `${blockedPath}/`
                    )
            );

        if (isBlocked) {
            response
                .status(404)
                .end();

            return;
        }

        next();
    }
);

/*
 * =========================================================
 * UTILIDADES DE COOKIES
 * =========================================================
 */

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

/*
 * Convierte errores técnicos de Firebase en mensajes sencillos.
 */
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

/*
 * =========================================================
 * FIREBASE AUTHENTICATION
 * =========================================================
 */

/*
 * Inicia sesión con el mismo correo y contraseña
 * utilizados en la aplicación Android.
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
                    request.body?.email ||
                    ""
                )
                    .trim()
                    .toLowerCase();

            const password =
                String(
                    request.body?.password ||
                    ""
                );

            if (
                !email ||
                !password
            ) {
                response
                    .status(400)
                    .json(
                        {
                            ok: false,
                            message:
                                "Escribe tu correo y contraseña."
                        }
                    );

                return;
            }

            if (
                email.length > 180 ||
                password.length > 256
            ) {
                response
                    .status(400)
                    .json(
                        {
                            ok: false,
                            message:
                                "Los datos introducidos no son válidos."
                        }
                    );

                return;
            }

            if (!FIREBASE_WEB_API_KEY) {
                throw new Error(
                    "Falta configurar FIREBASE_WEB_API_KEY en Render."
                );
            }

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
                            "Content-Type":
                                "application/json",

                            Accept:
                                "application/json"
                        },

                        body:
                            JSON.stringify(
                                {
                                    email,
                                    password,
                                    returnSecureToken:
                                        true
                                }
                            )
                    }
                );

            const firebaseData =
                await firebaseResponse.json();

            if (!firebaseResponse.ok) {
                const firebaseErrorCode =
                    firebaseData
                        ?.error
                        ?.message ||
                    "UNKNOWN_AUTH_ERROR";

                const statusCode =
                    firebaseErrorCode ===
                    "TOO_MANY_ATTEMPTS_TRY_LATER"
                        ? 429
                        : 401;

                response
                    .status(statusCode)
                    .json(
                        {
                            ok: false,
                            message:
                                getReadableFirebaseAuthError(
                                    firebaseErrorCode
                                )
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

            response.setHeader(
                "Set-Cookie",
                [
                    createSecureCookie(
                        ID_TOKEN_COOKIE_NAME,
                        firebaseData.idToken,
                        ID_TOKEN_COOKIE_DURATION_SECONDS
                    ),

                    createSecureCookie(
                        REFRESH_TOKEN_COOKIE_NAME,
                        firebaseData.refreshToken,
                        REFRESH_TOKEN_COOKIE_DURATION_SECONDS
                    )
                ]
            );

            response.setHeader(
                "Cache-Control",
                "no-store"
            );

            response
                .status(200)
                .json(
                    {
                        ok: true,

                        message:
                            "Sesión iniciada correctamente.",

                        redirectUrl:
                            "/profiles.html"
                    }
                );
        } catch (error) {
            console.error(
                "Error iniciando sesión con Firebase:",
                error.message
            );

            response
                .status(500)
                .json(
                    {
                        ok: false,

                        message:
                            "Ocurrió un error al conectar con el servidor."
                    }
                );
        }
    }
);

/*
 * Cierra la sesión eliminando las cookies.
 */
app.post(
    "/api/auth/logout",
    (
        request,
        response
    ) => {
        response.setHeader(
            "Set-Cookie",
            [
                createExpiredCookie(
                    ID_TOKEN_COOKIE_NAME
                ),

                createExpiredCookie(
                    REFRESH_TOKEN_COOKIE_NAME
                )
            ]
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
    const shuffled =
        [...items];

    for (
        let index =
            shuffled.length - 1;
        index > 0;
        index -= 1
    ) {
        const randomIndex =
            Math.floor(
                Math.random() *
                (index + 1)
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

    if (
        Number.isNaN(
            parsedLimit
        )
    ) {
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
        backdropCache.items.length >
            0 &&
        backdropCache.expiresAt >
            now
    ) {
        return backdropCache.items;
    }

    if (!TMDB_TOKEN) {
        throw new Error(
            "Falta configurar TMDB_TOKEN en Render."
        );
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
                    accept:
                        "application/json",

                    Authorization:
                        `Bearer ${TMDB_TOKEN}`
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
        tmdbData.results
            .filter(
                (item) =>
                    (
                        item.media_type ===
                            "movie" ||
                        item.media_type ===
                            "tv"
                    ) &&
                    Boolean(
                        item.backdrop_path
                    )
            )
            .map(
                (item) => {
                    return {
                        id:
                            item.id,

                        type:
                            item.media_type,

                        title:
                            item.title ||
                            item.name ||
                            "Sin título",

                        backdropUrl:
                            `${TMDB_IMAGE_BASE_URL}${item.backdrop_path}`
                    };
                }
            )
            .filter(
                (item) => {
                    if (
                        usedImages.has(
                            item.backdropUrl
                        )
                    ) {
                        return false;
                    }

                    usedImages.add(
                        item.backdropUrl
                    );

                    return true;
                }
            );

    backdropCache = {
        expiresAt:
            now +
            TMDB_CACHE_DURATION_MS,

        items:
            normalizedItems
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
                request.query.type ===
                    "movie" ||
                request.query.type ===
                    "tv"
                    ? request.query.type
                    : "all";

            const limit =
                normalizeLimit(
                    request.query.limit
                );

            const allItems =
                await loadTrendingBackdrops();

            const filteredItems =
                requestedType ===
                    "all"
                    ? allItems
                    : allItems.filter(
                        (item) =>
                            item.type ===
                            requestedType
                    );

            const selectedItems =
                shuffleItems(
                    filteredItems
                ).slice(
                    0,
                    limit
                );

            response.set(
                "Cache-Control",
                "public, max-age=300"
            );

            response.json(
                {
                    count:
                        selectedItems.length,

                    type:
                        requestedType,

                    images:
                        selectedItems
                }
            );
        } catch (error) {
            console.error(
                "Error cargando portadas desde TMDB:",
                error.message
            );

            response
                .status(500)
                .json(
                    {
                        error:
                            "No se pudieron cargar las portadas desde TMDB."
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
        path.join(
            __dirname
        ),
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
                : "Aviso: todavía falta FIREBASE_DATABASE_URL."
        );
    }
);
