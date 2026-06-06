/*
 * =========================================================
 * VEICLOUD WEB
 * Inicio de sesión
 * =========================================================
 *
 * Este archivo:
 * - permite mostrar u ocultar la contraseña
 * - envía correo y contraseña al servidor de Render
 * - muestra mensajes claros de error
 * - redirige hacia profiles.html cuando la sesión es válida
 */

document.addEventListener(
    "DOMContentLoaded",
    () => {
        const loginForm =
            document.getElementById(
                "login-form"
            );

        const emailInput =
            document.getElementById(
                "login-email"
            );

        const passwordInput =
            document.getElementById(
                "login-password"
            );

        const passwordToggle =
            document.getElementById(
                "password-toggle"
            );

        const loginMessage =
            document.getElementById(
                "login-message"
            );

        const submitButton =
            loginForm?.querySelector(
                'button[type="submit"]'
            );

        /*
         * Si algún elemento falta en login.html,
         * detenemos el script para evitar errores silenciosos.
         */
        if (
            !loginForm ||
            !emailInput ||
            !passwordInput ||
            !passwordToggle ||
            !loginMessage ||
            !submitButton
        ) {
            console.error(
                "No se encontraron todos los elementos del formulario."
            );

            return;
        }

        /*
         * Mostrar u ocultar contraseña.
         */
        passwordToggle.addEventListener(
            "click",
            () => {
                const isHidden =
                    passwordInput.type ===
                    "password";

                passwordInput.type =
                    isHidden
                        ? "text"
                        : "password";

                passwordToggle.textContent =
                    isHidden
                        ? "Ocultar"
                        : "Ver";

                passwordToggle.setAttribute(
                    "aria-label",
                    isHidden
                        ? "Ocultar contraseña"
                        : "Mostrar contraseña"
                );

                passwordInput.focus();
            }
        );

        /*
         * Envía las credenciales al servidor.
         */
        loginForm.addEventListener(
            "submit",
            async (
                event
            ) => {
                event.preventDefault();

                hideMessage(
                    loginMessage
                );

                const email =
                    emailInput
                        .value
                        .trim()
                        .toLowerCase();

                const password =
                    passwordInput
                        .value;

                if (
                    !email ||
                    !password
                ) {
                    showMessage(
                        loginMessage,
                        "Escribe tu correo y contraseña.",
                        "error"
                    );

                    return;
                }

                setLoadingState(
                    submitButton,
                    true
                );

                let loginWasSuccessful =
                    false;

                try {
                    const response =
                        await fetch(
                            "/api/auth/login",
                            {
                                method:
                                    "POST",

                                credentials:
                                    "same-origin",

                                headers: {
                                    "Content-Type":
                                        "application/json",

                                    Accept:
                                        "application/json"
                                },

                                body:
                                    JSON.stringify(
                                        {
                                            email,
                                            password
                                        }
                                    )
                            }
                        );

                    const data =
                        await readJsonSafely(
                            response
                        );

                    if (
                        !response.ok ||
                        !data?.ok
                    ) {
                        throw new Error(
                            data?.message ||
                            "No fue posible iniciar sesión."
                        );
                    }

                    loginWasSuccessful =
                        true;

                    showMessage(
                        loginMessage,
                        "Sesión iniciada. Cargando tus perfiles...",
                        "success"
                    );

                    window.setTimeout(
                        () => {
                            window.location.assign(
                                data.redirectUrl ||
                                "/profiles.html"
                            );
                        },
                        500
                    );
                } catch (
                    error
                ) {
                    console.error(
                        "Error iniciando sesión:",
                        error
                    );

                    showMessage(
                        loginMessage,
                        error.message ||
                        "No fue posible conectar con el servidor.",
                        "error"
                    );
                } finally {
                    if (
                        !loginWasSuccessful
                    ) {
                        setLoadingState(
                            submitButton,
                            false
                        );
                    }
                }
            }
        );
    }
);

/*
 * Lee una respuesta JSON sin provocar otro error
 * si el servidor devuelve una respuesta inesperada.
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

/*
 * Activa o desactiva el estado de carga del botón.
 */
function setLoadingState(
    button,
    isLoading
) {
    button.disabled =
        isLoading;

    button.setAttribute(
        "aria-busy",
        String(
            isLoading
        )
    );

    button.textContent =
        isLoading
            ? "Iniciando sesión..."
            : "Iniciar sesión";
}

/*
 * Muestra mensajes de error o confirmación.
 */
function showMessage(
    element,
    text,
    type
) {
    element.textContent =
        text;

    element.classList.remove(
        "success"
    );

    element.classList.add(
        "visible"
    );

    if (
        type ===
        "success"
    ) {
        element.classList.add(
            "success"
        );
    }
}

/*
 * Limpia el mensaje anterior.
 */
function hideMessage(
    element
) {
    element.textContent =
        "";

    element.classList.remove(
        "visible",
        "success"
    );
}
