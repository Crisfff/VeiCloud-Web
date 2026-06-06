/*
 * =========================================================
 * VEICLOUD WEB
 * Fondo dinámico con portadas horizontales de TMDB
 * =========================================================
 */

const TMDB_BACKDROPS_ENDPOINT =
    "/api/tmdb/backdrops?type=all&limit=8";

const BACKDROP_REFRESH_INTERVAL_MS =
    5 * 60 * 1000;

const MOSAIC_ROTATION_INTERVAL_MS =
    22 * 1000;

let currentBackdrops = [];

let mosaicRotationTimer = null;

let backdropsRefreshTimer = null;

/*
 * Espera a que el HTML esté completamente cargado.
 */
document.addEventListener(
    "DOMContentLoaded",
    () => {
        loadTmdbBackdrops();

        backdropsRefreshTimer =
            window.setInterval(
                loadTmdbBackdrops,
                BACKDROP_REFRESH_INTERVAL_MS
            );
    }
);

/*
 * Solicita películas y series al pequeño servidor
 * que creamos en Render.
 */
async function loadTmdbBackdrops() {
    try {
        const response =
            await fetch(
                TMDB_BACKDROPS_ENDPOINT,
                {
                    method:
                        "GET",

                    headers: {
                        Accept:
                            "application/json"
                    }
                }
            );

        if (!response.ok) {
            throw new Error(
                `Error HTTP ${response.status}`
            );
        }

        const data =
            await response.json();

        const validatedImages =
            normalizeBackdrops(
                data.images
            );

        if (
            validatedImages.length === 0
        ) {
            throw new Error(
                "TMDB no devolvió imágenes válidas."
            );
        }

        currentBackdrops =
            ensureEightBackdrops(
                validatedImages
            );

        await preloadBackdrops(
            currentBackdrops
        );

        renderBackdropMosaic(
            currentBackdrops
        );

        restartMosaicRotation();

        console.log(
            "Portadas de TMDB cargadas correctamente."
        );
    } catch (error) {
        console.error(
            "No fue posible cargar las portadas de TMDB:",
            error
        );

        /*
         * Si ocurre un error, no borramos el fondo anterior.
         * La portada continúa funcionando sin quedar vacía.
         */
    }
}

/*
 * Conserva solamente enlaces seguros del CDN oficial
 * de imágenes de TMDB.
 */
function normalizeBackdrops(rawImages) {
    if (!Array.isArray(rawImages)) {
        return [];
    }

    const usedUrls =
        new Set();

    return rawImages
        .map(
            (item) => {
                if (
                    typeof item?.backdropUrl !==
                    "string"
                ) {
                    return null;
                }

                try {
                    const parsedUrl =
                        new URL(
                            item.backdropUrl
                        );

                    if (
                        parsedUrl.protocol !==
                            "https:" ||
                        parsedUrl.hostname !==
                            "image.tmdb.org"
                    ) {
                        return null;
                    }

                    if (
                        usedUrls.has(
                            parsedUrl.href
                        )
                    ) {
                        return null;
                    }

                    usedUrls.add(
                        parsedUrl.href
                    );

                    return {
                        id:
                            item.id ?? "",

                        title:
                            item.title ??
                            "Contenido de VeiCloud",

                        type:
                            item.type ??
                            "unknown",

                        backdropUrl:
                            parsedUrl.href
                    };
                } catch {
                    return null;
                }
            }
        )
        .filter(Boolean);
}

/*
 * El mosaico utiliza ocho espacios.
 *
 * En el caso extraño de que TMDB devuelva menos imágenes,
 * reutilizamos algunas para no romper el diseño.
 */
function ensureEightBackdrops(backdrops) {
    const result =
        [...backdrops];

    let index =
        0;

    while (
        result.length < 8 &&
        backdrops.length > 0
    ) {
        result.push(
            backdrops[
                index %
                backdrops.length
            ]
        );

        index +=
            1;
    }

    return result.slice(
        0,
        8
    );
}

/*
 * Descarga silenciosamente las imágenes antes de
 * insertarlas para evitar destellos vacíos en pantalla.
 */
async function preloadBackdrops(backdrops) {
    const preloadTasks =
        backdrops.map(
            (item) => {
                return new Promise(
                    (resolve) => {
                        const image =
                            new Image();

                        image.onload =
                            resolve;

                        image.onerror =
                            resolve;

                        image.src =
                            item.backdropUrl;
                    }
                );
            }
        );

    await Promise.all(
        preloadTasks
    );
}

/*
 * Cambia el orden de las imágenes cada cierto tiempo.
 * Así el fondo se siente vivo sin marear al visitante.
 */
function restartMosaicRotation() {
    if (
        mosaicRotationTimer !== null
    ) {
        window.clearInterval(
            mosaicRotationTimer
        );
    }

    mosaicRotationTimer =
        window.setInterval(
            () => {
                currentBackdrops =
                    rotateBackdrops(
                        currentBackdrops
                    );

                renderBackdropMosaic(
                    currentBackdrops
                );
            },
            MOSAIC_ROTATION_INTERVAL_MS
        );
}

/*
 * Mueve la primera portada al final.
 */
function rotateBackdrops(backdrops) {
    if (
        backdrops.length <= 1
    ) {
        return backdrops;
    }

    return [
        ...backdrops.slice(1),
        backdrops[0]
    ];
}

/*
 * Inyecta el fondo dinámico del hero.
 *
 * Escritorio:
 * - cuatro columnas
 * - dos filas
 *
 * Móvil:
 * - dos columnas
 * - cuatro filas
 */
function renderBackdropMosaic(backdrops) {
    const imageLayers =
        backdrops
            .map(
                (item) =>
                    `url("${item.backdropUrl}")`
            )
            .join(",\n");

    let dynamicStyle =
        document.getElementById(
            "tmdb-dynamic-mosaic"
        );

    if (!dynamicStyle) {
        dynamicStyle =
            document.createElement(
                "style"
            );

        dynamicStyle.id =
            "tmdb-dynamic-mosaic";

        document.head.appendChild(
            dynamicStyle
        );
    }

    dynamicStyle.textContent =
        `
        /*
         * Fondo generado automáticamente desde TMDB.
         */

        .hero::before {
            background-image:
                linear-gradient(
                    90deg,
                    rgba(5, 5, 5, 1) 0%,
                    rgba(5, 5, 5, 0.98) 16%,
                    rgba(5, 5, 5, 0.88) 32%,
                    rgba(5, 5, 5, 0.52) 56%,
                    rgba(5, 5, 5, 0.28) 78%,
                    rgba(5, 5, 5, 0.52) 100%
                ),
                linear-gradient(
                    0deg,
                    rgba(5, 5, 5, 1) 0%,
                    rgba(5, 5, 5, 0.66) 15%,
                    rgba(5, 5, 5, 0.06) 48%,
                    rgba(5, 5, 5, 0.36) 100%
                ),
                ${imageLayers};

            background-repeat:
                no-repeat;

            background-size:
                100% 100%,
                100% 100%,
                25% 50%,
                25% 50%,
                25% 50%,
                25% 50%,
                25% 50%,
                25% 50%,
                25% 50%,
                25% 50%;

            background-position:
                center,
                center,
                0% 0%,
                33.333% 0%,
                66.667% 0%,
                100% 0%,
                0% 100%,
                33.333% 100%,
                66.667% 100%,
                100% 100%;

            transition:
                opacity 600ms ease;
        }

        @media (max-width: 900px) {
            .hero::before {
                background-size:
                    100% 100%,
                    100% 100%,
                    50% 25%,
                    50% 25%,
                    50% 25%,
                    50% 25%,
                    50% 25%,
                    50% 25%,
                    50% 25%,
                    50% 25%;

                background-position:
                    center,
                    center,
                    0% 0%,
                    100% 0%,
                    0% 33.333%,
                    100% 33.333%,
                    0% 66.667%,
                    100% 66.667%,
                    0% 100%,
                    100% 100%;
            }
        }

        @media (max-width: 600px) {
            .hero::before {
                background-image:
                    linear-gradient(
                        0deg,
                        rgba(5, 5, 5, 1) 0%,
                        rgba(5, 5, 5, 0.98) 26%,
                        rgba(5, 5, 5, 0.61) 55%,
                        rgba(5, 5, 5, 0.28) 100%
                    ),
                    linear-gradient(
                        90deg,
                        rgba(5, 5, 5, 0.18),
                        rgba(5, 5, 5, 0.10)
                    ),
                    ${imageLayers};

                background-size:
                    100% 100%,
                    100% 100%,
                    62% 25%,
                    62% 25%,
                    62% 25%,
                    62% 25%,
                    62% 25%,
                    62% 25%,
                    62% 25%,
                    62% 25%;

                background-position:
                    center,
                    center,
                    -18% 0%,
                    118% 0%,
                    -18% 33.333%,
                    118% 33.333%,
                    -18% 66.667%,
                    118% 66.667%,
                    -18% 100%,
                    118% 100%;
            }
        }
        `;
}
