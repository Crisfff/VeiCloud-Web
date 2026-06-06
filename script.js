/*
 * =========================================================
 * VEICLOUD WEB
 * Fondo dinámico con películas y series desde TMDB
 * =========================================================
 */

const TMDB_BACKDROPS_ENDPOINT =
    "/api/tmdb/backdrops?type=all&limit=8";

const BACKDROPS_REFRESH_INTERVAL_MS =
    5 * 60 * 1000;

const MOSAIC_ROTATION_INTERVAL_MS =
    20 * 1000;

let currentBackdrops = [];

let rotationTimer =
    null;

let refreshTimer =
    null;

/*
 * Inicia el fondo dinámico cuando la página termina de cargar.
 */
document.addEventListener(
    "DOMContentLoaded",
    () => {
        initializeTmdbMosaic();
    }
);

async function initializeTmdbMosaic() {
    await refreshTmdbBackdrops();

    refreshTimer =
        window.setInterval(
            refreshTmdbBackdrops,
            BACKDROPS_REFRESH_INTERVAL_MS
        );

    rotationTimer =
        window.setInterval(
            rotateMosaic,
            MOSAIC_ROTATION_INTERVAL_MS
        );
}

/*
 * Obtiene las portadas horizontales desde nuestro servidor.
 */
async function refreshTmdbBackdrops() {
    try {
        const response =
            await fetch(
                TMDB_BACKDROPS_ENDPOINT,
                {
                    method:
                        "GET",

                    cache:
                        "no-store",

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

        const validatedBackdrops =
            normalizeBackdrops(
                data.images
            );

        if (
            validatedBackdrops.length === 0
        ) {
            throw new Error(
                "No llegaron imágenes válidas desde TMDB."
            );
        }

        currentBackdrops =
            fillMosaicSlots(
                validatedBackdrops
            );

        await preloadImages(
            currentBackdrops
        );

        renderTmdbMosaic(
            currentBackdrops
        );

        console.log(
            "Mosaico de TMDB cargado correctamente."
        );
    } catch (error) {
        console.error(
            "No fue posible cargar el mosaico de TMDB:",
            error
        );
    }
}

/*
 * Conserva únicamente enlaces válidos del CDN oficial de TMDB.
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
                    const imageUrl =
                        new URL(
                            item.backdropUrl
                        );

                    if (
                        imageUrl.protocol !==
                            "https:" ||
                        imageUrl.hostname !==
                            "image.tmdb.org"
                    ) {
                        return null;
                    }

                    if (
                        usedUrls.has(
                            imageUrl.href
                        )
                    ) {
                        return null;
                    }

                    usedUrls.add(
                        imageUrl.href
                    );

                    return {
                        id:
                            item.id ?? "",

                        type:
                            item.type ?? "unknown",

                        title:
                            item.title ??
                            "Contenido de VeiCloud",

                        backdropUrl:
                            imageUrl.href
                    };
                } catch {
                    return null;
                }
            }
        )
        .filter(Boolean);
}

/*
 * El mosaico necesita exactamente ocho imágenes.
 * Si llegan menos, reutiliza algunas sin romper el diseño.
 */
function fillMosaicSlots(backdrops) {
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
 * Precarga las imágenes para evitar cuadros vacíos
 * durante la primera aparición.
 */
async function preloadImages(backdrops) {
    const tasks =
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
        tasks
    );
}

/*
 * Cambia el orden de las portadas periódicamente.
 */
function rotateMosaic() {
    if (
        currentBackdrops.length <= 1
    ) {
        return;
    }

    currentBackdrops = [
        ...currentBackdrops.slice(
            1
        ),
        currentBackdrops[0]
    ];

    renderTmdbMosaic(
        currentBackdrops
    );
}

/*
 * Genera el CSS dinámico del mosaico.
 *
 * Escritorio:
 * 4 columnas x 2 filas
 *
 * Móvil:
 * 2 columnas x 4 filas
 */
function renderTmdbMosaic(backdrops) {
    const imageLayers =
        backdrops
            .map(
                (item) =>
                    `url("${item.backdropUrl}")`
            )
            .join(",\n");

    let styleElement =
        document.getElementById(
            "tmdb-mosaic-style"
        );

    if (!styleElement) {
        styleElement =
            document.createElement(
                "style"
            );

        styleElement.id =
            "tmdb-mosaic-style";

        document.head.appendChild(
            styleElement
        );
    }

    styleElement.textContent =
        `
        /*
         * Fondo dinámico generado desde TMDB.
         */

        .hero {
            isolation: isolate !important;
            background: #050505 !important;
        }

        .hero::before {
            position: absolute;
            z-index: 0;
            inset: 0;

            content: "";

            background-image:
                linear-gradient(
                    90deg,
                    rgba(5, 5, 5, 1) 0%,
                    rgba(5, 5, 5, 0.98) 17%,
                    rgba(5, 5, 5, 0.88) 34%,
                    rgba(5, 5, 5, 0.48) 58%,
                    rgba(5, 5, 5, 0.24) 78%,
                    rgba(5, 5, 5, 0.50) 100%
                ),
                linear-gradient(
                    0deg,
                    rgba(5, 5, 5, 1) 0%,
                    rgba(5, 5, 5, 0.62) 14%,
                    rgba(5, 5, 5, 0.06) 52%,
                    rgba(5, 5, 5, 0.34) 100%
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

            filter:
                saturate(0.90)
                contrast(1.06)
                brightness(0.92);

            transform:
                scale(1.02);
        }

        .hero-overlay {
            z-index: 1;
        }

        .hero-content {
            z-index: 2;
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
                        rgba(5, 5, 5, 0.98) 27%,
                        rgba(5, 5, 5, 0.60) 57%,
                        rgba(5, 5, 5, 0.24) 100%
                    ),
                    linear-gradient(
                        90deg,
                        rgba(5, 5, 5, 0.20),
                        rgba(5, 5, 5, 0.08)
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
