const express = require("express");
const path = require("path");

const app = express();

const PORT = process.env.PORT || 3000;

const TMDB_TOKEN = process.env.TMDB_TOKEN;

const TMDB_API_BASE_URL =
    "https://api.themoviedb.org/3";

const TMDB_IMAGE_BASE_URL =
    "https://image.tmdb.org/t/p/w1280";

const CACHE_DURATION_MS =
    15 * 60 * 1000;

let backdropCache = {
    expiresAt: 0,
    items: []
};

/*
 * Mezcla las portadas para que el fondo no muestre
 * siempre exactamente el mismo orden.
 */
function shuffleItems(items) {
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

/*
 * Controla cuántas imágenes puede solicitar el navegador.
 */
function normalizeLimit(rawLimit) {
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

/*
 * Obtiene tendencias semanales desde TMDB.
 * Conserva únicamente películas y series
 * que tengan portada horizontal.
 */
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
        throw new Error(
            "Falta configurar la variable TMDB_TOKEN en Render."
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
            CACHE_DURATION_MS,

        items:
            normalizedItems
    };

    return normalizedItems;
}

/*
 * Endpoint utilizado por script.js para solicitar
 * portadas dinámicas.
 *
 * Ejemplos:
 * /api/tmdb/backdrops
 * /api/tmdb/backdrops?type=movie&limit=8
 * /api/tmdb/backdrops?type=tv&limit=8
 */
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

            response.status(
                500
            ).json(
                {
                    error:
                        "No se pudieron cargar las portadas desde TMDB."
                }
            );
        }
    }
);

/*
 * Publica index.html, styles.css y script.js.
 */
app.use(
    express.static(
        path.join(
            __dirname
        )
    )
);

/*
 * Abre la portada principal cuando alguien entra
 * directamente al dominio.
 */
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

app.listen(
    PORT,
    () => {
        console.log(
            `VeiCloud Web funcionando en el puerto ${PORT}.`
        );
    }
);
