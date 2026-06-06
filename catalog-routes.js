/*
 * =========================================================
 * VEICLOUD WEB
 * Rutas privadas para cargar el catálogo desde Firebase
 * =========================================================
 *
 * Lee:
 *
 * Movies
 * Series
 * homeFeatured
 *
 * desde Firebase Realtime Database.
 *
 * No envía enlaces de reproducción al navegador todavía.
 * Solo entrega la información visual necesaria para Home.
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

/*
 * =========================================================
 * CONSULTAR FIREBASE
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
 * NORMALIZAR PELÍCULAS Y SERIES
 * =========================================================
 */

function normalizeCatalogNode(
    rawNode,
    contentType
) {
    if (
        !rawNode ||
        typeof rawNode !==
            "object"
    ) {
        return [];
    }

    const entries =
        Array.isArray(
            rawNode
        )
            ? rawNode
                .map(
                    (
                        item,
                        index
                    ) => [
                        String(index),
                        item
                    ]
                )
            : Object.entries(
                rawNode
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

                const contentId =
                    cleanText(
                        rawItem.id ||
                        firebaseKey
                    );

                const tmdbId =
                    cleanText(
                        rawItem.tmdbId ||
                        rawItem.tmdb_id
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
                        rawItem.coverUrl ||
                        posterUrl
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
                        rawItem.genre ||
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
                    id:
                        contentId,

                    tmdbId,

                    type:
                        contentType,

                    title,

                    description,

                    category,

                    year,

                    duration,

                    posterUrl,

                    bannerUrl,

                    createdAt
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
 * CONTENIDO DESTACADO
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

    const linkedContent =
        findContentById(
            allContent,
            safeFeatured.contentId ||
            safeFeatured.id ||
            safeFeatured.tmdbId
        );

    const fallbackContent =
        allContent.find(
            (
                item
            ) =>
                Boolean(
                    item.bannerUrl
                )
        ) ||
        allContent[0] ||
        null;

    const baseContent =
        linkedContent ||
        fallbackContent;

    if (
        !baseContent
    ) {
        return null;
    }

    return {
        id:
            cleanText(
                safeFeatured.contentId ||
                safeFeatured.id ||
                baseContent.id
            ),

        tmdbId:
            cleanText(
                safeFeatured.tmdbId ||
                baseContent.tmdbId
            ),

        type:
            cleanText(
                safeFeatured.type ||
                baseContent.type
            ),

        title:
            cleanText(
                safeFeatured.title ||
                baseContent.title
            ),

        description:
            cleanText(
                safeFeatured.description ||
                baseContent.description
            ),

        category:
            cleanText(
                safeFeatured.category ||
                baseContent.category
            ),

        posterUrl:
            cleanUrl(
                safeFeatured.posterUrl ||
                baseContent.posterUrl
            ),

        bannerUrl:
            cleanUrl(
                safeFeatured.bannerUrl ||
                safeFeatured.backdropUrl ||
                baseContent.bannerUrl ||
                baseContent.posterUrl
            )
    };
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
 * REGISTRAR RUTA
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
                            .status(401)
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
                     * Lee el catálogo real de Firebase.
                     */
                    const [
                        rawMovies,
                        rawSeries,
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
                                    "Series",
                                    session.idToken
                                ),

                                fetchFirebaseJson(
                                    databaseBaseUrl,
                                    "homeFeatured",
                                    session.idToken
                                )
                            ]
                        );

                    const allMovies =
                        normalizeCatalogNode(
                            rawMovies,
                            "movie"
                        );

                    const allSeries =
                        normalizeCatalogNode(
                            rawSeries,
                            "series"
                        );

                    const allContent = [
                        ...allMovies,
                        ...allSeries
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
                                allMovies.slice(
                                    0,
                                    rowLimit
                                ),

                            series:
                                allSeries.slice(
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
                        "Error cargando el catálogo:",
                        error.message
                    );

                    response
                        .status(500)
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
