/*
 * =========================================================
 * VEICLOUD MUSIC ROUTES
 * =========================================================
 *
 * Endpoints:
 * GET /api/music/ping
 * GET /api/music/search?q=shakira
 *
 * Variables en Render:
 * RAPIDAPI_KEY
 * RAPIDAPI_MUSIC_HOST
 * RAPIDAPI_MUSIC_BASE_URL
 * RAPIDAPI_MUSIC_SEARCH_PATH
 * RAPIDAPI_MUSIC_QUERY_PARAM
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

    function safeStringify(
        value
    ) {
        if (typeof value === "string") {
            return value;
        }

        if (value === null || value === undefined) {
            return "";
        }

        try {
            return JSON.stringify(
                value,
                null,
                2
            );
        } catch {
            return String(value);
        }
    }

    function getRapidErrorMessage(
        rapidData,
        status
    ) {
        if (!rapidData || typeof rapidData !== "object") {
            return `RapidAPI respondió con código ${status}.`;
        }

        return (
            safeStringify(rapidData.message) ||
            safeStringify(rapidData.error) ||
            safeStringify(rapidData.errors) ||
            safeStringify(rapidData) ||
            `RapidAPI respondió con código ${status}.`
        );
    }

    function buildRapidUrl(
        query
    ) {
        const cleanBaseUrl =
            String(RAPIDAPI_MUSIC_BASE_URL || "")
                .trim()
                .replace(/\/+$/, "");

        const cleanSearchPath =
            String(RAPIDAPI_MUSIC_SEARCH_PATH || "/search")
                .trim()
                .replace(/^\/?/, "/");

        const url =
            new URL(
                `${cleanBaseUrl}${cleanSearchPath}`
            );

        url.searchParams.set(
            RAPIDAPI_MUSIC_QUERY_PARAM,
            query
        );

        return url;
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

        if (typeof item.subtitle === "string") {
            return item.subtitle;
        }

        if (typeof item.description === "string") {
            return item.description;
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

        if (Array.isArray(item.authorInfo)) {
            return item.authorInfo
                .map(
                    (
                        author
                    ) => {
                        if (typeof author === "string") {
                            return author;
                        }

                        return (
                            author?.name ||
                            author?.title ||
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

        if (typeof item.thumbnailUrl === "string") {
            return item.thumbnailUrl;
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

        if (Array.isArray(item.images) && item.images.length > 0) {
            const lastImage =
                item.images[item.images.length - 1];

            if (typeof lastImage === "string") {
                return lastImage;
            }

            return (
                lastImage?.url ||
                lastImage?.src ||
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
                    item?.youtubeId,
                    item?.channelId
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
                    item?.resultType,
                    item?.kind
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

        if (Array.isArray(rapidData?.albums)) {
            return rapidData.albums;
        }

        if (Array.isArray(rapidData?.artists)) {
            return rapidData.artists;
        }

        if (Array.isArray(rapidData?.response)) {
            return rapidData.response;
        }

        if (Array.isArray(rapidData?.result)) {
            return rapidData.result;
        }

        if (Array.isArray(rapidData?.data?.results)) {
            return rapidData.data.results;
        }

        if (Array.isArray(rapidData?.data?.items)) {
            return rapidData.data.items;
        }

        return [];
    }

    async function searchMusicWithRapidAPI(
        query
    ) {
        const url =
            buildRapidUrl(
                query
            );

        console.log(
            "Buscando música en RapidAPI:",
            {
                url: url.toString(),
                host: RAPIDAPI_MUSIC_HOST,
                queryParam: RAPIDAPI_MUSIC_QUERY_PARAM
            }
        );

        const rapidResponse =
            await fetch(
                url.toString(),
                {
                    method: "GET",
                    headers: {
                        "x-rapidapi-key": RAPIDAPI_KEY,
                        "x-rapidapi-host": RAPIDAPI_MUSIC_HOST,
                        Accept: "application/json"
                    }
                }
            );

        const responseText =
            await rapidResponse.text();

        let rapidData = {};

        try {
            rapidData =
                responseText
                    ? JSON.parse(responseText)
                    : {};
        } catch {
            rapidData = {
                raw: responseText
            };
        }

        if (!rapidResponse.ok) {
            throw new Error(
                getRapidErrorMessage(
                    rapidData,
                    rapidResponse.status
                )
            );
        }

        const rawResults =
            extractRapidResults(
                rapidData
            );

        const normalizedResults =
            rawResults
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

        return {
            rapidData,
            normalizedResults
        };
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
                    baseUrl: RAPIDAPI_MUSIC_BASE_URL,
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
            const query =
                String(
                    request.query.q ||
                    request.query.query ||
                    ""
                )
                    .trim();

            try {
                if (!query) {
                    response.status(400).json(
                        {
                            success: false,
                            query: "",
                            source: "none",
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

                const rapidSearch =
                    await searchMusicWithRapidAPI(
                        query
                    );

                response.json(
                    {
                        success: true,
                        query,
                        source: "rapidapi",
                        results: rapidSearch.normalizedResults,
                        message:
                            rapidSearch.normalizedResults.length > 0
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
                        query,
                        source: "rapidapi",
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
