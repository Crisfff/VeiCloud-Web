/*
 * =========================================================
 * VEICLOUD WEB
 * HOME CON CATÁLOGO REAL DESDE FIREBASE
 * =========================================================
 *
 * Este archivo:
 * - recupera el perfil elegido
 * - solicita el catálogo privado al servidor de Render
 * - muestra el contenido destacado
 * - dibuja las filas reales de películas y series
 * - crea el menú dinámico de categorías
 * - elimina las tarjetas de demostración
 *
 * Los enlaces de reproducción no se exponen todavía.
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
         * Si el usuario entra directamente en home.html
         * sin escoger perfil, regresamos a profiles.html.
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

        prepareHomeSections();

        bindTopbarButtons();

        bindCategoryNavigation();

        bindFeaturedButtons();

        await loadCatalog();
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
 * PREPARAR SECCIONES DEL HOME
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

/*
 * Oculta la fila de demostración.
 *
 * Más adelante la conectaremos al progreso real
 * guardado por cada perfil.
 */
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

        /*
         * Si la sesión ya no es válida,
         * volvemos a iniciar sesión.
         */
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
            "Error cargando el catálogo:",
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

    playButton?.addEventListener(
        "click",
        () => {
            const featured =
                currentCatalog.featured;

            if (
                !featured
            ) {
                return;
            }

            openContentDetails(
                featured
            );
        }
    );

    listButton?.addEventListener(
        "click",
        () => {
            const featured =
                currentCatalog.featured;

            if (
                !featured
            ) {
                return;
            }

            toggleMyList(
                featured
            );
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
 * PANTALLA DE DETALLES
 * =========================================================
 *
 * La crearemos en el próximo paso.
 */

function openContentDetails(
    item
) {
    const query =
        new URLSearchParams(
            {
                id:
                    item.id,

                type:
                    item.type ||
                    ""
            }
        );

    window.location.assign(
        `/detail.html?${query.toString()}`
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
        () => {
            toggleCategoriesMenu();
        }
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
    const menu =
        document.getElementById(
            "categories-menu"
        );

    menu?.classList.toggle(
        "visible"
    );
}

function showCategorySection(
    category
) {
    const normalizedCategory =
        category
            .toLowerCase();

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

    const categorySection =
        document.getElementById(
            "selected-category-section"
        );

    const categoryTitle =
        categorySection
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
 *
 * De momento se guarda en el navegador.
 * Más adelante podemos sincronizarla con Firebase.
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
        readMyList().some(
            (
                savedItem
            ) =>
                savedItem.id ===
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
 * TARJETAS DE ESTADO
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
 * ESTILOS COMPLEMENTARIOS GENERADOS POR JAVASCRIPT
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
            transition:
                background 180ms ease,
                border-color 180ms ease,
                transform 180ms ease;
        }

        .category-chip:hover {
            border-color: rgba(255, 255, 255, 0.22);
            background: rgba(255, 255, 255, 0.12);
            transform: translateY(-2px);
        }

        .categories-empty {
            margin: 0;
            color: rgba(255, 255, 255, 0.60);
            font-size: 13px;
            font-weight: 700;
        }

        @media (max-width: 600px) {
            .categories-menu {
                margin-top: 15px;
                padding: 13px;
                border-radius: 16px;
            }

            .category-chip {
                padding: 9px 11px;
                font-size: 12px;
            }

            .catalog-status-card {
                min-width: 210px;
                min-height: 100px;
                font-size: 13px;
            }
        }
        `;

    document.head.appendChild(
        style
    );
}

/*
 * =========================================================
 * LEER JSON DE FORMA SEGURA
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
