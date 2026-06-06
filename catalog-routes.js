/*
 * =========================================================
 * VEICLOUD WEB
 * CATÁLOGO REAL DESDE FIREBASE + PORTADAS AUTOMÁTICAS TMDB
 * =========================================================
 *
 * Estructura actual:
 *
 * Movies
 * ├── pelicula-id
 * │   └── type: "movie"
 * └── serie-id
 *     └── type: "tv"
 *
 * SeriesEpisodes
 * └── serie-id
 *     └── season_1
 *         ├── episode_1
 *         └── episode_2
 *
 * Este módulo:
 * - separa películas y series automáticamente
 * - toma portadas desde Firebase cuando existen
 * - consulta TMDB cuando faltan imágenes
 * - completa posterUrl y bannerUrl sin modificar Firebase
 * - cuenta temporadas y episodios disponibles
 * - evita mezclar títulos e imágenes de contenidos distintos
 * - no expone videoUrl al navegador
 */

const TMDB_TOKEN =
    process.env.TMDB_TOKEN;

const TMDB_API_BASE_URL =
    "https://api.themoviedb.org/3";

const TMDB_IMAGE_BASE_URL =
    "https://image.tmdb.org/t/p";

const DEFAULT_ROW_LIMIT =
    24;

const MAX_ROW_LIMIT =
    60;

const TMDB_DETAILS_CACHE_DURATION_MS =
    24 * 60 * 60 * 1000;

const tmdbDetailsCache =
    new Map();

/*
 * =========================================================
 * UTILIDADES GENERALES
 * =========================================================
 */

function cleanText(
    value
) {
    if (
        value === null ||
        value === undefined
    ) {
        return "";
    }

    if (
        Array.isArray(
            value
        )
    ) {
        return value
            .map(
                cleanText
            )
            .filter(
                Boolean
            )
            .join(", ");
    }

    if (
        typeof value ===
        "object"
    ) {
        return Object.values(
            value
        )
            .map(
                cleanText
            )
            .filter(
                Boolean
            )
            .join(", ");
    }

    return String(
        value
    ).trim();
}

function cleanUrl(
    value
) {
    const rawUrl =
        cleanText(
            value
        );

    if (
        !rawUrl
    ) {
        return "";
    }

    try {
        const parsedUrl =
            new URL(
                rawUrl
            );

        if (
            parsedUrl.protocol !==
                "https:" &&
            parsedUrl.protocol !==
                "http:"
        ) {
            return "";
        }

        return parsedUrl.href;
    } catch {
        return "";
    }
}

function normalizeTimestamp(
    value
) {
    if (
        typeof value ===
        "number"
    ) {
        return value;
    }

    const parsedValue =
        Number.parseInt(
            value,
            10
        );

    return Number.isNaN(
        parsedValue
    )
        ? 0
        : parsedValue;
}

function normalizePositiveInteger(
    value
) {
    const parsedValue =
        Number.parseInt(
            value,
            10
        );

    if (
        Number.isNaN(
            parsedValue
        ) ||
        parsedValue <
            0
    ) {
        return 0;
    }

    return parsedValue;
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
        return DEFAULT_ROW_LIMIT;
    }

    return Math.min(
        Math.max(
            parsedLimit,
            1
        ),
        MAX_ROW_LIMIT
    );
}

function normalizeBoolean(
    value,
    defaultValue =
        true
) {
    if (
        value ===
            undefined ||
        value ===
            null
    ) {
        return defaultValue;
    }

    if (
        value ===
            true ||
        value ===
            "true" ||
        value ===
            1 ||
        value ===
            "1"
    ) {
        return true;
    }

    if (
        value ===
            false ||
        value ===
            "false" ||
        value ===
            0 ||
        value ===
            "0"
    ) {
        return false;
    }

    return defaultValue;
}

/*
 * =========================================================
 * TIPO DE CONTENIDO
 * =========================================================
 */

function normalizeContentType(
    value
) {
    const rawType =
        cleanText(
            value
        )
            .toLowerCase();

    const seriesTypes = [
        "tv",
        "series",
        "serie",
        "show",
        "telenovela"
    ];

    if (
        seriesTypes.includes(
            rawType
        )
    ) {
        return "series";
    }

    return "movie";
}

/*
 * =========================================================
 * GÉNEROS
 * =========================================================
 */

function normalizeGenres(
    rawGenres
) {
    if (
        !rawGenres
    ) {
        return "";
    }

    if (
        typeof rawGenres ===
        "string"
    ) {
        return rawGenres.trim();
    }

    const genresArray =
        Array.isArray(
            rawGenres
        )
            ? rawGenres
            : Object.values(
                rawGenres
            );

    return genresArray
        .map(
            (
                genre
            ) => {
                if (
                    typeof genre ===
                    "string"
                ) {
                    return genre.trim();
                }

                if (
                    genre &&
                    typeof genre ===
                        "object"
                ) {
                    return cleanText(
                        genre.name ||
                        genre.title
                    );
                }

                return "";
            }
        )
        .filter(
            Boolean
        )
        .join(", ");
}

/*
 * =========================================================
 * URLS DE IMÁGENES TMDB
 * =========================================================
 */

function buildTmdbImageUrl(
    filePath,
    size
) {
    const normalizedPath =
        cleanText(
            filePath
        );

    if (
        !normalizedPath
    ) {
        return "";
    }

    /*
     * Si Firebase ya tiene una URL completa,
     * la usamos directamente.
     */
    const existingUrl =
        cleanUrl(
            normalizedPath
        );

    if (
        existingUrl
    ) {
        return existingUrl;
    }

    /*
     * TMDB devuelve rutas parecidas a:
     *
     * /abc123.jpg
     */
    const pathWithSlash =
        normalizedPath.startsWith(
            "/"
        )
            ? normalizedPath
            : `/${normalizedPath}`;

    return (
        `${TMDB_IMAGE_BASE_URL}` +
        `/${size}` +
        `${pathWithSlash}`
    );
}

/*
 * =========================================================
 * LEER FIREBASE
 * =========================================================
 */

async function fetchFirebaseJson(
    databaseBaseUrl,
    firebasePath,
    idToken
) {
    const normalizedBaseUrl =
        databaseBaseUrl.replace(
            /\/+$/,
            ""
        );

    const normalizedPath =
        firebasePath.replace(
            /^\/+/,
            ""
        );

    const requestUrl =
        `${normalizedBaseUrl}` +
        `/${normalizedPath}.json` +
        `?auth=${encodeURIComponent(idToken)}`;

    const firebaseResponse =
        await fetch(
            requestUrl,
            {
                method:
                    "GET",

                headers: {
                    Accept:
                        "application/json"
                }
            }
        );

    if (
        !firebaseResponse.ok
    ) {
        const errorText =
            await firebaseResponse.text();

        throw new Error(
            `Firebase rechazó la ruta ${firebasePath}: ${errorText}`
        );
    }

    return await firebaseResponse.json();
}

/*
 * =========================================================
 * CONSULTAR DETALLES EN TMDB
 * =========================================================
 *
 * Solo se ejecuta cuando faltan imágenes o metadatos.
 * Los resultados se guardan temporalmente en memoria.
 */

async function fetchTmdbDetails(
    tmdbId,
    contentType
) {
    const normalizedTmdbId =
        cleanText(
            tmdbId
        );

    if (
        !normalizedTmdbId ||
        !TMDB_TOKEN
    ) {
        return null;
    }

    const tmdbNamespace =
        contentType ===
            "series"
            ? "tv"
            : "movie";

    const cacheKey =
        `${tmdbNamespace}:${normalizedTmdbId}`;

    const cachedItem =
        tmdbDetailsCache.get(
            cacheKey
        );

    const now =
        Date.now();

    if (
        cachedItem &&
        cachedItem.expiresAt >
            now
    ) {
        return cachedItem.data;
    }

    const requestUrl =
        `${TMDB_API_BASE_URL}` +
        `/${tmdbNamespace}` +
        `/${encodeURIComponent(normalizedTmdbId)}` +
        "?language=es-ES";

    try {
        const tmdbResponse =
            await fetch(
                requestUrl,
                {
                    method:
                        "GET",

                    headers: {
                        Accept:
                            "application/json",

                        Authorization:
                            `Bearer ${TMDB_TOKEN}`
                    }
                }
            );

        if (
            !tmdbResponse.ok
        ) {
            console.warn(
                `TMDB no encontró ${cacheKey}. Código: ${tmdbResponse.status}`
            );

            return null;
        }

        const tmdbData =
            await tmdbResponse.json();

        const normalizedDetails = {
            title:
                cleanText(
                    tmdbData.title ||
                    tmdbData.name
                ),

            description:
                cleanText(
                    tmdbData.overview
                ),

            posterUrl:
                buildTmdbImageUrl(
                    tmdbData.poster_path,
                    "w500"
                ),

            bannerUrl:
                buildTmdbImageUrl(
                    tmdbData.backdrop_path,
                    "w1280"
                ),

            category:
                normalizeGenres(
                    tmdbData.genres
                ),

            year:
                cleanText(
                    tmdbData.release_date ||
                    tmdbData.first_air_date
                ),

            duration:
                cleanText(
                    tmdbData.runtime ||
                    tmdbData.episode_run_time
                ),

            seasonsCount:
                normalizePositiveInteger(
                    tmdbData.number_of_seasons
                ),

            episodesCount:
                normalizePositiveInteger(
                    tmdbData.number_of_episodes
                )
        };

        tmdbDetailsCache.set(
            cacheKey,
            {
                expiresAt:
                    now +
                    TMDB_DETAILS_CACHE_DURATION_MS,

                data:
                    normalizedDetails
            }
        );

        return normalizedDetails;
    } catch (
        error
    ) {
        console.error(
            `Error consultando ${cacheKey}:`,
            error.message
        );

        return null;
    }
}

/*
 * =========================================================
 * NORMALIZAR CATÁLOGO MAESTRO
 * =========================================================
 */

function normalizeCatalogNode(
    rawCatalog
) {
    if (
        !rawCatalog ||
        typeof rawCatalog !==
            "object"
    ) {
        return [];
    }

    const entries =
        Array.isArray(
            rawCatalog
        )
            ? rawCatalog.map(
                (
                    item,
                    index
                ) => [
                    String(
                        index
                    ),

                    item
                ]
            )
            : Object.entries(
                rawCatalog
            );

    return entries
        .map(
            (
                [
                    firebaseKey,
                    rawItem
                ]
            ) => {
                if (
                    !rawItem ||
                    typeof rawItem !==
                        "object"
                ) {
                    return null;
                }

                const title =
                    cleanText(
                        rawItem.title ||
                        rawItem.originalTitle ||
                        rawItem.name
                    );

                const id =
                    cleanText(
                        rawItem.id ||
                        rawItem.contentId ||
                        firebaseKey
                    );

                if (
                    !title ||
                    !id
                ) {
                    return null;
                }

                const type =
                    normalizeContentType(
                        rawItem.type
                    );

                return {
                    id,

                    tmdbId:
                        cleanText(
                            rawItem.tmdbId ||
                            rawItem.tmdb_id
                        ),

                    type,

                    title,

                    description:
                        cleanText(
                            rawItem.description ||
                            rawItem.overview ||
                            rawItem.synopsis
                        ),

                    category:
                        cleanText(
                            rawItem.category ||
                            rawItem.genre
                        ) ||
                        normalizeGenres(
                            rawItem.genres
                        ),

                    year:
                        cleanText(
                            rawItem.year ||
                            rawItem.releaseYear ||
                            rawItem.releaseDate
                        ),

                    duration:
                        cleanText(
                            rawItem.duration ||
                            rawItem.runtime
                        ),

                    posterUrl:
                        buildTmdbImageUrl(
                            rawItem.posterUrl ||
                            rawItem.poster ||
                            rawItem.posterPath ||
                            rawItem.poster_path ||
                            rawItem.verticalPosterUrl ||
                            rawItem.imageUrl,
                            "w500"
                        ),

                    bannerUrl:
                        buildTmdbImageUrl(
                            rawItem.bannerUrl ||
                            rawItem.backdropUrl ||
                            rawItem.backdropPath ||
                            rawItem.backdrop_path ||
                            rawItem.horizontalPosterUrl ||
                            rawItem.coverUrl,
                            "w1280"
                        ),

                    createdAt:
                        normalizeTimestamp(
                            rawItem.createdAt ||
                            rawItem.timestamp ||
                            rawItem.addedAt
                        ),

                    seasonsCount:
                        normalizePositiveInteger(
                            rawItem.seasons ||
                            rawItem.seasonsCount ||
                            rawItem.numberOfSeasons
                        ),

                    episodesCount:
                        normalizePositiveInteger(
                            rawItem.episodes ||
                            rawItem.episodesCount ||
                            rawItem.numberOfEpisodes
                        ),

                    available:
                        normalizeBoolean(
                            rawItem.available,
                            true
                        )
                };
            }
        )
        .filter(
            (
                item
            ) =>
                Boolean(
                    item
                ) &&
                item.available
        )
        .sort(
            (
                firstItem,
                secondItem
            ) =>
                secondItem.createdAt -
                firstItem.createdAt
        );
}

/*
 * =========================================================
 * COMPLETAR CAMPOS FALTANTES CON TMDB
 * =========================================================
 */

async function enrichContentItemWithTmdb(
    item
) {
    if (
        !item
    ) {
        return item;
    }

    const needsTmdbDetails =
        Boolean(
            item.tmdbId
        ) &&
        (
            !item.posterUrl ||
            !item.bannerUrl ||
            !item.description ||
            !item.category
        );

    if (
        !needsTmdbDetails
    ) {
        return item;
    }

    const tmdbDetails =
        await fetchTmdbDetails(
            item.tmdbId,
            item.type
        );

    if (
        !tmdbDetails
    ) {
        return item;
    }

    return {
        ...item,

        title:
            item.title ||
            tmdbDetails.title,

        description:
            item.description ||
            tmdbDetails.description,

        category:
            item.category ||
            tmdbDetails.category,

        year:
            item.year ||
            tmdbDetails.year,

        duration:
            item.duration ||
            tmdbDetails.duration,

        posterUrl:
            item.posterUrl ||
            tmdbDetails.posterUrl,

        bannerUrl:
            item.bannerUrl ||
            tmdbDetails.bannerUrl,

        seasonsCount:
            item.seasonsCount ||
            tmdbDetails.seasonsCount ||
            0,

        episodesCount:
            item.episodesCount ||
            tmdbDetails.episodesCount ||
            0
    };
}

async function enrichCatalogWithTmdb(
    items
) {
    return await Promise.all(
        items.map(
            enrichContentItemWithTmdb
        )
    );
}

/*
 * =========================================================
 * CAPÍTULOS DE SERIES
 * =========================================================
 */

function normalizeSeriesEpisodes(
    rawSeriesEpisodes
) {
    const seriesEpisodesMap =
        new Map();

    if (
        !rawSeriesEpisodes ||
        typeof rawSeriesEpisodes !==
            "object"
    ) {
        return seriesEpisodesMap;
    }

    Object.entries(
        rawSeriesEpisodes
    ).forEach(
        (
            [
                seriesId,
                rawSeasons
            ]
        ) => {
            if (
                !rawSeasons ||
                typeof rawSeasons !==
                    "object"
            ) {
                return;
            }

            let seasonsCount =
                0;

            let episodesCount =
                0;

            let firstEpisodeStillUrl =
                "";

            Object.values(
                rawSeasons
            ).forEach(
                (
                    rawEpisodes
                ) => {
                    if (
                        !rawEpisodes ||
                        typeof rawEpisodes !==
                            "object"
                    ) {
                        return;
                    }

                    const episodes =
                        Object.values(
                            rawEpisodes
                        )
                            .filter(
                                (
                                    episode
                                ) =>
                                    episode &&
                                    typeof episode ===
                                        "object"
                            );

                    if (
                        episodes.length ===
                        0
                    ) {
                        return;
                    }

                    seasonsCount +=
                        1;

                    episodesCount +=
                        episodes.length;

                    if (
                        !firstEpisodeStillUrl
                    ) {
                        const firstEpisode =
                            episodes[0];

                        firstEpisodeStillUrl =
                            buildTmdbImageUrl(
                                firstEpisode.stillUrl ||
                                firstEpisode.posterUrl ||
                                firstEpisode.imageUrl,
                                "w500"
                            );
                    }
                }
            );

            seriesEpisodesMap.set(
                String(
                    seriesId
                ),
                {
                    seasonsCount,

                    episodesCount,

                    firstEpisodeStillUrl
                }
            );
        }
    );

    return seriesEpisodesMap;
}

function attachSeriesEpisodesMetadata(
    seriesItems,
    seriesEpisodesMap
) {
    return seriesItems.map(
        (
            series
        ) => {
            const episodeMetadata =
                seriesEpisodesMap.get(
                    series.id
                ) ||
                {
                    seasonsCount:
                        0,

                    episodesCount:
                        0,

                    firstEpisodeStillUrl:
                        ""
                };

            return {
                ...series,

                seasonsCount:
                    episodeMetadata.seasonsCount ||
                    series.seasonsCount ||
                    0,

                episodesCount:
                    episodeMetadata.episodesCount ||
                    series.episodesCount ||
                    0,

                firstEpisodeStillUrl:
                    episodeMetadata.firstEpisodeStillUrl,

                hasEpisodes:
                    episodeMetadata.episodesCount >
                    0
            };
        }
    );
}

/*
 * =========================================================
 * ELIMINAR DUPLICADOS
 * =========================================================
 */

function removeDuplicateContent(
    items
) {
    const usedKeys =
        new Set();

    return items.filter(
        (
            item
        ) => {
            const uniqueKey =
                cleanText(
                    item.tmdbId ||
                    item.id ||
                    item.title
                )
                    .toLowerCase();

            if (
                !uniqueKey ||
                usedKeys.has(
                    uniqueKey
                )
            ) {
                return false;
            }

            usedKeys.add(
                uniqueKey
            );

            return true;
        }
    );
}

/*
 * =========================================================
 * BUSCAR CONTENIDO
 * =========================================================
 */

function findContentById(
    allContent,
    requestedId
) {
    const normalizedRequestedId =
        cleanText(
            requestedId
        );

    if (
        !normalizedRequestedId
    ) {
        return null;
    }

    return (
        allContent.find(
            (
                item
            ) =>
                item.id ===
                    normalizedRequestedId ||
                item.tmdbId ===
                    normalizedRequestedId
        ) ||
        null
    );
}

/*
 * =========================================================
 * DESTACADO DEL HOME
 * =========================================================
 */

function normalizeFeaturedContent(
    rawFeatured,
    allContent
) {
    const safeFeatured =
        rawFeatured &&
        typeof rawFeatured ===
            "object"
            ? rawFeatured
            : {};

    const requestedContentId =
        cleanText(
            safeFeatured.contentId ||
            safeFeatured.id ||
            safeFeatured.tmdbId
        );

    const linkedContent =
        findContentById(
            allContent,
            requestedContentId
        );

    /*
     * Caso ideal:
     * homeFeatured apunta a un contenido real.
     */
    if (
        linkedContent
    ) {
        return {
            ...linkedContent,

            /*
             * Conservamos la ficha del contenido enlazado.
             * Evitamos mezclar título de una película
             * con imagen de otra.
             */
            title:
                linkedContent.title,

            description:
                linkedContent.description,

            category:
                linkedContent.category,

            posterUrl:
                linkedContent.posterUrl,

            bannerUrl:
                linkedContent.bannerUrl ||
                linkedContent.posterUrl
        };
    }

    /*
     * Si homeFeatured tiene su propia ficha visual completa,
     * la mostramos como contenido independiente.
     */
    const standaloneTitle =
        cleanText(
            safeFeatured.title
        );

    const standalonePosterUrl =
        buildTmdbImageUrl(
            safeFeatured.posterUrl ||
            safeFeatured.posterPath ||
            safeFeatured.poster_path,
            "w500"
        );

    const standaloneBannerUrl =
        buildTmdbImageUrl(
            safeFeatured.bannerUrl ||
            safeFeatured.backdropUrl ||
            safeFeatured.backdropPath ||
            safeFeatured.backdrop_path,
            "w1280"
        );

    if (
        standaloneTitle &&
        (
            standaloneBannerUrl ||
            standalonePosterUrl
        )
    ) {
        return {
            id:
                requestedContentId ||
                "featured",

            tmdbId:
                cleanText(
                    safeFeatured.tmdbId
                ),

            type:
                normalizeContentType(
                    safeFeatured.type
                ),

            title:
                standaloneTitle,

            description:
                cleanText(
                    safeFeatured.description
                ),

            category:
                cleanText(
                    safeFeatured.category
                ),

            posterUrl:
                standalonePosterUrl,

            bannerUrl:
                standaloneBannerUrl ||
                standalonePosterUrl
        };
    }

    /*
     * Si homeFeatured está incompleto,
     * usamos un contenido real completo.
     */
    return (
        allContent.find(
            (
                item
            ) =>
                Boolean(
                    item.bannerUrl
                )
        ) ||
        allContent.find(
            (
                item
            ) =>
                Boolean(
                    item.posterUrl
                )
        ) ||
        allContent[0] ||
        null
    );
}

/*
 * =========================================================
 * CATEGORÍAS
 * =========================================================
 */

function buildCategories(
    allContent
) {
    const categorySet =
        new Set();

    allContent.forEach(
        (
            item
        ) => {
            const categoryParts =
                item.category
                    .split(",")
                    .map(
                        (
                            category
                        ) =>
                            category.trim()
                    )
                    .filter(
                        Boolean
                    );

            categoryParts.forEach(
                (
                    category
                ) => {
                    categorySet.add(
                        category
                    );
                }
            );
        }
    );

    return Array.from(
        categorySet
    ).sort(
        (
            firstCategory,
            secondCategory
        ) =>
            firstCategory.localeCompare(
                secondCategory,
                "es"
            )
    );
}

/*
 * =========================================================
 * RUTA DEL CATÁLOGO
 * =========================================================
 */

module.exports =
    function registerCatalogRoutes(
        {
            app,
            getAuthenticatedFirebaseSession,
            getFirebaseDatabaseBaseUrl
        }
    ) {
        app.get(
            "/api/catalog",
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

                    if (
                        !session
                    ) {
                        response
                            .status(
                                401
                            )
                            .json(
                                {
                                    ok:
                                        false,

                                    message:
                                        "Tu sesión ha caducado. Inicia sesión nuevamente.",

                                    redirectUrl:
                                        "/login.html"
                                }
                            );

                        return;
                    }

                    const databaseBaseUrl =
                        getFirebaseDatabaseBaseUrl();

                    const rowLimit =
                        normalizeLimit(
                            request.query.limit
                        );

                    const [
                        rawCatalog,
                        rawSeriesEpisodes,
                        rawFeatured
                    ] =
                        await Promise.all(
                            [
                                fetchFirebaseJson(
                                    databaseBaseUrl,
                                    "Movies",
                                    session.idToken
                                ),

                                fetchFirebaseJson(
                                    databaseBaseUrl,
                                    "SeriesEpisodes",
                                    session.idToken
                                ),

                                fetchFirebaseJson(
                                    databaseBaseUrl,
                                    "homeFeatured",
                                    session.idToken
                                )
                            ]
                        );

                    const normalizedCatalog =
                        normalizeCatalogNode(
                            rawCatalog
                        );

                    /*
                     * Completa imágenes ausentes consultando TMDB.
                     */
                    const enrichedCatalog =
                        await enrichCatalogWithTmdb(
                            normalizedCatalog
                        );

                    const catalogItems =
                        removeDuplicateContent(
                            enrichedCatalog
                        );

                    const seriesEpisodesMap =
                        normalizeSeriesEpisodes(
                            rawSeriesEpisodes
                        );

                    const movies =
                        catalogItems.filter(
                            (
                                item
                            ) =>
                                item.type ===
                                "movie"
                        );

                    const series =
                        attachSeriesEpisodesMetadata(
                            catalogItems.filter(
                                (
                                    item
                                ) =>
                                    item.type ===
                                    "series"
                            ),
                            seriesEpisodesMap
                        );

                    const allContent = [
                        ...movies,
                        ...series
                    ];

                    const featured =
                        normalizeFeaturedContent(
                            rawFeatured,
                            allContent
                        );

                    response.setHeader(
                        "Cache-Control",
                        "no-store"
                    );

                    response.json(
                        {
                            ok:
                                true,

                            featured,

                            movies:
                                movies.slice(
                                    0,
                                    rowLimit
                                ),

                            series:
                                series.slice(
                                    0,
                                    rowLimit
                                ),

                            categories:
                                buildCategories(
                                    allContent
                                )
                        }
                    );
                } catch (
                    error
                ) {
                    console.error(
                        "Error cargando catálogo:",
                        error.message
                    );

                    response
                        .status(
                            500
                        )
                        .json(
                            {
                                ok:
                                    false,

                                message:
                                    "No fue posible cargar el catálogo desde Firebase."
                            }
                        );
                }
            }
        );
    };
