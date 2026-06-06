/*
 * =========================================================
 * VEICLOUD WEB
 * CATÁLOGO REAL DESDE FIREBASE
 * =========================================================
 *
 * Estructura actual de Firebase:
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
 * homeFeatured
 * └── contenido destacado del Home
 *
 * Este módulo:
 * - separa películas y series automáticamente
 * - cuenta temporadas y episodios disponibles
 * - evita mezclar títulos e imágenes de contenidos distintos
 * - ignora nodos incompletos
 * - no expone enlaces de reproducción
 */

const DEFAULT_ROW_LIMIT =
    24;

const MAX_ROW_LIMIT =
    60;

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

/*
 * =========================================================
 * NORMALIZAR TIPO DE CONTENIDO
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
 * NORMALIZAR GÉNEROS
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
        return rawGenres
            .trim();
    }

    if (
        Array.isArray(
            rawGenres
        )
    ) {
        return rawGenres
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

    if (
        typeof rawGenres ===
        "object"
    ) {
        return Object.values(
            rawGenres
        )
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

    return "";
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

                /*
                 * Ignora nodos incompletos.
                 */
                if (
                    !title
                ) {
                    return null;
                }

                const id =
                    cleanText(
                        rawItem.id ||
                        rawItem.contentId ||
                        firebaseKey
                    );

                if (
                    !id
                ) {
                    return null;
                }

                const type =
                    normalizeContentType(
                        rawItem.type
                    );

                const posterUrl =
                    cleanUrl(
                        rawItem.posterUrl ||
                        rawItem.poster ||
                        rawItem.verticalPosterUrl ||
                        rawItem.imageUrl
                    );

                const bannerUrl =
                    cleanUrl(
                        rawItem.bannerUrl ||
                        rawItem.backdropUrl ||
                        rawItem.horizontalPosterUrl ||
                        rawItem.coverUrl
                    );

                const description =
                    cleanText(
                        rawItem.description ||
                        rawItem.overview ||
                        rawItem.synopsis
                    );

                const category =
                    cleanText(
                        rawItem.category ||
                        rawItem.genre
                    ) ||
                    normalizeGenres(
                        rawItem.genres
                    );

                const year =
                    cleanText(
                        rawItem.year ||
                        rawItem.releaseYear ||
                        rawItem.releaseDate
                    );

                const duration =
                    cleanText(
                        rawItem.duration ||
                        rawItem.runtime
                    );

                const createdAt =
                    normalizeTimestamp(
                        rawItem.createdAt ||
                        rawItem.timestamp ||
                        rawItem.addedAt
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

                    description,

                    category,

                    year,

                    duration,

                    posterUrl,

                    bannerUrl,

                    createdAt,

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
                        rawItem.available !==
                            false
                };
            }
        )
        .filter(
            Boolean
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
 * NORMALIZAR CAPÍTULOS DE SERIES
 * =========================================================
 *
 * No enviamos videoUrl al navegador.
 * Solo calculamos información visual:
 * - temporadas disponibles
 * - capítulos disponibles
 * - imagen del primer episodio
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
                            cleanUrl(
                                firstEpisode.stillUrl ||
                                firstEpisode.posterUrl ||
                                firstEpisode.imageUrl
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

/*
 * =========================================================
 * AÑADIR INFORMACIÓN DE EPISODIOS A CADA SERIE
 * =========================================================
 */

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
 * BUSCAR CONTENIDO POR ID
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
 * CONTENIDO DESTACADO
 * =========================================================
 *
 * Regla esencial:
 *
 * Nunca usamos el título de una película
 * con la imagen de otra.
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

            title:
                cleanText(
                    safeFeatured.title ||
                    linkedContent.title
                ),

            description:
                cleanText(
                    safeFeatured.description ||
                    linkedContent.description
                ),

            category:
                cleanText(
                    safeFeatured.category ||
                    linkedContent.category
                ),

            posterUrl:
                cleanUrl(
                    safeFeatured.posterUrl ||
                    linkedContent.posterUrl
                ),

            bannerUrl:
                cleanUrl(
                    safeFeatured.bannerUrl ||
                    safeFeatured.backdropUrl ||
                    linkedContent.bannerUrl ||
                    linkedContent.posterUrl
                )
        };
    }

    /*
     * Caso alternativo:
     * homeFeatured tiene una ficha visual completa,
     * aunque no apunte a Movies.
     */
    const standaloneTitle =
        cleanText(
            safeFeatured.title
        );

    const standalonePosterUrl =
        cleanUrl(
            safeFeatured.posterUrl
        );

    const standaloneBannerUrl =
        cleanUrl(
            safeFeatured.bannerUrl ||
            safeFeatured.backdropUrl
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

                    /*
                     * Lee el catálogo maestro, los capítulos
                     * y el contenido destacado.
                     */
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

                    const catalogItems =
                        removeDuplicateContent(
                            normalizeCatalogNode(
                                rawCatalog
                            )
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
