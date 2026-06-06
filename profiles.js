/*
 * =========================================================
 * VEICLOUD WEB
 * Selección de perfiles
 * =========================================================
 *
 * Este archivo:
 * - solicita los perfiles reales al servidor de Render
 * - muestra avatar y nombre
 * - guarda el perfil seleccionado
 * - cierra la sesión correctamente
 */

document.addEventListener(
    "DOMContentLoaded",
    () => {
        const profilesGrid =
            document.getElementById(
                "profiles-grid"
            );

        const profilesMessage =
            document.getElementById(
                "profiles-message"
            );

        const logoutButton =
            document.getElementById(
                "logout-button"
            );

        if (
            !profilesGrid ||
            !profilesMessage ||
            !logoutButton
        ) {
            console.error(
                "Faltan elementos necesarios en profiles.html."
            );

            return;
        }

        loadProfiles(
            profilesGrid,
            profilesMessage
        );

        logoutButton.addEventListener(
            "click",
            () => {
                logout(
                    logoutButton,
                    profilesMessage
                );
            }
        );
    }
);

/*
 * =========================================================
 * CARGAR PERFILES
 * =========================================================
 */

async function loadProfiles(
    profilesGrid,
    profilesMessage
) {
    showProfilesMessage(
        profilesMessage,
        "Cargando tus perfiles...",
        "normal"
    );

    profilesGrid.replaceChildren();

    try {
        const response =
            await fetch(
                "/api/profiles",
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
         * Si la sesión venció, regresamos al login.
         */
        if (
            response.status === 401
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
                "No fue posible cargar tus perfiles."
            );
        }

        const profiles =
            Array.isArray(
                data.profiles
            )
                ? data.profiles
                : [];

        if (
            profiles.length === 0
        ) {
            showProfilesMessage(
                profilesMessage,
                "Esta cuenta todavía no tiene perfiles creados.",
                "error"
            );

            return;
        }

        profiles.forEach(
            (profile) => {
                const profileCard =
                    createProfileCard(
                        profile,
                        profilesMessage
                    );

                profilesGrid.appendChild(
                    profileCard
                );
            }
        );

        hideProfilesMessage(
            profilesMessage
        );
    } catch (
        error
    ) {
        console.error(
            "Error cargando perfiles:",
            error
        );

        showProfilesMessage(
            profilesMessage,
            error.message ||
            "No fue posible cargar tus perfiles.",
            "error"
        );
    }
}

/*
 * =========================================================
 * CREAR TARJETA INDIVIDUAL
 * =========================================================
 */

function createProfileCard(
    profile,
    profilesMessage
) {
    const normalizedProfile =
        normalizeProfile(
            profile
        );

    const card =
        document.createElement(
            "button"
        );

    card.type =
        "button";

    card.className =
        "profile-card";

    card.setAttribute(
        "aria-label",
        `Continuar como ${normalizedProfile.name}`
    );

    const avatarWrapper =
        document.createElement(
            "span"
        );

    avatarWrapper.className =
        "profile-avatar-wrapper";

    if (
        normalizedProfile.iconUrl
    ) {
        const avatarImage =
            document.createElement(
                "img"
            );

        avatarImage.className =
            "profile-avatar";

        avatarImage.src =
            normalizedProfile.iconUrl;

        avatarImage.alt =
            normalizedProfile.name;

        avatarImage.loading =
            "lazy";

        /*
         * Si la imagen falla, mostramos la inicial.
         */
        avatarImage.addEventListener(
            "error",
            () => {
                avatarWrapper.replaceChildren(
                    createFallbackAvatar(
                        normalizedProfile.name
                    )
                );
            }
        );

        avatarWrapper.appendChild(
            avatarImage
        );
    } else {
        avatarWrapper.appendChild(
            createFallbackAvatar(
                normalizedProfile.name
            )
        );
    }

    const profileName =
        document.createElement(
            "span"
        );

    profileName.className =
        "profile-name";

    profileName.textContent =
        normalizedProfile.name;

    card.appendChild(
        avatarWrapper
    );

    card.appendChild(
        profileName
    );

    card.addEventListener(
        "click",
        () => {
            selectProfile(
                normalizedProfile,
                card,
                profilesMessage
            );
        }
    );

    return card;
}

/*
 * =========================================================
 * AVATAR DE RESPALDO
 * =========================================================
 */

function createFallbackAvatar(
    profileName
) {
    const fallback =
        document.createElement(
            "span"
        );

    fallback.className =
        "profile-avatar-fallback";

    fallback.textContent =
        getProfileInitial(
            profileName
        );

    return fallback;
}

function getProfileInitial(
    profileName
) {
    const cleanName =
        String(
            profileName ||
            ""
        ).trim();

    if (
        !cleanName
    ) {
        return "?";
    }

    return cleanName
        .charAt(0)
        .toUpperCase();
}

/*
 * =========================================================
 * NORMALIZAR DATOS
 * =========================================================
 */

function normalizeProfile(
    profile
) {
    return {
        id:
            String(
                profile?.id ||
                ""
            ),

        name:
            String(
                profile?.name ||
                "Perfil"
            ),

        iconUrl:
            isValidHttpsUrl(
                profile?.iconUrl
            )
                ? String(
                    profile.iconUrl
                )
                : "",

        isKids:
            Boolean(
                profile?.isKids
            )
    };
}

function isValidHttpsUrl(
    rawUrl
) {
    if (
        typeof rawUrl !==
        "string"
    ) {
        return false;
    }

    try {
        const parsedUrl =
            new URL(
                rawUrl
            );

        return (
            parsedUrl.protocol ===
            "https:"
        );
    } catch {
        return false;
    }
}

/*
 * =========================================================
 * SELECCIONAR PERFIL
 * =========================================================
 */

function selectProfile(
    profile,
    card,
    profilesMessage
) {
    if (
        !profile.id
    ) {
        showProfilesMessage(
            profilesMessage,
            "No fue posible seleccionar este perfil.",
            "error"
        );

        return;
    }

    /*
     * Guardamos solamente los datos visuales necesarios.
     *
     * No almacenamos tokens ni contraseñas en el navegador.
     */
    const selectedProfile = {
        id:
            profile.id,

        name:
            profile.name,

        iconUrl:
            profile.iconUrl,

        isKids:
            profile.isKids
    };

    localStorage.setItem(
        "veicloud_selected_profile",
        JSON.stringify(
            selectedProfile
        )
    );

    disableProfileCards();

    card.classList.add(
        "selected"
    );

    showProfilesMessage(
        profilesMessage,
        `Entrando como ${profile.name}...`,
        "success"
    );

    /*
     * Esta será la próxima pantalla que crearemos.
     */
    window.setTimeout(
        () => {
            window.location.assign(
                "/home.html"
            );
        },
        650
    );
}

function disableProfileCards() {
    const cards =
        document.querySelectorAll(
            ".profile-card"
        );

    cards.forEach(
        (card) => {
            card.disabled =
                true;
        }
    );
}

/*
 * =========================================================
 * CERRAR SESIÓN
 * =========================================================
 */

async function logout(
    logoutButton,
    profilesMessage
) {
    logoutButton.disabled =
        true;

    logoutButton.textContent =
        "Cerrando sesión...";

    showProfilesMessage(
        profilesMessage,
        "Cerrando tu sesión...",
        "normal"
    );

    try {
        await fetch(
            "/api/auth/logout",
            {
                method:
                    "POST",

                credentials:
                    "same-origin",

                headers: {
                    Accept:
                        "application/json"
                }
            }
        );
    } catch (
        error
    ) {
        console.error(
            "Error cerrando sesión:",
            error
        );
    } finally {
        localStorage.removeItem(
            "veicloud_selected_profile"
        );

        window.location.replace(
            "/login.html"
        );
    }
}

/*
 * =========================================================
 * MENSAJES
 * =========================================================
 */

function showProfilesMessage(
    element,
    text,
    type
) {
    element.textContent =
        text;

    element.classList.remove(
        "error",
        "success"
    );

    if (
        type ===
        "error"
    ) {
        element.classList.add(
            "error"
        );
    }

    if (
        type ===
        "success"
    ) {
        element.classList.add(
            "success"
        );
    }

    element.hidden =
        false;
}

function hideProfilesMessage(
    element
) {
    element.textContent =
        "";

    element.classList.remove(
        "error",
        "success"
    );

    element.hidden =
        true;
}

/*
 * =========================================================
 * LEER RESPUESTAS JSON
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
