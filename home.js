/*
 * =========================================================
 * VEICLOUD WEB
 * HOME CON CATÁLOGO REAL + FICHA DE DETALLES INTERNA
 * =========================================================
 *
 * Este archivo:
 * - recupera el perfil elegido
 * - solicita el catálogo privado al servidor
 * - muestra contenido destacado
 * - dibuja películas y series reales
 * - genera categorías
 * - muestra detalles dentro del mismo Home
 * - utiliza el botón atrás del navegador para cerrar la ficha
 *
 * No abre detail.html.
 */

const SELECTED_PROFILE_STORAGE_KEY =
    "veicloud_selected_profile";

const MY_LIST_STORAGE_KEY =
    "veicloud_my_list";

const CATALOG_ENDPOINT =
    "/api/catalog?limit=40";

let currentCatalog = {
    featured:
        null,

    movies:
        [],

    series:
        [],

    categories:
        []
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

        /*
         * Si alguien entra directamente sin elegir perfil,
         * regresamos a la pantalla correspondiente.
         */
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

        const parsedProfile =
            JSON.parse(
                rawProfile
            );

        return {
            id:
                String(
                    parsedProfile?.id ||
                    ""
                ),

            name:
                String(
                    parsedProfile?.name ||
                    "tu perfil"
                ),

            iconUrl:
                String(
                    parsedProfile?.iconUrl ||
                    ""
                ),

            isKids:
                Boolean(
                    parsedProfile?.isKids
                )
        };
    } catch (
        error
    ) {
        console.error(
            "No fue posible leer el perfil seleccionado:",
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
        !profileNameElement
    ) {
        return;
    }

    profileNameElement.textContent =
        String(
            profileName ||
            "tu perfil"
        );
}

/*
 * =========================================================
 * PREPARAR FILAS DEL HOME
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

        const existingSeriesRow =
            existingSeriesSection.querySelector(
                ".content-row"
            );

        if (
            existingSeriesRow
        ) {
            existingSeriesRow.id =
                "series-row";

            existingSeriesRow.replaceChildren();
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
    const continueWatchingRow =
        document.getElementById(
            "continue-watching-row"
        );

    const continueWatchingSection =
        continueWatchingRow
            ?.closest(
                ".content-section"
            );

    if (
        continueWatchingSection
    ) {
        continueWatchingSection.hidden =
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
            ) => {
                const title =
                    section
                        .querySelector(
                            ".section-header h2"
                        )
                        ?.textContent
                        ?.trim();

                return (
                    title ===
                    requestedTitle
                );
            }
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

    const sectionHeader =
        document.createElement(
            "div"
        );

    sectionHeader.className =
        "section-header";

    const sectionTitle =
        document.createElement(
            "h2"
        );

    sectionTitle.textContent =
        title;

    const row =
        document.createElement(
            "div"
        );

    row.className =
        "content-row";

    row.id =
        rowId;

    sectionHeader.appendChild(
        sectionTitle
    );

    section.appendChild(
        sectionHeader
    );

    section.appendChild(
        row
    );

    const insertBeforeElement =
        insertBeforeId
            ? document.getElementById(
                insertBeforeId
            )
            : null;

    if (
        insertBeforeElement
    ) {
        insertBeforeElement.before(
            section
        );

        return section;
    }

    const homeShell =
        document.querySelector(
            ".home-shell"
        );

    homeShell?.appendChild(
        section
    );

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
                "No fue posible cargar el catálogo."
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
            "No fue posible cargar el catálogo."
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
                ""
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

/*
 * =========================================================
 * CONTENIDO DESTACADO
 * =========================================================
 */

function renderFeaturedContent(
    featured
) {
    const featuredCard =
        document.getElementById(
            "featured-card"
        );

    const featuredTitle =
        document.getElementById(
            "featured-title"
        );

    const featuredDescription =
        document.getElementById(
            "featured-description"
        );

    if (
        !featuredCard ||
        !featuredTitle ||
        !featuredDescription
    ) {
        return;
    }

    if (
        !featured
    ) {
        featuredCard.hidden =
            true;

        return;
    }

    featuredCard.hidden =
        false;

    featuredCard.dataset.contentId =
        featured.id;

    featuredCard.dataset.contentType =
        featured.type;

    featuredTitle.textContent =
        featured.title;

    featuredDescription.textContent =
        featured.description ||
        featured.category ||
        "Descubre este contenido en VeiCloud.";

    const featuredImage =
        featured.bannerUrl ||
        featured.posterUrl;

    if (
        featuredImage
    ) {
        featuredCard.style.setProperty(
            "--featured-image",
            `url("${featuredImage}")`
        );
    }

    updateMyListButtonState(
        featured
    );
}

function bindFeaturedButtons() {
    const playButton =
        document.getElementById(
            "featured-play-button"
        );

    const listButton =
        document.getElementById(
            "featured-list-button"
        );

    /*
     * Mientras conectamos el reproductor,
     * tocar Reproducir abre la ficha interna.
     */
    playButton?.addEventListener(
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

    listButton?.addEventListener(
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
        !Array.isArray(
            items
        ) ||
        items.length ===
            0
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
        const posterImage =
            document.createElement(
                "img"
            );

        posterImage.className =
            "content-poster";

        posterImage.src =
            item.posterUrl;

        posterImage.alt =
            item.title;

        posterImage.loading =
            "lazy";

        posterImage.addEventListener(
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
            posterImage
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
 * FICHA INTERNA DE DETALLES
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

    const background =
        document.createElement(
            "div"
        );

    background.className =
        "details-backdrop";

    background.id =
        "details-backdrop";

    const gradient =
        document.createElement(
            "div"
        );

    gradient.className =
        "details-gradient";

    const topbar =
        document.createElement(
            "header"
        );

    topbar.className =
        "details-topbar";

    const closeButton =
        document.createElement(
            "button"
        );

    closeButton.className =
        "details-close-button";

    closeButton.id =
        "details-close-button";

    closeButton.type =
        "button";

    closeButton.setAttribute(
        "aria-label",
        "Volver al inicio"
    );

    closeButton.textContent =
        "‹";

    const brand =
        document.createElement(
            "span"
        );

    brand.className =
        "details-brand";

    brand.textContent =
        "VeiCloud";

    topbar.appendChild(
        closeButton
    );

    topbar.appendChild(
        brand
    );

    const content =
        document.createElement(
            "div"
        );

    content.className =
        "details-content";

    const type =
        document.createElement(
            "p"
        );

    type.className =
        "details-type";

    type.id =
        "details-type";

    const title =
        document.createElement(
            "h2"
        );

    title.className =
        "details-title";

    title.id =
        "details-title";

    const metadata =
        document.createElement(
            "p"
        );

    metadata.className =
        "details-metadata";

    metadata.id =
        "details-metadata";

    const description =
        document.createElement(
            "p"
        );

    description.className =
        "details-description";

    description.id =
        "details-description";

    const actions =
        document.createElement(
            "div"
        );

    actions.className =
        "details-actions";

    const playButton =
        document.createElement(
            "button"
        );

    playButton.className =
        "details-primary-button";

    playButton.id =
        "details-play-button";

    playButton.type =
        "button";

    playButton.textContent =
        "▶ Reproducir";

    const listButton =
        document.createElement(
            "button"
        );

    listButton.className =
        "details-secondary-button";

    listButton.id =
        "details-list-button";

    listButton.type =
        "button";

    listButton.textContent =
        "+ Mi lista";

    actions.appendChild(
        playButton
    );

    actions.appendChild(
        listButton
    );

    content.appendChild(
        type
    );

    content.appendChild(
        title
    );

    content.appendChild(
        metadata
    );

    content.appendChild(
        actions
    );

    content.appendChild(
        description
    );

    overlay.appendChild(
        background
    );

    overlay.appendChild(
        gradient
    );

    overlay.appendChild(
        topbar
    );

    overlay.appendChild(
        content
    );

    document.body.appendChild(
        overlay
    );

    closeButton.addEventListener(
        "click",
        requestCloseDetails
    );

    listButton.addEventListener(
        "click",
        () => {
            if (
                !activeDetailsItem
            ) {
                return;
            }

            toggleMyList(
                activeDetailsItem
            );

            updateDetailsListButtonState(
                activeDetailsItem
            );
        }
    );

    playButton.addEventListener(
        "click",
        () => {
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
    );
}

function openContentDetails(
    item,
    options =
        {}
) {
    const overlay =
        document.getElementById(
            "content-details-overlay"
        );

    if (
        !overlay ||
        !item
    ) {
        return;
    }

    activeDetailsItem =
        item;

    const backdrop =
        document.getElementById(
            "details-backdrop"
        );

    const title =
        document.getElementById(
            "details-title"
        );

    const type =
        document.getElementById(
            "details-type"
        );

    const metadata =
        document.getElementById(
            "details-metadata"
        );

    const description =
        document.getElementById(
            "details-description"
        );

    if (
        backdrop
    ) {
        const image =
            item.bannerUrl ||
            item.posterUrl ||
            "";

        backdrop.style.backgroundImage =
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
        type
    ) {
        type.textContent =
            item.type ===
                "series"
                ? "SERIE"
                : "PELÍCULA";
    }

    if (
        metadata
    ) {
        metadata.textContent =
            buildDetailsMetadata(
                item
            );
    }

    if (
        description
    ) {
        description.textContent =
            item.description ||
            "La información de este contenido estará disponible próximamente.";
    }

    updateDetailsListButtonState(
        item
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

    if (
        options.updateHistory !==
        false
    ) {
        const detailsHash =
            `#details=${encodeURIComponent(item.id)}`;

        if (
            window.location.hash !==
            detailsHash
        ) {
            window.history.pushState(
                {
                    veicloudDetails:
                        true
                },
                "",
                detailsHash
            );
        }
    }
}

function buildDetailsMetadata(
    item
) {
    const parts =
        [];

    if (
        item.year
    ) {
        parts.push(
            item.year
        );
    }

    if (
        item.duration
    ) {
        parts.push(
            item.duration
        );
    }

    if (
        item.type ===
        "series"
    ) {
        if (
            item.seasonsCount >
            0
        ) {
            parts.push(
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
            parts.push(
                item.episodesCount ===
                    1
                    ? "1 capítulo"
                    : `${item.episodesCount} capítulos`
            );
        }
    }

    if (
        item.category
    ) {
        parts.push(
            item.category
        );
    }

    return parts.join(
        " • "
    );
}

function updateDetailsListButtonState(
    item
) {
    const listButton =
        document.getElementById(
            "details-list-button"
        );

    if (
        !listButton ||
        !item
    ) {
        return;
    }

    const isSaved =
        isItemSaved(
            item.id
        );

    listButton.textContent =
        isSaved
            ? "✓ En mi lista"
            : "+ Mi lista";
}

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
    const cleanUrl =
        window.location.pathname +
        window.location.search;

    window.history.replaceState(
        null,
        "",
        cleanUrl
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

    const requestedId =
        decodeURIComponent(
            window.location.hash
                .replace(
                    "#details=",
                    ""
                )
        );

    const item =
        findCatalogItemById(
            requestedId
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
    requestedId
) {
    const allItems = [
        currentCatalog.featured,
        ...currentCatalog.movies,
        ...currentCatalog.series
    ]
        .filter(
            Boolean
        );

    return (
        allItems.find(
            (
                item
            ) =>
                item.id ===
                requestedId
        ) ||
        null
    );
}

/*
 * =========================================================
 * CATEGORÍAS
 * =========================================================
 */

function bindCategoryNavigation() {
    const navigationButtons =
        Array.from(
            document.querySelectorAll(
                ".home-category-button"
            )
        );

    const seriesButton =
        navigationButtons[0];

    const moviesButton =
        navigationButtons[1];

    const categoriesButton =
        navigationButtons[2];

    seriesButton?.addEventListener(
        "click",
        () => {
            scrollToSection(
                "series-section"
            );
        }
    );

    moviesButton?.addEventListener(
        "click",
        () => {
            scrollToSection(
                "movies-section"
            );
        }
    );

    categoriesButton?.addEventListener(
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

        const categoryNav =
            document.querySelector(
                ".home-category-nav"
            );

        categoryNav?.after(
            menu
        );
    }

    menu.replaceChildren();

    if (
        !categories.length
    ) {
        const emptyMessage =
            document.createElement(
                "p"
            );

        emptyMessage.className =
            "categories-empty";

        emptyMessage.textContent =
            "Todavía no hay categorías disponibles.";

        menu.appendChild(
            emptyMessage
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

    const allContent = [
        ...currentCatalog.movies,
        ...currentCatalog.series
    ];

    const filteredContent =
        allContent.filter(
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

    const categoryTitle =
        document
            .getElementById(
                "selected-category-section"
            )
            ?.querySelector(
                ".section-header h2"
            );

    if (
        categoryTitle
    ) {
        categoryTitle.textContent =
            category;
    }

    renderContentRow(
        "selected-category-row",
        filteredContent,
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
 * MI LISTA LOCAL
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

        const parsedList =
            JSON.parse(
                rawList
            );

        return Array.isArray(
            parsedList
        )
            ? parsedList
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
    const currentList =
        readMyList();

    const existingIndex =
        currentList.findIndex(
            (
                savedItem
            ) =>
                savedItem.id ===
                item.id
        );

    if (
        existingIndex >=
        0
    ) {
        currentList.splice(
            existingIndex,
            1
        );
    } else {
        currentList.push(
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
            currentList
        )
    );

    updateMyListButtonState(
        item
    );
}

function updateMyListButtonState(
    item
) {
    const listButton =
        document.getElementById(
            "featured-list-button"
        );

    if (
        !listButton ||
        !item
    ) {
        return;
    }

    const isSaved =
        isItemSaved(
            item.id
        );

    const label =
        listButton.querySelector(
            "span:last-child"
        );

    const plus =
        listButton.querySelector(
            ".featured-list-plus"
        );

    if (
        label
    ) {
        label.textContent =
            isSaved
                ? "En mi lista"
                : "Mi lista";
    }

    if (
        plus
    ) {
        plus.textContent =
            isSaved
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
    const iconButtons =
        Array.from(
            document.querySelectorAll(
                ".home-icon-button"
            )
        );

    const downloadsButton =
        iconButtons[0];

    const searchButton =
        iconButtons[1];

    downloadsButton?.addEventListener(
        "click",
        () => {
            window.alert(
                "La sección de descargas estará disponible próximamente."
            );
        }
    );

    searchButton?.addEventListener(
        "click",
        () => {
            window.alert(
                "El buscador será el próximo módulo de VeiCloud Web."
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
    const statusCard =
        document.createElement(
            "div"
        );

    statusCard.className =
        isError
            ? "catalog-status-card error"
            : "catalog-status-card";

    statusCard.textContent =
        message;

    row.appendChild(
        statusCard
    );
}

/*
 * =========================================================
 * ESTILOS COMPLEMENTARIOS
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
            line-height: 1.5;
            text-align: center;
        }

        .catalog-status-card.error {
            border-color: rgba(237, 7, 17, 0.20);
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
            background: rgba(21, 21, 29, 0.94);
            box-shadow: 0 18px 34px rgba(0, 0, 0, 0.20);
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
            display: flex;
            align-items: flex-end;
            overflow: hidden;
            background: #050505;
            opacity: 0;
            pointer-events: none;
            transform: translateY(18px);
            transition:
                opacity 260ms ease,
                transform 260ms ease;
        }

        .details-overlay.visible {
            opacity: 1;
            pointer-events: auto;
            transform: translateY(0);
        }

        .details-backdrop {
            position: absolute;
            inset: 0;
            background-position: center top;
            background-repeat: no-repeat;
            background-size: cover;
            filter:
                saturate(0.96)
                contrast(1.04);
        }

        .details-gradient {
            position: absolute;
            inset: 0;
            background:
                linear-gradient(
                    180deg,
                    rgba(5, 5, 5, 0.04) 0%,
                    rgba(5, 5, 5, 0.20) 40%,
                    rgba(5, 5, 5, 0.90) 73%,
                    #050505 100%
                );
        }

        .details-topbar {
            position: absolute;
            z-index: 3;
            top: 0;
            right: 0;
            left: 0;
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding:
                max(20px, env(safe-area-inset-top))
                20px
                0;
        }

        .details-close-button {
            display: grid;
            place-items: center;
            width: 46px;
            height: 46px;
            padding: 0 0 5px;
            border: 1px solid rgba(255, 255, 255, 0.18);
            border-radius: 50%;
            background: rgba(0, 0, 0, 0.34);
            color: #ffffff;
            cursor: pointer;
            font-family: inherit;
            font-size: 46px;
            font-weight: 300;
            line-height: 1;
            backdrop-filter: blur(16px);
        }

        .details-brand {
            color: #ed0711;
            font-size: 22px;
            font-weight: 900;
            letter-spacing: -1px;
        }

        .details-content {
            position: relative;
            z-index: 2;
            width: min(100%, 720px);
            margin: 0 auto;
            padding:
                32px
                22px
                max(36px, env(safe-area-inset-bottom));
        }

        .details-type {
            margin: 0 0 10px;
            color: #ff5b63;
            font-size: 11px;
            font-weight: 900;
            letter-spacing: 2.4px;
        }

        .details-title {
            margin: 0;
            color: #ffffff;
            font-size: clamp(42px, 11vw, 66px);
            font-weight: 900;
            letter-spacing: -2.5px;
            line-height: 0.98;
        }

        .details-metadata {
            margin: 17px 0 0;
            color: rgba(255, 255, 255, 0.82);
            font-size: 14px;
            font-weight: 800;
            line-height: 1.55;
        }

        .details-description {
            margin: 22px 0 0;
            color: rgba(255, 255, 255, 0.76);
            font-size: 15px;
            font-weight: 600;
            line-height: 1.65;
        }

        .details-actions {
            display: flex;
            gap: 11px;
            margin-top: 24px;
        }

        .details-primary-button,
        .details-secondary-button {
            flex: 1;
            min-height: 56px;
            padding: 0 15px;
            border: none;
            border-radius: 14px;
            cursor: pointer;
            font-family: inherit;
            font-size: 15px;
            font-weight: 900;
        }

        .details-primary-button {
            background: #ffffff;
            color: #050505;
        }

        .details-secondary-button {
            background: rgba(255, 255, 255, 0.30);
            color: #ffffff;
            backdrop-filter: blur(12px);
        }

        @media (min-width: 760px) {
            .details-overlay {
                align-items: center;
            }

            .details-content {
                padding:
                    110px
                    34px
                    46px;
            }

            .details-title {
                font-size: 72px;
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
