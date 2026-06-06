/*
 * =========================================================
 * VEICLOUD WEB
 * HOME + CATÁLOGO FIREBASE + DETALLES INTERNOS
 * =========================================================
 *
 * La ficha de detalles se abre encima del Home.
 * No utiliza detail.html.
 */

const SELECTED_PROFILE_STORAGE_KEY =
    "veicloud_selected_profile";

const MY_LIST_STORAGE_KEY =
    "veicloud_my_list";

const CATALOG_ENDPOINT =
    "/api/catalog?limit=40";

let currentCatalog = {
    featured: null,
    movies: [],
    series: [],
    categories: []
};

let activeDetailsItem =
    null;

/*
 * =========================================================
 * ARRANQUE
 * =========================================================
 */

document.addEventListener(
    "DOMContentLoaded",
    async () => {
        const selectedProfile =
            readSelectedProfile();

        if (
            !selectedProfile ||
            !selectedProfile.id
        ) {
            window.location.replace(
                "/profiles.html"
            );

            return;
        }

        setSelectedProfileName(
            selectedProfile.name
        );

        injectDynamicHomeStyles();

        createDetailsOverlay();

        prepareHomeSections();

        bindTopbarButtons();

        bindCategoryNavigation();

        bindFeaturedButtons();

        bindHistoryNavigation();

        await loadCatalog();

        openDetailsFromCurrentHash();
    }
);

/*
 * =========================================================
 * PERFIL SELECCIONADO
 * =========================================================
 */

function readSelectedProfile() {
    try {
        const rawProfile =
            localStorage.getItem(
                SELECTED_PROFILE_STORAGE_KEY
            );

        if (
            !rawProfile
        ) {
            return null;
        }

        const profile =
            JSON.parse(
                rawProfile
            );

        return {
            id:
                String(
                    profile?.id ||
                    ""
                ),

            name:
                String(
                    profile?.name ||
                    "tu perfil"
                )
        };
    } catch (
        error
    ) {
        console.error(
            "No se pudo leer el perfil:",
            error
        );

        return null;
    }
}

function setSelectedProfileName(
    profileName
) {
    const profileNameElement =
        document.getElementById(
            "selected-profile-name"
        );

    if (
        profileNameElement
    ) {
        profileNameElement.textContent =
            String(
                profileName ||
                "tu perfil"
            );
    }
}

/*
 * =========================================================
 * PREPARAR HOME
 * =========================================================
 */

function prepareHomeSections() {
    hideDemoContinueWatching();

    const existingSeriesSection =
        findSectionByTitle(
            "Series"
        );

    if (
        existingSeriesSection
    ) {
        existingSeriesSection.id =
            "series-section";

        const row =
            existingSeriesSection.querySelector(
                ".content-row"
            );

        if (
            row
        ) {
            row.id =
                "series-row";

            row.replaceChildren();
        }
    }

    ensureCatalogSection(
        {
            sectionId:
                "movies-section",

            rowId:
                "movies-row",

            title:
                "Películas",

            insertBeforeId:
                "series-section"
        }
    );

    ensureCatalogSection(
        {
            sectionId:
                "series-section",

            rowId:
                "series-row",

            title:
                "Series"
        }
    );
}

function hideDemoContinueWatching() {
    const row =
        document.getElementById(
            "continue-watching-row"
        );

    const section =
        row?.closest(
            ".content-section"
        );

    if (
        section
    ) {
        section.hidden =
            true;
    }
}

function findSectionByTitle(
    requestedTitle
) {
    const sections =
        Array.from(
            document.querySelectorAll(
                ".content-section"
            )
        );

    return (
        sections.find(
            (
                section
            ) =>
                section
                    .querySelector(
                        ".section-header h2"
                    )
                    ?.textContent
                    ?.trim() ===
                requestedTitle
        ) ||
        null
    );
}

function ensureCatalogSection(
    {
        sectionId,
        rowId,
        title,
        insertBeforeId
    }
) {
    let section =
        document.getElementById(
            sectionId
        );

    if (
        section
    ) {
        let row =
            section.querySelector(
                ".content-row"
            );

        if (
            !row
        ) {
            row =
                document.createElement(
                    "div"
                );

            row.className =
                "content-row";

            section.appendChild(
                row
            );
        }

        row.id =
            rowId;

        return section;
    }

    section =
        document.createElement(
            "section"
        );

    section.className =
        "content-section";

    section.id =
        sectionId;

    const header =
        document.createElement(
            "div"
        );

    header.className =
        "section-header";

    const heading =
        document.createElement(
            "h2"
        );

    heading.textContent =
        title;

    const row =
        document.createElement(
            "div"
        );

    row.className =
        "content-row";

    row.id =
        rowId;

    header.appendChild(
        heading
    );

    section.appendChild(
        header
    );

    section.appendChild(
        row
    );

    const reference =
        insertBeforeId
            ? document.getElementById(
                insertBeforeId
            )
            : null;

    if (
        reference
    ) {
        reference.before(
            section
        );
    } else {
        document
            .querySelector(
                ".home-shell"
            )
            ?.appendChild(
                section
            );
    }

    return section;
}

/*
 * =========================================================
 * CARGAR CATÁLOGO
 * =========================================================
 */

async function loadCatalog() {
    showLoadingRows();

    try {
        const response =
            await fetch(
                CATALOG_ENDPOINT,
                {
                    method:
                        "GET",

                    credentials:
                        "same-origin",

                    cache:
                        "no-store",

                    headers: {
                        Accept:
                            "application/json"
                    }
                }
            );

        const data =
            await readJsonSafely(
                response
            );

        if (
            response.status ===
            401
        ) {
            window.location.replace(
                data?.redirectUrl ||
                "/login.html"
            );

            return;
        }

        if (
            !response.ok ||
            !data?.ok
        ) {
            throw new Error(
                data?.message ||
                "No se pudo cargar el catálogo."
            );
        }

        currentCatalog = {
            featured:
                normalizeContentItem(
                    data.featured
                ),

            movies:
                normalizeContentArray(
                    data.movies
                ),

            series:
                normalizeContentArray(
                    data.series
                ),

            categories:
                normalizeCategories(
                    data.categories
                )
        };

        renderFeaturedContent(
            currentCatalog.featured
        );

        renderContentRow(
            "movies-row",
            currentCatalog.movies,
            "Todavía no hay películas disponibles."
        );

        renderContentRow(
            "series-row",
            currentCatalog.series,
            "Todavía no hay series disponibles."
        );

        renderCategoriesMenu(
            currentCatalog.categories
        );
    } catch (
        error
    ) {
        console.error(
            "Error cargando catálogo:",
            error
        );

        showCatalogError(
            error.message ||
            "No se pudo cargar el catálogo."
        );
    }
}

function showLoadingRows() {
    renderStatusCard(
        "movies-row",
        "Cargando películas..."
    );

    renderStatusCard(
        "series-row",
        "Cargando series..."
    );
}

function showCatalogError(
    message
) {
    renderStatusCard(
        "movies-row",
        message,
        true
    );

    renderStatusCard(
        "series-row",
        "Revisa la conexión e inténtalo nuevamente.",
        true
    );
}

/*
 * =========================================================
 * NORMALIZAR DATOS
 * =========================================================
 */

function normalizeContentArray(
    rawItems
) {
    if (
        !Array.isArray(
            rawItems
        )
    ) {
        return [];
    }

    return rawItems
        .map(
            normalizeContentItem
        )
        .filter(
            Boolean
        );
}

function normalizeContentItem(
    rawItem
) {
    if (
        !rawItem ||
        typeof rawItem !==
            "object"
    ) {
        return null;
    }

    const title =
        String(
            rawItem.title ||
            ""
        ).trim();

    const id =
        String(
            rawItem.id ||
            rawItem.tmdbId ||
            ""
        ).trim();

    if (
        !title ||
        !id
    ) {
        return null;
    }

    return {
        id,

        tmdbId:
            String(
                rawItem.tmdbId ||
                ""
            ).trim(),

        type:
            String(
                rawItem.type ||
                "movie"
            ).trim(),

        title,

        description:
            String(
                rawItem.description ||
                ""
            ).trim(),

        category:
            String(
                rawItem.category ||
                ""
            ).trim(),

        year:
            String(
                rawItem.year ||
                ""
            ).trim(),

        duration:
            String(
                rawItem.duration ||
                ""
            ).trim(),

        posterUrl:
            normalizeImageUrl(
                rawItem.posterUrl
            ),

        bannerUrl:
            normalizeImageUrl(
                rawItem.bannerUrl
            ),

        seasonsCount:
            normalizeNumber(
                rawItem.seasonsCount
            ),

        episodesCount:
            normalizeNumber(
                rawItem.episodesCount
            ),

        hasEpisodes:
            Boolean(
                rawItem.hasEpisodes
            )
    };
}

function normalizeCategories(
    rawCategories
) {
    if (
        !Array.isArray(
            rawCategories
        )
    ) {
        return [];
    }

    return rawCategories
        .map(
            (
                category
            ) =>
                String(
                    category ||
                    ""
                ).trim()
        )
        .filter(
            Boolean
        );
}

function normalizeNumber(
    value
) {
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

function normalizeImageUrl(
    rawUrl
) {
    if (
        typeof rawUrl !==
        "string"
    ) {
        return "";
    }

    try {
        const url =
            new URL(
                rawUrl
            );

        if (
            url.protocol !==
                "https:" &&
            url.protocol !==
                "http:"
        ) {
            return "";
        }

        return url.href;
    } catch {
        return "";
    }
}

/*
 * =========================================================
 * DESTACADO DEL HOME
 * =========================================================
 */

function renderFeaturedContent(
    featured
) {
    const card =
        document.getElementById(
            "featured-card"
        );

    const title =
        document.getElementById(
            "featured-title"
        );

    const description =
        document.getElementById(
            "featured-description"
        );

    if (
        !card ||
        !title ||
        !description
    ) {
        return;
    }

    if (
        !featured
    ) {
        card.hidden =
            true;

        return;
    }

    card.hidden =
        false;

    title.textContent =
        featured.title;

    description.textContent =
        featured.category ||
        featured.description ||
        "Descubre este contenido en VeiCloud.";

    const image =
        featured.bannerUrl ||
        featured.posterUrl;

    if (
        image
    ) {
        card.style.setProperty(
            "--featured-image",
            `url("${image}")`
        );
    }

    updateFeaturedListButtonState(
        featured
    );
}

function bindFeaturedButtons() {
    document
        .getElementById(
            "featured-play-button"
        )
        ?.addEventListener(
            "click",
            () => {
                if (
                    currentCatalog.featured
                ) {
                    openContentDetails(
                        currentCatalog.featured
                    );
                }
            }
        );

    document
        .getElementById(
            "featured-list-button"
        )
        ?.addEventListener(
            "click",
            () => {
                if (
                    currentCatalog.featured
                ) {
                    toggleMyList(
                        currentCatalog.featured
                    );
                }
            }
        );
}

/*
 * =========================================================
 * FILAS DE CONTENIDO
 * =========================================================
 */

function renderContentRow(
    rowId,
    items,
    emptyMessage
) {
    const row =
        document.getElementById(
            rowId
        );

    if (
        !row
    ) {
        return;
    }

    row.replaceChildren();

    if (
        !items.length
    ) {
        appendStatusCard(
            row,
            emptyMessage
        );

        return;
    }

    items.forEach(
        (
            item
        ) => {
            row.appendChild(
                createContentCard(
                    item
                )
            );
        }
    );
}

function createContentCard(
    item
) {
    const card =
        document.createElement(
            "button"
        );

    card.className =
        "content-card content-card-button";

    card.type =
        "button";

    card.setAttribute(
        "aria-label",
        `Abrir ${item.title}`
    );

    const posterWrapper =
        document.createElement(
            "span"
        );

    posterWrapper.className =
        "content-poster-wrapper";

    if (
        item.posterUrl
    ) {
        const image =
            document.createElement(
                "img"
            );

        image.className =
            "content-poster";

        image.src =
            item.posterUrl;

        image.alt =
            item.title;

        image.loading =
            "lazy";

        image.addEventListener(
            "error",
            () => {
                posterWrapper.replaceChildren(
                    createPosterFallback(
                        item.title
                    )
                );
            }
        );

        posterWrapper.appendChild(
            image
        );
    } else {
        posterWrapper.appendChild(
            createPosterFallback(
                item.title
            )
        );
    }

    const title =
        document.createElement(
            "span"
        );

    title.className =
        "content-card-title";

    title.textContent =
        item.title;

    card.appendChild(
        posterWrapper
    );

    card.appendChild(
        title
    );

    card.addEventListener(
        "click",
        () => {
            openContentDetails(
                item
            );
        }
    );

    return card;
}

function createPosterFallback(
    title
) {
    const fallback =
        document.createElement(
            "span"
        );

    fallback.className =
        "content-poster-fallback";

    fallback.textContent =
        title;

    return fallback;
}

/*
 * =========================================================
 * CREAR FICHA INTERNA
 * =========================================================
 */

function createDetailsOverlay() {
    if (
        document.getElementById(
            "content-details-overlay"
        )
    ) {
        return;
    }

    const overlay =
        document.createElement(
            "section"
        );

    overlay.id =
        "content-details-overlay";

    overlay.className =
        "details-overlay";

    overlay.setAttribute(
        "aria-hidden",
        "true"
    );

    overlay.innerHTML =
        `
        <div
            class="details-hero"
            id="details-hero"
        >
            <button
                class="details-close-button"
                id="details-close-button"
                type="button"
                aria-label="Cerrar detalles"
            >
                ×
            </button>

            <div class="details-hero-gradient"></div>
        </div>

        <div class="details-body">

            <h2
                class="details-title"
                id="details-title"
            >
            </h2>

            <div
                class="details-meta"
                id="details-meta"
            >
            </div>

            <div
                class="details-genres"
                id="details-genres"
            >
            </div>

            <button
                class="details-play-button"
                id="details-play-button"
                type="button"
            >
                ▶ Reproducir
            </button>

            <button
                class="details-download-button"
                id="details-download-button"
                type="button"
            >
                ↓ Descargar
            </button>

            <p
                class="details-description"
                id="details-description"
            >
            </p>

            <div class="details-actions">

                <button
                    class="details-action-button"
                    id="details-list-button"
                    type="button"
                >
                    <span
                        class="details-action-icon"
                        id="details-list-icon"
                    >
                        +
                    </span>

                    <span>
                        Mi lista
                    </span>
                </button>

                <button
                    class="details-action-button"
                    id="details-rate-button"
                    type="button"
                >
                    <span class="details-action-icon">
                        ♡
                    </span>

                    <span>
                        Calificar
                    </span>
                </button>

                <button
                    class="details-action-button"
                    id="details-share-button"
                    type="button"
                >
                    <span class="details-action-icon">
                        ↗
                    </span>

                    <span>
                        Compartir
                    </span>
                </button>

            </div>

            <div class="details-tabs">

                <button
                    class="details-tab active"
                    id="similar-tab-button"
                    type="button"
                >
                    Más títulos similares
                </button>

                <button
                    class="details-tab"
                    id="trailers-tab-button"
                    type="button"
                >
                    Tráilers
                </button>

            </div>

            <div
                class="details-related-row"
                id="details-related-row"
            >
            </div>

        </div>
        `;

    document.body.appendChild(
        overlay
    );

    document
        .getElementById(
            "details-close-button"
        )
        ?.addEventListener(
            "click",
            requestCloseDetails
        );

    document
        .getElementById(
            "details-play-button"
        )
        ?.addEventListener(
            "click",
            handleDetailsPlay
        );

    document
        .getElementById(
            "details-download-button"
        )
        ?.addEventListener(
            "click",
            () => {
                window.alert(
                    "La descarga desde navegador se conectará más adelante."
                );
            }
        );

    document
        .getElementById(
            "details-list-button"
        )
        ?.addEventListener(
            "click",
            () => {
                if (
                    activeDetailsItem
                ) {
                    toggleMyList(
                        activeDetailsItem
                    );

                    updateDetailsListButtonState(
                        activeDetailsItem
                    );
                }
            }
        );

    document
        .getElementById(
            "details-rate-button"
        )
        ?.addEventListener(
            "click",
            () => {
                window.alert(
                    "La calificación se conectará más adelante."
                );
            }
        );

    document
        .getElementById(
            "details-share-button"
        )
        ?.addEventListener(
            "click",
            shareActiveContent
        );

    document
        .getElementById(
            "similar-tab-button"
        )
        ?.addEventListener(
            "click",
            () => {
                selectDetailsTab(
                    "similar"
                );
            }
        );

    document
        .getElementById(
            "trailers-tab-button"
        )
        ?.addEventListener(
            "click",
            () => {
                selectDetailsTab(
                    "trailers"
                );
            }
        );
}

/*
 * =========================================================
 * ABRIR FICHA
 * =========================================================
 */

function openContentDetails(
    item,
    options =
        {}
) {
    if (
        !item
    ) {
        return;
    }

    const overlay =
        document.getElementById(
            "content-details-overlay"
        );

    if (
        !overlay
    ) {
        return;
    }

    activeDetailsItem =
        item;

    const hero =
        document.getElementById(
            "details-hero"
        );

    const title =
        document.getElementById(
            "details-title"
        );

    const description =
        document.getElementById(
            "details-description"
        );

    if (
        hero
    ) {
        const image =
            item.bannerUrl ||
            item.posterUrl ||
            "";

        hero.style.backgroundImage =
            image
                ? `url("${image}")`
                : "none";
    }

    if (
        title
    ) {
        title.textContent =
            item.title;
    }

    if (
        description
    ) {
        description.textContent =
            item.description ||
            "La información de este contenido estará disponible próximamente.";
    }

    renderDetailsMetadata(
        item
    );

    renderDetailsGenres(
        item
    );

    renderRelatedContent(
        item
    );

    updateDetailsListButtonState(
        item
    );

    const playButton =
        document.getElementById(
            "details-play-button"
        );

    if (
        playButton
    ) {
        playButton.textContent =
            item.type ===
                "series"
                ? "▶ Ver capítulos"
                : "▶ Reproducir";
    }

    selectDetailsTab(
        "similar"
    );

    overlay.classList.add(
        "visible"
    );

    overlay.setAttribute(
        "aria-hidden",
        "false"
    );

    document.body.classList.add(
        "details-open"
    );

    overlay.scrollTop =
        0;

    if (
        options.updateHistory !==
        false
    ) {
        const hash =
            `#details=${encodeURIComponent(item.id)}`;

        if (
            window.location.hash !==
            hash
        ) {
            window.history.pushState(
                {
                    veicloudDetails:
                        true
                },
                "",
                hash
            );
        }
    }
}

function renderDetailsMetadata(
    item
) {
    const container =
        document.getElementById(
            "details-meta"
        );

    if (
        !container
    ) {
        return;
    }

    container.replaceChildren();

    const year =
        getDisplayYear(
            item.year
        );

    if (
        year
    ) {
        appendMetadataText(
            container,
            year
        );
    }

    /*
     * Datos visuales predeterminados.
     * Después pueden salir directamente desde Firebase.
     */
    appendMetadataBadge(
        container,
        "16+"
    );

    const duration =
        formatDuration(
            item.duration
        );

    if (
        duration
    ) {
        appendMetadataText(
            container,
            duration
        );
    }

    appendMetadataBadge(
        container,
        "HD"
    );

    appendMetadataText(
        container,
        "Audio espacial"
    );

    if (
        item.type ===
            "series"
    ) {
        if (
            item.seasonsCount >
            0
        ) {
            appendMetadataText(
                container,
                item.seasonsCount ===
                    1
                    ? "1 temporada"
                    : `${item.seasonsCount} temporadas`
            );
        }

        if (
            item.episodesCount >
            0
        ) {
            appendMetadataText(
                container,
                item.episodesCount ===
                    1
                    ? "1 capítulo"
                    : `${item.episodesCount} capítulos`
            );
        }
    }
}

function appendMetadataText(
    container,
    text
) {
    const element =
        document.createElement(
            "span"
        );

    element.className =
        "details-meta-text";

    element.textContent =
        text;

    container.appendChild(
        element
    );
}

function appendMetadataBadge(
    container,
    text
) {
    const element =
        document.createElement(
            "span"
        );

    element.className =
        "details-meta-badge";

    element.textContent =
        text;

    container.appendChild(
        element
    );
}

function getDisplayYear(
    rawYear
) {
    const match =
        String(
            rawYear ||
            ""
        ).match(
            /\d{4}/
        );

    return match
        ? match[0]
        : "";
}

function formatDuration(
    rawDuration
) {
    const durationText =
        String(
            rawDuration ||
            ""
        ).trim();

    if (
        !durationText
    ) {
        return "";
    }

    const minutes =
        Number.parseInt(
            durationText,
            10
        );

    if (
        Number.isNaN(
            minutes
        ) ||
        minutes <=
            0
    ) {
        return durationText;
    }

    const hours =
        Math.floor(
            minutes /
            60
        );

    const remainingMinutes =
        minutes %
        60;

    if (
        hours ===
        0
    ) {
        return `${remainingMinutes} min`;
    }

    if (
        remainingMinutes ===
        0
    ) {
        return `${hours} h`;
    }

    return `${hours} h ${remainingMinutes} min`;
}

function renderDetailsGenres(
    item
) {
    const container =
        document.getElementById(
            "details-genres"
        );

    if (
        !container
    ) {
        return;
    }

    container.replaceChildren();

    const genres =
        String(
            item.category ||
            ""
        )
            .split(
                /[,•|]/
            )
            .map(
                (
                    genre
                ) =>
                    genre.trim()
            )
            .filter(
                Boolean
            )
            .slice(
                0,
                5
            );

    genres.forEach(
        (
            genre
        ) => {
            const chip =
                document.createElement(
                    "span"
                );

            chip.className =
                "details-genre-chip";

            chip.textContent =
                genre;

            container.appendChild(
                chip
            );
        }
    );
}

/*
 * =========================================================
 * CONTENIDO SIMILAR Y TRÁILERS
 * =========================================================
 */

function selectDetailsTab(
    tabName
) {
    const similarButton =
        document.getElementById(
            "similar-tab-button"
        );

    const trailersButton =
        document.getElementById(
            "trailers-tab-button"
        );

    similarButton
        ?.classList
        .toggle(
            "active",
            tabName ===
                "similar"
        );

    trailersButton
        ?.classList
        .toggle(
            "active",
            tabName ===
                "trailers"
        );

    if (
        tabName ===
        "similar"
    ) {
        renderRelatedContent(
            activeDetailsItem
        );

        return;
    }

    renderTrailersPlaceholder();
}

function renderRelatedContent(
    activeItem
) {
    const row =
        document.getElementById(
            "details-related-row"
        );

    if (
        !row
    ) {
        return;
    }

    row.replaceChildren();

    const allItems = [
        ...currentCatalog.movies,
        ...currentCatalog.series
    ];

    const activeGenres =
        String(
            activeItem?.category ||
            ""
        )
            .toLowerCase()
            .split(
                /[,•|]/
            )
            .map(
                (
                    genre
                ) =>
                    genre.trim()
            )
            .filter(
                Boolean
            );

    let relatedItems =
        allItems.filter(
            (
                item
            ) => {
                if (
                    !activeItem ||
                    item.id ===
                        activeItem.id
                ) {
                    return false;
                }

                if (
                    activeGenres.length ===
                    0
                ) {
                    return true;
                }

                const category =
                    item.category
                        .toLowerCase();

                return activeGenres.some(
                    (
                        genre
                    ) =>
                        category.includes(
                            genre
                        )
                );
            }
        );

    if (
        relatedItems.length <
        4
    ) {
        const existingIds =
            new Set(
                relatedItems.map(
                    (
                        item
                    ) =>
                        item.id
                )
            );

        const fallbackItems =
            allItems.filter(
                (
                    item
                ) =>
                    item.id !==
                        activeItem?.id &&
                    !existingIds.has(
                        item.id
                    )
            );

        relatedItems = [
            ...relatedItems,
            ...fallbackItems
        ];
    }

    relatedItems
        .slice(
            0,
            10
        )
        .forEach(
            (
                item
            ) => {
                row.appendChild(
                    createRelatedCard(
                        item
                    )
                );
            }
        );

    if (
        row.children.length ===
        0
    ) {
        appendDetailsEmptyMessage(
            row,
            "Todavía no hay títulos similares."
        );
    }
}

function createRelatedCard(
    item
) {
    const button =
        document.createElement(
            "button"
        );

    button.className =
        "details-related-card";

    button.type =
        "button";

    if (
        item.posterUrl
    ) {
        const image =
            document.createElement(
                "img"
            );

        image.src =
            item.posterUrl;

        image.alt =
            item.title;

        image.loading =
            "lazy";

        button.appendChild(
            image
        );
    } else {
        const fallback =
            document.createElement(
                "span"
            );

        fallback.textContent =
            item.title;

        button.appendChild(
            fallback
        );
    }

    button.addEventListener(
        "click",
        () => {
            openContentDetails(
                item,
                {
                    updateHistory:
                        false
                }
            );
        }
    );

    return button;
}

function renderTrailersPlaceholder() {
    const row =
        document.getElementById(
            "details-related-row"
        );

    if (
        !row
    ) {
        return;
    }

    row.replaceChildren();

    appendDetailsEmptyMessage(
        row,
        "Todavía no hay tráilers disponibles."
    );
}

function appendDetailsEmptyMessage(
    container,
    message
) {
    const element =
        document.createElement(
            "p"
        );

    element.className =
        "details-empty-message";

    element.textContent =
        message;

    container.appendChild(
        element
    );
}

/*
 * =========================================================
 * ACCIONES DE DETALLES
 * =========================================================
 */

function handleDetailsPlay() {
    if (
        !activeDetailsItem
    ) {
        return;
    }

    if (
        activeDetailsItem.type ===
        "series"
    ) {
        window.alert(
            "El selector de temporadas y capítulos será el próximo módulo."
        );

        return;
    }

    window.alert(
        "El reproductor web será el próximo módulo."
    );
}

async function shareActiveContent() {
    if (
        !activeDetailsItem
    ) {
        return;
    }

    const url =
        `${window.location.origin}` +
        `${window.location.pathname}` +
        `#details=${encodeURIComponent(activeDetailsItem.id)}`;

    try {
        if (
            navigator.share
        ) {
            await navigator.share(
                {
                    title:
                        activeDetailsItem.title,

                    text:
                        `Mira ${activeDetailsItem.title} en VeiCloud`,

                    url
                }
            );

            return;
        }

        await navigator
            .clipboard
            .writeText(
                url
            );

        window.alert(
            "Enlace copiado."
        );
    } catch (
        error
    ) {
        console.error(
            "No se pudo compartir:",
            error
        );
    }
}

/*
 * =========================================================
 * CERRAR FICHA
 * =========================================================
 */

function requestCloseDetails() {
    if (
        window.history.state
            ?.veicloudDetails
    ) {
        window.history.back();

        return;
    }

    hideDetailsOverlay();

    removeDetailsHash();
}

function hideDetailsOverlay() {
    const overlay =
        document.getElementById(
            "content-details-overlay"
        );

    if (
        !overlay
    ) {
        return;
    }

    overlay.classList.remove(
        "visible"
    );

    overlay.setAttribute(
        "aria-hidden",
        "true"
    );

    document.body.classList.remove(
        "details-open"
    );

    activeDetailsItem =
        null;
}

function removeDetailsHash() {
    window.history.replaceState(
        null,
        "",
        window.location.pathname +
        window.location.search
    );
}

function bindHistoryNavigation() {
    window.addEventListener(
        "popstate",
        () => {
            if (
                window.location.hash.startsWith(
                    "#details="
                )
            ) {
                openDetailsFromCurrentHash();

                return;
            }

            hideDetailsOverlay();
        }
    );

    window.addEventListener(
        "keydown",
        (
            event
        ) => {
            if (
                event.key ===
                    "Escape" &&
                activeDetailsItem
            ) {
                requestCloseDetails();
            }
        }
    );
}

function openDetailsFromCurrentHash() {
    if (
        !window.location.hash.startsWith(
            "#details="
        )
    ) {
        return;
    }

    const itemId =
        decodeURIComponent(
            window.location.hash.replace(
                "#details=",
                ""
            )
        );

    const item =
        findCatalogItemById(
            itemId
        );

    if (
        item
    ) {
        openContentDetails(
            item,
            {
                updateHistory:
                    false
            }
        );
    }
}

function findCatalogItemById(
    itemId
) {
    return [
        currentCatalog.featured,
        ...currentCatalog.movies,
        ...currentCatalog.series
    ]
        .filter(
            Boolean
        )
        .find(
            (
                item
            ) =>
                item.id ===
                itemId
        ) ||
        null;
}

/*
 * =========================================================
 * CATEGORÍAS
 * =========================================================
 */

function bindCategoryNavigation() {
    const buttons =
        Array.from(
            document.querySelectorAll(
                ".home-category-button"
            )
        );

    buttons[0]
        ?.addEventListener(
            "click",
            () => {
                scrollToSection(
                    "series-section"
                );
            }
        );

    buttons[1]
        ?.addEventListener(
            "click",
            () => {
                scrollToSection(
                    "movies-section"
                );
            }
        );

    buttons[2]
        ?.addEventListener(
            "click",
            toggleCategoriesMenu
        );
}

function renderCategoriesMenu(
    categories
) {
    let menu =
        document.getElementById(
            "categories-menu"
        );

    if (
        !menu
    ) {
        menu =
            document.createElement(
                "div"
            );

        menu.id =
            "categories-menu";

        menu.className =
            "categories-menu";

        document
            .querySelector(
                ".home-category-nav"
            )
            ?.after(
                menu
            );
    }

    menu.replaceChildren();

    if (
        !categories.length
    ) {
        const message =
            document.createElement(
                "p"
            );

        message.className =
            "categories-empty";

        message.textContent =
            "Todavía no hay categorías disponibles.";

        menu.appendChild(
            message
        );

        return;
    }

    categories.forEach(
        (
            category
        ) => {
            const button =
                document.createElement(
                    "button"
                );

            button.className =
                "category-chip";

            button.type =
                "button";

            button.textContent =
                category;

            button.addEventListener(
                "click",
                () => {
                    showCategorySection(
                        category
                    );

                    menu.classList.remove(
                        "visible"
                    );
                }
            );

            menu.appendChild(
                button
            );
        }
    );
}

function toggleCategoriesMenu() {
    document
        .getElementById(
            "categories-menu"
        )
        ?.classList.toggle(
            "visible"
        );
}

function showCategorySection(
    category
) {
    const normalizedCategory =
        category.toLowerCase();

    const items = [
        ...currentCatalog.movies,
        ...currentCatalog.series
    ].filter(
        (
            item
        ) =>
            item.category
                .toLowerCase()
                .includes(
                    normalizedCategory
                )
    );

    ensureCatalogSection(
        {
            sectionId:
                "selected-category-section",

            rowId:
                "selected-category-row",

            title:
                category,

            insertBeforeId:
                "movies-section"
        }
    );

    const heading =
        document
            .getElementById(
                "selected-category-section"
            )
            ?.querySelector(
                ".section-header h2"
            );

    if (
        heading
    ) {
        heading.textContent =
            category;
    }

    renderContentRow(
        "selected-category-row",
        items,
        `Todavía no hay contenido en ${category}.`
    );

    scrollToSection(
        "selected-category-section"
    );
}

function scrollToSection(
    sectionId
) {
    document
        .getElementById(
            sectionId
        )
        ?.scrollIntoView(
            {
                behavior:
                    "smooth",

                block:
                    "start"
            }
        );
}

/*
 * =========================================================
 * MI LISTA
 * =========================================================
 */

function readMyList() {
    try {
        const rawList =
            localStorage.getItem(
                MY_LIST_STORAGE_KEY
            );

        if (
            !rawList
        ) {
            return [];
        }

        const list =
            JSON.parse(
                rawList
            );

        return Array.isArray(
            list
        )
            ? list
            : [];
    } catch {
        return [];
    }
}

function isItemSaved(
    itemId
) {
    return readMyList().some(
        (
            savedItem
        ) =>
            savedItem.id ===
            itemId
    );
}

function toggleMyList(
    item
) {
    const list =
        readMyList();

    const index =
        list.findIndex(
            (
                savedItem
            ) =>
                savedItem.id ===
                item.id
        );

    if (
        index >=
        0
    ) {
        list.splice(
            index,
            1
        );
    } else {
        list.push(
            {
                id:
                    item.id,

                type:
                    item.type,

                title:
                    item.title,

                posterUrl:
                    item.posterUrl
            }
        );
    }

    localStorage.setItem(
        MY_LIST_STORAGE_KEY,
        JSON.stringify(
            list
        )
    );

    updateFeaturedListButtonState(
        currentCatalog.featured
    );
}

function updateFeaturedListButtonState(
    item
) {
    const button =
        document.getElementById(
            "featured-list-button"
        );

    if (
        !button ||
        !item
    ) {
        return;
    }

    const saved =
        isItemSaved(
            item.id
        );

    const icon =
        button.querySelector(
            ".featured-list-plus"
        );

    const label =
        button.querySelector(
            "span:last-child"
        );

    if (
        icon
    ) {
        icon.textContent =
            saved
                ? "✓"
                : "+";
    }

    if (
        label
    ) {
        label.textContent =
            saved
                ? "En mi lista"
                : "Mi lista";
    }
}

function updateDetailsListButtonState(
    item
) {
    const icon =
        document.getElementById(
            "details-list-icon"
        );

    if (
        icon
    ) {
        icon.textContent =
            isItemSaved(
                item.id
            )
                ? "✓"
                : "+";
    }
}

/*
 * =========================================================
 * BOTONES SUPERIORES
 * =========================================================
 */

function bindTopbarButtons() {
    const buttons =
        Array.from(
            document.querySelectorAll(
                ".home-icon-button"
            )
        );

    buttons[0]
        ?.addEventListener(
            "click",
            () => {
                window.alert(
                    "La sección de descargas estará disponible próximamente."
                );
            }
        );

    buttons[1]
        ?.addEventListener(
            "click",
            () => {
                window.alert(
                    "El buscador será el próximo módulo."
                );
            }
        );
}

/*
 * =========================================================
 * ESTADOS
 * =========================================================
 */

function renderStatusCard(
    rowId,
    message,
    isError =
        false
) {
    const row =
        document.getElementById(
            rowId
        );

    if (
        !row
    ) {
        return;
    }

    row.replaceChildren();

    appendStatusCard(
        row,
        message,
        isError
    );
}

function appendStatusCard(
    row,
    message,
    isError =
        false
) {
    const card =
        document.createElement(
            "div"
        );

    card.className =
        isError
            ? "catalog-status-card error"
            : "catalog-status-card";

    card.textContent =
        message;

    row.appendChild(
        card
    );
}

/*
 * =========================================================
 * ESTILOS DINÁMICOS
 * =========================================================
 */

function injectDynamicHomeStyles() {
    if (
        document.getElementById(
            "dynamic-home-styles"
        )
    ) {
        return;
    }

    const style =
        document.createElement(
            "style"
        );

    style.id =
        "dynamic-home-styles";

    style.textContent =
        `
        .content-card-button {
            display: flex;
            flex-direction: column;
            padding: 0;
            border: none;
            outline: none;
            background: transparent;
            color: inherit;
            cursor: pointer;
            font-family: inherit;
            text-align: left;
        }

        .content-poster-fallback {
            display: grid;
            place-items: center;
            width: 100%;
            height: 100%;
            padding: 14px;
            background:
                linear-gradient(
                    145deg,
                    #24242f,
                    #121218
                );
            color: rgba(255, 255, 255, 0.86);
            font-size: 14px;
            font-weight: 800;
            line-height: 1.35;
            text-align: center;
        }

        .catalog-status-card {
            display: grid;
            place-items: center;
            min-width: 240px;
            min-height: 120px;
            padding: 20px;
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 18px;
            background: rgba(255, 255, 255, 0.04);
            color: rgba(255, 255, 255, 0.66);
            font-size: 14px;
            font-weight: 700;
            text-align: center;
        }

        .catalog-status-card.error {
            color: #ff868c;
        }

        .categories-menu {
            display: none;
            flex-wrap: wrap;
            gap: 9px;
            margin-top: 18px;
            padding: 15px;
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 18px;
            background: rgba(21, 21, 29, 0.96);
        }

        .categories-menu.visible {
            display: flex;
        }

        .category-chip {
            padding: 10px 13px;
            border: 1px solid rgba(255, 255, 255, 0.10);
            border-radius: 999px;
            background: rgba(255, 255, 255, 0.06);
            color: #ffffff;
            cursor: pointer;
            font-family: inherit;
            font-size: 13px;
            font-weight: 800;
        }

        .categories-empty {
            margin: 0;
            color: rgba(255, 255, 255, 0.60);
            font-size: 13px;
            font-weight: 700;
        }

        body.details-open {
            overflow: hidden;
        }

        .details-overlay {
            position: fixed;
            z-index: 500;
            inset: 0;
            overflow-y: auto;
            background: #050505;
            opacity: 0;
            pointer-events: none;
            transform: translateY(20px);
            transition:
                opacity 240ms ease,
                transform 240ms ease;
            overscroll-behavior: contain;
        }

        .details-overlay.visible {
            opacity: 1;
            pointer-events: auto;
            transform: translateY(0);
        }

        .details-hero {
            position: relative;
            min-height: 46svh;
            background-color: #111118;
            background-position: center top;
            background-repeat: no-repeat;
            background-size: cover;
        }

        .details-hero-gradient {
            position: absolute;
            inset: 0;
            background:
                linear-gradient(
                    180deg,
                    rgba(5, 5, 5, 0.02) 0%,
                    rgba(5, 5, 5, 0.06) 58%,
                    #050505 100%
                );
        }

        .details-close-button {
            position: absolute;
            z-index: 3;
            top: max(20px, env(safe-area-inset-top));
            right: 20px;
            display: grid;
            place-items: center;
            width: 44px;
            height: 44px;
            padding: 0 0 4px;
            border: none;
            background: transparent;
            color: #ffffff;
            cursor: pointer;
            font-size: 44px;
            font-weight: 300;
            line-height: 1;
        }

        .details-body {
            position: relative;
            max-width: 760px;
            margin: -38px auto 0;
            padding:
                0
                18px
                max(38px, env(safe-area-inset-bottom));
        }

        .details-title {
            margin: 0;
            color: #ffffff;
            font-size: clamp(35px, 9vw, 54px);
            font-weight: 900;
            letter-spacing: -1.8px;
            line-height: 1.03;
        }

        .details-meta {
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            gap: 13px;
            margin-top: 21px;
        }

        .details-meta-text {
            color: rgba(255, 255, 255, 0.70);
            font-size: 15px;
            font-weight: 800;
        }

        .details-meta-badge {
            display: grid;
            place-items: center;
            min-height: 42px;
            padding: 0 12px;
            border-radius: 9px;
            background: rgba(255, 255, 255, 0.11);
            color: #ffffff;
            font-size: 15px;
            font-weight: 900;
        }

        .details-genres {
            display: flex;
            flex-wrap: wrap;
            gap: 9px;
            margin-top: 20px;
        }

        .details-genre-chip {
            padding: 11px 16px;
            border-radius: 999px;
            background: rgba(255, 255, 255, 0.09);
            color: #ffffff;
            font-size: 14px;
            font-weight: 800;
        }

        .details-play-button,
        .details-download-button {
            width: 100%;
            min-height: 58px;
            border: none;
            border-radius: 13px;
            cursor: pointer;
            font-family: inherit;
            font-size: 17px;
            font-weight: 900;
        }

        .details-play-button {
            margin-top: 26px;
            background: #ffffff;
            color: #050505;
        }

        .details-download-button {
            margin-top: 11px;
            background: rgba(255, 255, 255, 0.18);
            color: #ffffff;
        }

        .details-description {
            margin: 25px 0 0;
            color: rgba(255, 255, 255, 0.90);
            font-size: 16px;
            font-weight: 650;
            line-height: 1.66;
        }

        .details-actions {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 10px;
            margin-top: 31px;
        }

        .details-action-button {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 9px;
            padding: 0;
            border: none;
            background: transparent;
            color: #ffffff;
            cursor: pointer;
            font-family: inherit;
            font-size: 12px;
            font-weight: 800;
        }

        .details-action-icon {
            font-size: 40px;
            font-weight: 300;
            line-height: 1;
        }

        .details-tabs {
            display: grid;
            grid-template-columns: 1.45fr 0.85fr;
            gap: 0;
            margin-top: 35px;
        }

        .details-tab {
            position: relative;
            padding: 0 0 13px;
            border: none;
            background: transparent;
            color: rgba(255, 255, 255, 0.55);
            cursor: pointer;
            font-family: inherit;
            font-size: 18px;
            font-weight: 900;
            text-align: left;
        }

        .details-tab.active {
            color: #ffffff;
        }

        .details-tab.active::after {
            position: absolute;
            right: 0;
            bottom: 0;
            left: 0;
            height: 4px;
            background: #ed0711;
            content: "";
        }

        .details-related-row {
            display: flex;
            gap: 11px;
            margin-top: 20px;
            padding-bottom: 8px;
            overflow-x: auto;
            scrollbar-width: none;
        }

        .details-related-row::-webkit-scrollbar {
            display: none;
        }

        .details-related-card {
            flex: 0 0 auto;
            width: 132px;
            aspect-ratio: 0.68;
            overflow: hidden;
            padding: 0;
            border: none;
            border-radius: 15px;
            background: #171720;
            color: rgba(255, 255, 255, 0.82);
            cursor: pointer;
            font-family: inherit;
            font-size: 13px;
            font-weight: 800;
            line-height: 1.35;
            text-align: center;
        }

        .details-related-card img {
            display: block;
            width: 100%;
            height: 100%;
            object-fit: cover;
        }

        .details-related-card span {
            display: grid;
            place-items: center;
            width: 100%;
            height: 100%;
            padding: 12px;
        }

        .details-empty-message {
            min-width: 100%;
            margin: 0;
            padding: 22px;
            border-radius: 14px;
            background: rgba(255, 255, 255, 0.05);
            color: rgba(255, 255, 255, 0.62);
            font-size: 14px;
            font-weight: 700;
            text-align: center;
        }

        @media (min-width: 760px) {
            .details-hero {
                min-height: 560px;
            }

            .details-body {
                margin-top: -54px;
                padding-right: 28px;
                padding-left: 28px;
            }

            .details-related-card {
                width: 154px;
            }
        }
        `;

    document.head.appendChild(
        style
    );
}

/*
 * =========================================================
 * JSON SEGURO
 * =========================================================
 */

async function readJsonSafely(
    response
) {
    try {
        return await response.json();
    } catch {
        return null;
    }
}
