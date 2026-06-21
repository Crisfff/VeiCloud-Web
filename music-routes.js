/*
 * =========================================================
 * VEICLOUD MUSIC ROUTES
 * =========================================================
 * Rutas de prueba para VeiCloud Music.
 *
 * Endpoint principal:
 * GET /api/music/search?q=shakira
 *
 * Por ahora:
 * - Si RAPIDAPI_KEY no está configurada en Render, devuelve demo.
 * - Si RAPIDAPI_KEY está configurada, intenta consultar RapidAPI.
 */

function registerMusicRoutes(
    {
        app
    }
) {
    const RAPIDAPI_KEY =
        process.env.RAPIDAPI_KEY;

    const RAPIDAPI_MUSIC_HOST =
        process.env.RAPIDAPI_MUSIC_HOST ||
        "youtube-music-api-yt.p.rapidapi.com";

    const RAPIDAPI_MUSIC_BASE_URL =
        process.env.RAPIDAPI_MUSIC_BASE_URL ||
        "https://youtube-music-api-yt.p.rapidapi.com";

    const RAPIDAPI_MUSIC_SEARCH_PATH =
        process.env.RAPIDAPI_MUSIC_SEARCH_PATH ||
        "/search";

    const RAPIDAPI_MUSIC_QUERY_PARAM =
        process.env.RAPIDAPI_MUSIC_QUERY_PARAM ||
        "query";

    function createDemoMusicResults(
        query
    ) {
        return [
            {
                id: "demo_1",
                title: `${query} - Resultado 1`,
                artist: "VeiCloud Music Demo",
                thumbnail: "",
                duration: "3:21",
                type: "song"
            },
            {
                id: "demo_2",
                title: `${query} - Remix`,
                artist: "Sistema de prueba",
                thumbnail: "",
                duration: "2:58",
                type: "song"
            },
            {
                id: "demo_3",
                title: `${query} - Playlist`,
                artist: "Playlist sugerida",
                thumbnail: "",
                duration: "15 canciones",
                type: "playlist"
            }
        ];
    }

    function pickFirstString(
        values
    ) {
        for (
            const value of values
        ) {
            if (
                typeof value === "string" &&
                value.trim()
            ) {
                return value.trim();
            }
        }

        return "";
    }

    function normalizeArtist(
        item
    ) {
        if (!item || typeof item !== "object") {
            return "";
        }

        if (typeof item.artist === "string") {
            return item.artist;
        }

        if (typeof item.author === "string") {
            return item.author;
        }

        if (typeof item.name === "string" && item.type === "artist") {
            return item.name;
        }

        if (Array.isArray(item.artists)) {
            return item.artists
                .map(
                    (
                        artist
                    ) => {
                        if (typeof artist === "string") {
                            return artist;
                        }

                        return (
                            artist?.name ||
                            artist?.title ||
                            ""
                        );
                    }
                )
                .filter(Boolean)
                .join(", ");
        }

        return "";
    }

    function normalizeThumbnail(
        item
    ) {
        if (!item || typeof item !== "object") {
            return "";
        }

        if (typeof item.thumbnail === "string") {
            return item.thumbnail;
        }

        if (typeof item.image === "string") {
            return item.image;
        }

        if (typeof item.cover === "string") {
            return item.cover;
        }

        if (Array.isArray(item.thumbnails) && item.thumbnails.length > 0) {
            const lastThumbnail =
                item.thumbnails[item.thumbnails.length - 1];

            if (typeof lastThumbnail === "string") {
                return lastThumbnail;
            }

            return (
                lastThumbnail?.url ||
                lastThumbnail?.src ||
                ""
            );
        }

        return "";
    }

    function normalizeMusicItem(
        item,
        index
    ) {
        const id =
            pickFirstString(
                [
                    item?.id,
                    item?.videoId,
                    item?.playlistId,
                    item?.albumId,
                    item?.browseId,
                    item?.youtubeId
                ]
            ) ||
            `item_${index}`;

        const title =
            pickFirstString(
                [
                    item?.title,
                    item?.name,
                    item?.song,
                    item?.track
                ]
            ) ||
            "Sin título";

        const artist =
            normalizeArtist(
                item
            ) ||
            "Artista desconocido";

        const thumbnail =
            normalizeThumbnail(
                item
            );

        const duration =
            pickFirstString(
                [
                    item?.duration,
                    item?.length,
                    item?.durationText,
                    item?.time
                ]
            );

        const type =
            pickFirstString(
                [
                    item?.type,
                    item?.category,
                    item?.resultType
                ]
            ) ||
            "song";

        return {
            id,
            title,
            artist,
            thumbnail,
            duration,
            type
        };
    }

    function extractRapidResults(
        rapidData
    ) {
        if (Array.isArray(rapidData)) {
            return rapidData;
        }

        if (Array.isArray(rapidData?.results)) {
            return rapidData.results;
        }

        if (Array.isArray(rapidData?.data)) {
            return rapidData.data;
        }

        if (Array.isArray(rapidData?.items)) {
            return rapidData.items;
        }

        if (Array.isArray(rapidData?.content)) {
            return rapidData.content;
        }

        if (Array.isArray(rapidData?.songs)) {
            return rapidData.songs;
        }

        if (Array.isArray(rapidData?.videos)) {
            return rapidData.videos;
        }

        if (Array.isArray(rapidData?.playlists)) {
            return rapidData.playlists;
        }

        if (Array.isArray(rapidData?.response)) {
            return rapidData.response;
        }

        return [];
    }

    async function searchMusicWithRapidAPI(
        query
    ) {
        const url =
            new URL(
                `${RAPIDAPI_MUSIC_BASE_URL}${RAPIDAPI_MUSIC_SEARCH_PATH}`
            );

        url.searchParams.set(
            RAPIDAPI_MUSIC_QUERY_PARAM,
            query
        );

        const rapidResponse =
            await fetch(
                url.toString(),
                {
                    method: "GET",
                    headers: {
                        "x-rapidapi-key": RAPIDAPI_KEY,
                        "x-rapidapi-host": RAPIDAPI_MUSIC_HOST,
                        "Accept": "application/json"
                    }
                }
            );

        const rapidData =
            await rapidResponse
                .json()
                .catch(
                    () => ({})
                );

        if (!rapidResponse.ok) {
            throw new Error(
                rapidData?.message ||
                rapidData?.error ||
                `RapidAPI respondió con código ${rapidResponse.status}.`
            );
        }

        const rawResults =
            extractRapidResults(
                rapidData
            );

        return rawResults
            .map(
                (
                    item,
                    index
                ) =>
                    normalizeMusicItem(
                        item,
                        index
                    )
            )
            .filter(
                (
                    item
                ) =>
                    item.title &&
                    item.title !== "Sin título"
            );
    }

    app.get(
        "/api/music/ping",
        (
            request,
            response
        ) => {
            response.json(
                {
                    ok: true,
                    message: "VeiCloud Music conectado al servidor principal.",
                    rapidConfigured: Boolean(RAPIDAPI_KEY),
                    host: RAPIDAPI_MUSIC_HOST,
                    searchPath: RAPIDAPI_MUSIC_SEARCH_PATH,
                    queryParam: RAPIDAPI_MUSIC_QUERY_PARAM
                }
            );
        }
    );

    app.get(
        "/api/music/search",
        async (
            request,
            response
        ) => {
            try {
                const query =
                    String(
                        request.query.q ||
                        request.query.query ||
                        ""
                    )
                        .trim();

                if (!query) {
                    response.status(400).json(
                        {
                            success: false,
                            query: "",
                            results: [],
                            message: "Falta el parámetro q."
                        }
                    );

                    return;
                }

                response.setHeader(
                    "Cache-Control",
                    "no-store"
                );

                if (!RAPIDAPI_KEY) {
                    response.json(
                        {
                            success: true,
                            query,
                            source: "demo",
                            results:
                                createDemoMusicResults(
                                    query
                                ),
                            message: "Resultados demo. Falta configurar RAPIDAPI_KEY en Render."
                        }
                    );

                    return;
                }

                const rapidResults =
                    await searchMusicWithRapidAPI(
                        query
                    );

                response.json(
                    {
                        success: true,
                        query,
                        source: "rapidapi",
                        results: rapidResults,
                        message:
                            rapidResults.length > 0
                                ? "Resultados obtenidos desde RapidAPI."
                                : "RapidAPI respondió, pero no devolvió resultados normalizables."
                    }
                );
            } catch (
                error
            ) {
                console.error(
                    "Error en /api/music/search:",
                    {
                        name: error.name,
                        message: error.message
                    }
                );

                response.status(500).json(
                    {
                        success: false,
                        query:
                            String(
                                request.query.q ||
                                request.query.query ||
                                ""
                            )
                                .trim(),
                        results: [],
                        message:
                            error.message ||
                            "No se pudo buscar música."
                    }
                );
            }
        }
    );

    console.log(
        "VeiCloud Music activo en /api/music/search."
    );
}

module.exports = registerMusicRoutes;
