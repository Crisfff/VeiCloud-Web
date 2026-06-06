/*
 * =========================================================
 * VEICLOUD WEB
 * Carousel de una sola portada horizontal desde TMDB
 * =========================================================
 */

const TMDB_BACKDROPS_ENDPOINT =
    "/api/tmdb/backdrops?type=all&limit=8";

const BACKDROPS_REFRESH_INTERVAL_MS =
    5 * 60 * 1000;

const CAROUSEL_ROTATION_INTERVAL_MS =
    8000;

let currentBackdrops = [];
let currentIndex = 0;

let rotationTimer = null;
let refreshTimer = null;

let heroElement = null;
let slideA = null;
let slideB = null;
let isSlideAActive = true;

/*
 * Arranque principal
 */
document.addEventListener(
    "DOMContentLoaded",
    async () => {
        heroElement =
            document.querySelector(".hero");

        if (!heroElement) {
            console.error(
                "No se encontró la sección .hero"
            );
            return;
        }

        injectCarouselStyles();
        createCarouselLayers();

        await refreshTmdbBackdrops();

        refreshTimer =
            window.setInterval(
                refreshTmdbBackdrops,
                BACKDROPS_REFRESH_INTERVAL_MS
            );

        rotationTimer =
            window.setInterval(
                goToNextBackdrop,
                CAROUSEL_ROTATION_INTERVAL_MS
            );
    }
);

/*
 * Carga nuevas portadas desde el servidor
 */
async function refreshTmdbBackdrops() {
    try {
        const response =
            await fetch(
                TMDB_BACKDROPS_ENDPOINT,
                {
                    method: "GET",
                    cache: "no-store",
                    headers: {
                        Accept: "application/json"
                    }
                }
            );

        if (!response.ok) {
            throw new Error(
                `Error HTTP ${response.status}`
            );
        }

        const data =
            await response.json();

        const validatedBackdrops =
            normalizeBackdrops(
                data.images
            );

        if (
            validatedBackdrops.length === 0
        ) {
            throw new Error(
                "No llegaron imágenes válidas desde TMDB."
            );
        }

        currentBackdrops =
            validatedBackdrops;

        currentIndex = 0;

        await preloadImages(
            currentBackdrops
        );

        showBackdropAtIndex(
            currentIndex,
            true
        );

        console.log(
            "Carousel de TMDB cargado correctamente."
        );
    } catch (error) {
        console.error(
            "No fue posible cargar las portadas de TMDB:",
            error
        );
    }
}

/*
 * Conserva solamente URLs válidas del CDN oficial de TMDB
 */
function normalizeBackdrops(rawImages) {
    if (!Array.isArray(rawImages)) {
        return [];
    }

    const usedUrls =
        new Set();

    return rawImages
        .map((item) => {
            if (
                typeof item?.backdropUrl !==
                "string"
            ) {
                return null;
            }

            try {
                const imageUrl =
                    new URL(
                        item.backdropUrl
                    );

                if (
                    imageUrl.protocol !==
                        "https:" ||
                    imageUrl.hostname !==
                        "image.tmdb.org"
                ) {
                    return null;
                }

                if (
                    usedUrls.has(
                        imageUrl.href
                    )
                ) {
                    return null;
                }

                usedUrls.add(
                    imageUrl.href
                );

                return {
                    id:
                        item.id ?? "",

                    type:
                        item.type ??
                        "unknown",

                    title:
                        item.title ??
                        "Contenido de VeiCloud",

                    backdropUrl:
                        imageUrl.href
                };
            } catch {
                return null;
            }
        })
        .filter(Boolean);
}

/*
 * Precarga las imágenes
 */
async function preloadImages(backdrops) {
    const tasks =
        backdrops.map((item) => {
            return new Promise(
                (resolve) => {
                    const image =
                        new Image();

                    image.onload =
                        resolve;

                    image.onerror =
                        resolve;

                    image.src =
                        item.backdropUrl;
                }
            );
        });

    await Promise.all(tasks);
}

/*
 * Avanza al siguiente fondo
 */
function goToNextBackdrop() {
    if (
        currentBackdrops.length <= 1
    ) {
        return;
    }

    currentIndex =
        (currentIndex + 1) %
        currentBackdrops.length;

    showBackdropAtIndex(
        currentIndex,
        false
    );
}

/*
 * Muestra una portada específica
 */
function showBackdropAtIndex(
    index,
    immediate
) {
    if (
        !currentBackdrops[index] ||
        !slideA ||
        !slideB
    ) {
        return;
    }

    const backdrop =
        currentBackdrops[index];

    const backgroundValue =
        buildSlideBackground(
            backdrop.backdropUrl
        );

    const activeSlide =
        isSlideAActive
            ? slideA
            : slideB;

    const hiddenSlide =
        isSlideAActive
            ? slideB
            : slideA;

    hiddenSlide.style.backgroundImage =
        backgroundValue;

    hiddenSlide.setAttribute(
        "aria-label",
        backdrop.title
    );

    if (immediate) {
        activeSlide.classList.remove(
            "active"
        );

        hiddenSlide.classList.add(
            "active"
        );

        isSlideAActive =
            hiddenSlide === slideA;

        return;
    }

    hiddenSlide.classList.add(
        "active"
    );

    activeSlide.classList.remove(
        "active"
    );

    isSlideAActive =
        hiddenSlide === slideA;
}

/*
 * Fondo visual de cada slide
 */
function buildSlideBackground(
    imageUrl
) {
    return `
        linear-gradient(
            90deg,
            rgba(5, 5, 5, 0.98) 0%,
            rgba(5, 5, 5, 0.95) 18%,
            rgba(5, 5, 5, 0.84) 34%,
            rgba(5, 5, 5, 0.46) 58%,
            rgba(5, 5, 5, 0.20) 100%
        ),
        linear-gradient(
            0deg,
            rgba(5, 5, 5, 0.98) 0%,
            rgba(5, 5, 5, 0.55) 16%,
            rgba(5, 5, 5, 0.08) 46%,
            rgba(5, 5, 5, 0.28) 100%
        ),
        url("${imageUrl}")
    `;
}

/*
 * Crea dos capas para hacer transición suave
 */
function createCarouselLayers() {
    const carouselContainer =
        document.createElement("div");

    carouselContainer.className =
        "tmdb-hero-carousel";

    slideA =
        document.createElement("div");
    slideB =
        document.createElement("div");

    slideA.className =
        "tmdb-hero-slide";
    slideB.className =
        "tmdb-hero-slide";

    carouselContainer.appendChild(
        slideA
    );
    carouselContainer.appendChild(
        slideB
    );

    heroElement.insertBefore(
        carouselContainer,
        heroElement.firstChild
    );
}

/*
 * Inyecta estilos del carousel
 */
function injectCarouselStyles() {
    let styleElement =
        document.getElementById(
            "tmdb-carousel-style"
        );

    if (styleElement) {
        styleElement.remove();
    }

    styleElement =
        document.createElement(
            "style"
        );

    styleElement.id =
        "tmdb-carousel-style";

    styleElement.textContent =
        `
        .hero {
            position: relative !important;
            overflow: hidden !important;
            isolation: isolate !important;
            background: #050505 !important;
        }

        .hero::before,
        .hero::after {
            content: none !important;
            background: none !important;
        }

        .tmdb-hero-carousel {
            position: absolute;
            inset: 0;
            z-index: 0;
            pointer-events: none;
        }

        .tmdb-hero-slide {
            position: absolute;
            inset: 0;

            opacity: 0;
            transition: opacity 1000ms ease;

            background-repeat: no-repeat;
            background-size: cover;
            background-position: center center;

            transform: scale(1.03);
            filter:
                saturate(0.96)
                contrast(1.04)
                brightness(0.92);
        }

        .tmdb-hero-slide.active {
            opacity: 1;
        }

        .hero-overlay {
            position: absolute;
            inset: 0;
            z-index: 1;
            pointer-events: none;

            background:
                radial-gradient(
                    circle at 72% 38%,
                    rgba(229, 9, 20, 0.10),
                    transparent 34rem
                ),
                linear-gradient(
                    180deg,
                    rgba(5, 5, 5, 0.04) 0%,
                    rgba(5, 5, 5, 0.08) 55%,
                    rgba(5, 5, 5, 0.72) 100%
                ) !important;
        }

        .hero-content {
            position: relative;
            z-index: 2;
        }

        @media (max-width: 900px) {
            .tmdb-hero-slide {
                background-position: center center;
            }
        }

        @media (max-width: 600px) {
            .tmdb-hero-slide {
                background-image:
                    linear-gradient(
                        0deg,
                        rgba(5, 5, 5, 0.98) 0%,
                        rgba(5, 5, 5, 0.82) 28%,
                        rgba(5, 5, 5, 0.22) 100%
                    ),
                    linear-gradient(
                        90deg,
                        rgba(5, 5, 5, 0.78) 0%,
                        rgba(5, 5, 5, 0.38) 45%,
                        rgba(5, 5, 5, 0.10) 100%
                    );
            }
        }
        `;

    document.head.appendChild(
        styleElement
    );
}
