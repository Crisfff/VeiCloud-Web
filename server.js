const express = require("express");
const path = require("path");

const app = express();

const PORT = process.env.PORT || 3000;

/*
 * Este token NO se escribe en GitHub.
 * Más adelante lo añadiremos desde el panel de Render:
 *
 * TMDB_TOKEN = tu_token_de_lectura_de_TMDB
 */
const TMDB_TOKEN = process.env.TMDB_TOKEN;

const TMDB_API_BASE_URL =
    "https://api.themoviedb.org/3";

const TMDB_IMAGE_BASE_URL =
    "https://image.tmdb.org/t/p/w1280";

/*
 * Guardamos temporalmente los resultados para no consultar
 * TMDB cada vez que alguien abra la portada.
 */
const CACHE_DURATION_MS =
    15 * 60 * 1000;

let backdropCache = {
    expiresAt: 0,
    items: []
};

/*
 * Mezcla los resultados para que el fondo cambie
 * y no aparezcan siempre las mismas portadas.
 */
function shuffleItems(items) {
    const shuffled = [...items];

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

/*
 * Evita pedir cantidades exageradas desde la URL.
 */
function normalizeLimit(rawLimit) {
    const parsedLimit =
        Number.parseInt(
            rawLimit,
            10
        );

    if (
        Number.isNaN(parsedLimit)
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
 * Descarga las tendencias actuales desde TMDB.
 *
 * TMDB devuelve películas y series.
 * Conservamos únicamente los elementos que tengan
 * portada horizontal: backdrop_path.
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

    if (
        !TMDB_TOKEN
    ) {
        throw new Error(
            "La variable TMDB_TOKEN todavía no está configurada."
        );
    }

    const tmdbUrl =
        `${TMDB_API_BASE_URL}` +
        "/trending/all/week" +
        "?language=es-ES";

    const response =
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

    if (
        !response.ok
    ) {
        throw new Error(
            `TMDB respondió con el código ${response.status}.`
        );
    }

    const data =
        await response.json();

    const usedImages =
        new Set();

    const items =
        data.results
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
                    const imageUrl =
                        `${TMDB_IMAGE_BASE_URL}` +
                        `${item.backdrop_path}`;

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
                            imageUrl
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

        items
    };

    return items;
}

/*
 * Endpoint que utilizará la portada web.
 *
 * Ejemplos futuros:
 *
 * /api/tmdb/backdrops
 * /api/tmdb/backdrops?type=movie
 * /api/tmdb/backdrops?type=tv
 * /api/tmdb/backdrops?type=all&limit=8
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

            /*
             * El navegador puede reutilizar el resultado
             * durante unos minutos.
             */
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
        } catch (
            error
        ) {
            console.error(
                "Error cargando portadas de TMDB:",
                error
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
 * Sirve index.html, styles.css y los próximos archivos
 * JavaScript desde esta misma carpeta.
 */
app.use(
    express.static(
        path.join(
            __dirname
        )
    )
);

/*
 * Si alguien abre una ruta web que todavía no existe,
 * regresamos a la portada principal.
 */
app.get(
    "*",
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
