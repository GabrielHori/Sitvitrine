/* =====================================================
   HORIZON IT
   JavaScript principal
   =====================================================

   SOMMAIRE :
   -----------------------------------------------------
   01. Mode clair / sombre
   02. Menu mobile
   03. Retour en haut
   04. Animations au scroll
   05. Formulaire de contact
   06. Avis clients
   07. Sécurité HTML
   ===================================================== */


document.addEventListener("DOMContentLoaded", () => {


    /* =================================================
       01. MODE CLAIR / SOMBRE
       ================================================= */

    const themeToggle =
        document.getElementById("theme-toggle");

    const themeIcon =
        document.querySelector(".theme-icon");


    /*
     * Récupération du thème sauvegardé.
     *
     * Si aucun thème n'a encore été choisi,
     * on utilise le thème clair par défaut.
     */

    const savedTheme =
        localStorage.getItem("horizon-theme");


    /*
     * Détection du thème du système.
     *
     * Cela permet de respecter automatiquement
     * le thème Windows/macOS si aucun choix
     * n'a encore été enregistré.
     */

    const systemPrefersDark =
        window.matchMedia &&
        window.matchMedia(
            "(prefers-color-scheme: dark)"
        ).matches;


    let currentTheme =
        savedTheme ||
        (systemPrefersDark ? "dark" : "light");


    /*
     * Fonction permettant d'appliquer le thème.
     */

    function applyTheme(theme) {

        document.documentElement.setAttribute(
            "data-theme",
            theme
        );


        /*
         * Mise à jour de l'icône.
         *
         * Mode sombre → soleil
         * Mode clair  → lune
         */

        if (themeIcon) {

            themeIcon.textContent =
                theme === "dark"
                    ? "☀"
                    : "☾";

        }


        /*
         * Accessibilité du bouton.
         */

        if (themeToggle) {

            const isDark =
                theme === "dark";


            themeToggle.setAttribute(
                "aria-label",
                isDark
                    ? "Activer le mode clair"
                    : "Activer le mode sombre"
            );


            themeToggle.setAttribute(
                "title",
                isDark
                    ? "Mode clair"
                    : "Mode sombre"
            );


            themeToggle.setAttribute(
                "aria-pressed",
                String(isDark)
            );

        }

    }


    /*
     * Application initiale du thème.
     */

    applyTheme(currentTheme);


    /*
     * Bouton mode nuit.
     */

    if (themeToggle) {

        themeToggle.addEventListener(
            "click",
            () => {

                currentTheme =
                    currentTheme === "dark"
                        ? "light"
                        : "dark";


                /*
                 * Sauvegarde du choix.
                 */

                localStorage.setItem(
                    "horizon-theme",
                    currentTheme
                );


                /*
                 * Application immédiate.
                 */

                applyTheme(currentTheme);

            }
        );

    }


    /* =================================================
       02. MENU MOBILE
       ================================================= */

    const menuButton =
        document.getElementById(
            "mobile-menu-btn"
        );


    const navMenu =
        document.getElementById(
            "nav-menu"
        );


    if (menuButton && navMenu) {

        /*
         * Ouverture / fermeture du menu.
         */

        menuButton.addEventListener(
            "click",
            () => {

                const isOpen =
                    navMenu.classList.toggle(
                        "open"
                    );


                menuButton.setAttribute(
                    "aria-expanded",
                    String(isOpen)
                );

            }
        );


        /*
         * Fermeture du menu après avoir
         * cliqué sur un lien.
         */

        navMenu
            .querySelectorAll("a")
            .forEach(link => {

                link.addEventListener(
                    "click",
                    () => {

                        navMenu.classList.remove(
                            "open"
                        );


                        menuButton.setAttribute(
                            "aria-expanded",
                            "false"
                        );

                    }
                );

            });


        /*
         * Fermeture du menu lorsqu'on clique
         * en dehors de celui-ci.
         */

        document.addEventListener(
            "click",
            (event) => {

                const clickedInsideMenu =
                    navMenu.contains(
                        event.target
                    );


                const clickedButton =
                    menuButton.contains(
                        event.target
                    );


                if (
                    !clickedInsideMenu &&
                    !clickedButton
                ) {

                    navMenu.classList.remove(
                        "open"
                    );


                    menuButton.setAttribute(
                        "aria-expanded",
                        "false"
                    );

                }

            }
        );

    }


    /* =================================================
       03. RETOUR EN HAUT
       ================================================= */

    const backToTop =
        document.getElementById(
            "back-to-top"
        );


    if (backToTop) {

        /*
         * Affichage du bouton après
         * environ 600px de scroll.
         */

        window.addEventListener(
            "scroll",
            () => {

                if (
                    window.scrollY > 600
                ) {

                    backToTop.classList.add(
                        "visible"
                    );

                } else {

                    backToTop.classList.remove(
                        "visible"
                    );

                }

            },
            {
                passive: true
            }
        );


        /*
         * Retour en haut.
         */

        backToTop.addEventListener(
            "click",
            () => {

                window.scrollTo({

                    top: 0,

                    behavior: "smooth"

                });

            }
        );

    }


    /* =================================================
       04. ANIMATIONS AU SCROLL
       ================================================= */

    const revealElements =
        document.querySelectorAll(
            `
            .problem-card,
            .service-card,
            .process-step,
            .price-card,
            .trust-point,
            .portfolio-card,
            .portfolio-placeholder,
            .contact-form-card
            `
        );


    /*
     * On vérifie si le navigateur supporte
     * IntersectionObserver et si l'utilisateur
     * n'a pas demandé de réduire les animations.
     */

    if (
        "IntersectionObserver" in window &&
        !window.matchMedia(
            "(prefers-reduced-motion: reduce)"
        ).matches
    ) {

        revealElements.forEach(
            element => {

                element.style.opacity =
                    "0";

                element.style.transform =
                    "translateY(20px)";

                element.style.transition =
                    "opacity 600ms ease, transform 600ms ease";

            }
        );


        const observer =
            new IntersectionObserver(
                (
                    entries,
                    observer
                ) => {

                    entries.forEach(
                        entry => {

                            if (
                                !entry.isIntersecting
                            ) {

                                return;

                            }


                            entry.target.style.opacity =
                                "1";


                            entry.target.style.transform =
                                "translateY(0)";


                            observer.unobserve(
                                entry.target
                            );

                        }
                    );

                },
                {
                    threshold: 0.1
                }
            );


        revealElements.forEach(
            element =>
                observer.observe(element)
        );

    }


    /* =================================================
       05. FORMULAIRE DE CONTACT
       ================================================= */

    const contactForm =
        document.getElementById(
            "contact-form"
        );


    const formMessage =
        document.getElementById(
            "form-message"
        );


    if (contactForm) {

        contactForm.addEventListener(
            "submit",
            async event => {

                event.preventDefault();


                const submitButton =
                    contactForm.querySelector(
                        "button[type='submit']"
                    );


                /*
                 * Si aucun bouton submit n'existe,
                 * on évite une erreur JavaScript.
                 */

                if (!submitButton) {
                    return;
                }


                const originalText =
                    submitButton.innerHTML;


                const formData =
                    new FormData(
                        contactForm
                    );


                /*
                 * Protection honeypot
                 * contre certains robots.
                 */

                const honey =
                    formData.get("_honey");


                if (honey) {
                    return;
                }


                /*
                 * Préparation des données.
                 */

                const payload = {

                    name:
                        formData.get(
                            "user_name"
                        ),

                    email:
                        formData.get(
                            "user_email"
                        ),

                    phone:
                        formData.get(
                            "user_phone"
                        ),

                    service:
                        formData.get(
                            "service"
                        ),

                    message:
                        formData.get(
                            "message"
                        ),

                    _honey:
                        honey || ""

                };


                /*
                 * Désactivation du bouton
                 * pendant l'envoi.
                 */

                submitButton.disabled =
                    true;


                submitButton.textContent =
                    "Envoi en cours...";


                /*
                 * Réinitialisation du message.
                 */

                if (formMessage) {

                    formMessage.textContent =
                        "";

                    formMessage.className =
                        "form-message";

                }


                try {

                    const response =
                        await fetch(
                            "/.netlify/functions/contact",
                            {
                                method: "POST",

                                headers: {
                                    "Content-Type":
                                        "application/json"
                                },

                                body:
                                    JSON.stringify(
                                        payload
                                    )
                            }
                        );


                    let data = {};


                    try {

                        data =
                            await response.json();

                    } catch {

                        data = {};

                    }


                    /*
                     * Gestion des erreurs HTTP.
                     */

                    if (!response.ok) {

                        throw new Error(
                            data.error ||
                            "Une erreur est survenue."
                        );

                    }


                    /*
                     * Message de succès.
                     */

                    if (formMessage) {

                        formMessage.textContent =
                            "✓ Votre demande a bien été envoyée. Je reviendrai vers vous rapidement.";

                        formMessage.classList.add(
                            "success"
                        );

                    }


                    /*
                     * Nettoyage du formulaire.
                     */

                    contactForm.reset();


                } catch (error) {

                    console.error(
                        "Erreur formulaire :",
                        error
                    );


                    /*
                     * Message d'erreur.
                     */

                    if (formMessage) {

                        formMessage.textContent =
                            "Impossible d'envoyer votre demande. Vous pouvez également me contacter directement par téléphone.";

                        formMessage.classList.add(
                            "error"
                        );

                    }

                } finally {

                    /*
                     * Réactivation du bouton.
                     */

                    submitButton.disabled =
                        false;


                    submitButton.innerHTML =
                        originalText;

                }

            }
        );

    }


    /* =================================================
       06. AVIS CLIENTS
       ================================================= */

    const reviewsContainer =
        document.getElementById(
            "reviews-list"
        );


    async function loadReviews() {

        if (!reviewsContainer) {
            return;
        }


        try {

            const response =
                await fetch(
                    "/.netlify/functions/reviews"
                );


            if (!response.ok) {
                return;
            }


            const reviews =
                await response.json();


            /*
             * S'il n'y a aucun avis,
             * on conserve le contenu HTML
             * prévu par défaut.
             */

            if (
                !Array.isArray(reviews) ||
                reviews.length === 0
            ) {

                return;

            }


            reviewsContainer.innerHTML =
                reviews
                    .map(review => {

                        /*
                         * On limite la note entre
                         * 1 et 5 étoiles.
                         */

                        const rating =
                            Math.max(
                                1,
                                Math.min(
                                    5,
                                    Number(
                                        review.rating
                                    ) || 5
                                )
                            );


                        const stars =
                            "★".repeat(
                                rating
                            ) +
                            "☆".repeat(
                                5 - rating
                            );


                        /*
                         * Récupération de la date.
                         */

                        const date =
                            review.created_at ||
                            review.date;


                        let formattedDate =
                            "";


                        if (date) {

                            const parsedDate =
                                new Date(date);


                            /*
                             * On vérifie que la date
                             * est réellement valide.
                             */

                            if (
                                !Number.isNaN(
                                    parsedDate.getTime()
                                )
                            ) {

                                formattedDate =
                                    parsedDate
                                        .toLocaleDateString(
                                            "fr-FR"
                                        );

                            }

                        }


                        return `

                            <article class="review-card">

                                <div class="review-header">

                                    <strong class="review-client">
                                        ${escapeHTML(
                                            review.name ||
                                            "Client"
                                        )}
                                    </strong>

                                    <span
                                        class="review-rating"
                                        aria-label="${rating} sur 5"
                                    >
                                        ${stars}
                                    </span>

                                </div>


                                ${
                                    review.service
                                        ? `
                                            <div class="review-service">
                                                ${escapeHTML(
                                                    review.service
                                                )}
                                            </div>
                                          `
                                        : ""
                                }


                                <p class="review-text">
                                    "${escapeHTML(
                                        review.text ||
                                        ""
                                    )}"
                                </p>


                                ${
                                    formattedDate
                                        ? `
                                            <div class="review-date">
                                                ${formattedDate}
                                            </div>
                                          `
                                        : ""
                                }

                            </article>

                        `;

                    })
                    .join("");


        } catch (error) {

            console.warn(
                "Impossible de charger les avis.",
                error
            );

        }

    }


    /*
     * Chargement des avis.
     */

    loadReviews();


    /* =================================================
       07. ESCAPE HTML
       ================================================= */

    /*
     * Cette fonction empêche du HTML ou du JavaScript
     * injecté dans les avis clients d'être interprété
     * par le navigateur.
     */

    function escapeHTML(value) {

        return String(value)

            .replaceAll(
                "&",
                "&amp;"
            )

            .replaceAll(
                "<",
                "&lt;"
            )

            .replaceAll(
                ">",
                "&gt;"
            )

            .replaceAll(
                '"',
                "&quot;"
            )

            .replaceAll(
                "'",
                "&#039;"
            );

    }


});