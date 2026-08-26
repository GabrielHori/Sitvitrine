/* ============================================================
   HORIZON IT — ADMIN.JS

   Compatible avec :
   /.netlify/functions/auth
   /.netlify/functions/admin-stats
   /.netlify/functions/admin-reviews
   /.netlify/functions/admin-leads
   ============================================================ */

(() => {

    "use strict";


    /* =========================================================
       01. ÉTAT GLOBAL
    ========================================================== */

    let authToken =
        localStorage.getItem("admin-token");

    let currentPanel =
        "dashboard";

    let allLeads = [];

    let allReviews = [];

    const SESSION_TIMEOUT =
        4 * 60 * 60 * 1000;


    /* =========================================================
       02. OUTILS
    ========================================================== */

    const $ = id =>
        document.getElementById(id);


    function escapeHTML(value) {

        return String(value ?? "")
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
    }


    function formatDate(value) {

        if (!value) {
            return "";
        }

        const date =
            new Date(value);

        if (Number.isNaN(date.getTime())) {
            return "";
        }

        return date.toLocaleString(
            "fr-FR",
            {
                dateStyle: "short",
                timeStyle: "short"
            }
        );
    }


    function formatPhone(phone) {

        if (!phone) {
            return "";
        }

        return String(phone)
            .trim()
            .replace(/\s+/g, " ");
    }


    function phoneHref(phone) {

        if (!phone) {
            return "#";
        }

        return "tel:" +
            String(phone)
                .replace(/[^\d+]/g, "");
    }


    function mailHref(email) {

        return email
            ? `mailto:${encodeURIComponent(email)}`
            : "#";
    }


    /* =========================================================
       03. TOAST
    ========================================================== */

    function toast(message, type = "info") {

        const container =
            $("toast-container");

        const el =
            document.createElement("div");

        const icons = {
            success: "✓",
            error: "!",
            info: "i"
        };

        el.className =
            `toast toast-${type}`;

        el.innerHTML = `
            <strong>${icons[type] || "i"}</strong>
            <span>${escapeHTML(message)}</span>
        `;

        container.appendChild(el);

        setTimeout(() => {

            el.remove();

        }, 3600);
    }


    /* =========================================================
       04. SESSION
    ========================================================== */

    function checkSession() {

        const loginTime =
            localStorage.getItem(
                "admin-login-time"
            );

        if (
            loginTime &&
            Date.now() -
                Number(loginTime) >
                SESSION_TIMEOUT
        ) {

            logout(
                "Session expirée, veuillez vous reconnecter."
            );

            return false;
        }

        return Boolean(authToken);
    }


    function showAdmin() {

        $("login-wrapper").style.display =
            "none";

        $("admin-app").style.display =
            "block";

        $("last-login").textContent =
            localStorage.getItem(
                "last-login"
            ) ||
            "Connexion actuelle";
    }


    function showLogin() {

        $("login-wrapper").style.display =
            "grid";

        $("admin-app").style.display =
            "none";
    }


    function logout(message = "") {

        localStorage.removeItem(
            "admin-token"
        );

        localStorage.removeItem(
            "admin-login-time"
        );

        authToken = null;

        showLogin();

        $("password").value = "";

        if (message) {
            toast(message, "error");
        }
    }


    /* =========================================================
       05. REQUÊTE API
    ========================================================== */

    async function api(
        endpoint,
        options = {}
    ) {

        if (!authToken) {
            throw new Error("Non authentifié");
        }

        const headers = {
            ...(options.body
                ? {
                    "Content-Type":
                        "application/json"
                }
                : {}),
            "Authorization":
                `Bearer ${authToken}`,
            ...(options.headers || {})
        };

        const response =
            await fetch(
                `/.netlify/functions/${endpoint}`,
                {
                    ...options,
                    headers
                }
            );

        if (response.status === 401) {

            logout(
                "Session expirée, veuillez vous reconnecter."
            );

            throw new Error(
                "Session expirée"
            );
        }

        let data = null;

        try {
            data =
                await response.json();
        } catch {
            data = null;
        }

        if (!response.ok) {

            throw new Error(
                data?.error ||
                "Une erreur est survenue."
            );
        }

        return data;
    }


    /* =========================================================
       06. CONNEXION
    ========================================================== */

    async function login() {

        const password =
            $("password").value.trim();

        const error =
            $("login-error");

        const button =
            $("btn-login");

        if (!password) {
            error.textContent =
                "Veuillez saisir votre mot de passe.";

            return;
        }

        button.disabled = true;

        button.textContent =
            "Connexion…";

        error.textContent = "";

        try {

            const response =
                await fetch(
                    "/.netlify/functions/auth",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify({
                                password
                            })
                    }
                );

            const data =
                await response.json();

            if (!response.ok) {

                throw new Error(
                    data.error ||
                    "Mot de passe incorrect."
                );
            }

            authToken =
                data.token;

            localStorage.setItem(
                "admin-token",
                authToken
            );

            localStorage.setItem(
                "admin-login-time",
                Date.now().toString()
            );

            localStorage.setItem(
                "last-login",
                new Date()
                    .toLocaleString(
                        "fr-FR"
                    )
            );

            showAdmin();

            await loadDashboard();

            toast(
                "Connexion réussie.",
                "success"
            );

        } catch (err) {

            error.textContent =
                err.message ||
                "Impossible de se connecter.";

        } finally {

            button.disabled = false;

            button.textContent =
                "Se connecter";
        }
    }


    /* =========================================================
       07. NAVIGATION
    ========================================================== */

    function openPanel(name) {

        if (!checkSession()) {
            return;
        }

        document
            .querySelectorAll(".panel")
            .forEach(panel => {

                panel.classList.toggle(
                    "active",
                    panel.id ===
                    `panel-${name}`
                );
            });

        document
            .querySelectorAll(
                ".nav-item[data-panel]"
            )
            .forEach(button => {

                button.classList.toggle(
                    "active",
                    button.dataset.panel ===
                    name
                );
            });

        currentPanel = name;

        closeMobileSidebar();

        if (name === "dashboard") {
            loadDashboard();
        }

        if (name === "leads") {
            loadLeads();
        }

        if (name === "planning") {
            loadPlanning();
        }

        if (name === "reviews") {
            loadReviews();
        }

        if (name === "settings") {
            loadSiteStats();
        }
    }


    function closeMobileSidebar() {

        $("sidebar")
            .classList.remove("open");

        $("sidebar-overlay")
            .classList.remove("open");
    }


    function toggleSidebar() {

        $("sidebar")
            .classList.toggle("open");

        $("sidebar-overlay")
            .classList.toggle("open");
    }


    /* =========================================================
       08. DASHBOARD
    ========================================================== */

    async function loadDashboard() {

        if (!checkSession()) {
            return;
        }

        try {

            const data =
                await api("admin-stats");

            $("s-total").textContent =
                data.reviews?.total ?? 0;

            $("s-approved").textContent =
                data.reviews?.approved ?? 0;

            $("s-pending").textContent =
                data.reviews?.pending ?? 0;

            $("s-avg").textContent =
                Number(
                    data.reviews?.avgRating ?? 0
                ).toFixed(1);

            $("s-leads").textContent =
                data.leads?.total ?? 0;

            $("s-leads-new").textContent =
                data.leads?.new ?? 0;

            updateBadge(
                "badge-pending",
                data.reviews?.pending ?? 0
            );

            updateBadge(
                "badge-leads",
                data.leads?.new ?? 0
            );

            displayRecent(
                data.recent || []
            );

            if (data.site) {

                $("input-pc").value =
                    data.site.pcBuilt ?? 0;

                $("input-clients").value =
                    data.site.happyClients ?? 0;

                $("input-response").value =
                    data.site.responseTime ?? 24;
            }

        } catch (error) {

            if (
                error.message !==
                "Session expirée"
            ) {

                toast(
                    "Impossible de charger le dashboard.",
                    "error"
                );
            }
        }
    }


    function updateBadge(
        id,
        value
    ) {

        const badge = $(id);

        badge.textContent =
            value;

        badge.hidden =
            Number(value) <= 0;
    }


    function displayRecent(reviews) {

        const container =
            $("recent-reviews");

        if (!reviews.length) {

            container.innerHTML = `
                <div class="empty-state">
                    Aucun avis récent.
                </div>
            `;

            return;
        }

        container.innerHTML =
            reviews
                .slice(0, 5)
                .map(review => {

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

                    return `
                        <article class="recent-item">

                            <div class="recent-item-top">

                                <strong class="recent-name">
                                    ${escapeHTML(
                                        review.name ||
                                        "Client"
                                    )}
                                </strong>

                                <span class="recent-date">
                                    ${formatDate(
                                        review.created_at ||
                                        review.date
                                    )}
                                </span>

                            </div>

                            <div class="recent-meta">
                                ${"★".repeat(rating)}
                                ·
                                ${escapeHTML(
                                    review.service ||
                                    "Service"
                                )}
                            </div>

                            <div class="recent-message">
                                ${escapeHTML(
                                    review.text ||
                                    ""
                                )}
                            </div>

                        </article>
                    `;

                })
                .join("");
    }


    /* =========================================================
       09. LEADS
    ========================================================== */

    async function loadLeads() {

        if (!checkSession()) {
            return;
        }

        $("leads-container").innerHTML =
            `<div class="loading-state">
                <span class="spinner"></span>
                Chargement…
            </div>`;

        try {

            allLeads =
                await api("admin-leads");

            if (!Array.isArray(allLeads)) {
                allLeads = [];
            }

            filterLeads();

        } catch (error) {

            $("leads-container").innerHTML =
                `<div class="empty-state">
                    Impossible de charger les demandes.
                </div>`;

            if (
                error.message !==
                "Session expirée"
            ) {

                toast(
                    error.message,
                    "error"
                );
            }
        }
    }


    /* =========================================================
       10. PLANNING
    ========================================================== */

    function getPlanningSuggestion(lead) {

        const service = String(lead.service || "").toLowerCase();

        if (service.includes("récupération")) {
            return { duration: 120, priority: "high", label: "À diagnostiquer rapidement" };
        }

        if (service.includes("montage")) {
            return { duration: 180, priority: "normal", label: "Atelier / montage" };
        }

        if (service.includes("optimisation")) {
            return { duration: 90, priority: "normal", label: "Optimisation" };
        }

        if (service.includes("smartphone")) {
            return { duration: 60, priority: "normal", label: "Réparation mobile" };
        }

        if (service.includes("dépannage")) {
            return { duration: 60, priority: "high", label: "Dépannage prioritaire" };
        }

        return { duration: 60, priority: "normal", label: "À qualifier" };
    }


    function formatDuration(minutes) {

        const hours = Math.floor(minutes / 60);
        const remainder = minutes % 60;

        if (!hours) return `${remainder} min`;
        if (!remainder) return `${hours} h`;

        return `${hours} h ${remainder}`;
    }


    function nextPlanningSlot(duration) {

        const start = new Date();

        start.setDate(start.getDate() + 1);
        start.setHours(9, 0, 0, 0);

        while (start.getDay() === 0 || start.getDay() === 6) {
            start.setDate(start.getDate() + 1);
        }

        const end = new Date(start.getTime() + duration * 60 * 1000);

        const toCalendarDate = date =>
            `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}T${String(date.getHours()).padStart(2, "0")}${String(date.getMinutes()).padStart(2, "0")}00`;

        return {
            start,
            end,
            dates: `${toCalendarDate(start)}/${toCalendarDate(end)}`
        };
    }


    function calendarHref(lead, suggestion) {

        const slot = nextPlanningSlot(suggestion.duration);
        const title = `${lead.service || "Intervention"} — ${lead.name || "Client"}`;
        const details = [
            `Client : ${lead.name || "Non renseigné"}`,
            `Téléphone : ${formatPhone(lead.phone) || "Non renseigné"}`,
            `E-mail : ${lead.email || "Non renseigné"}`,
            "",
            lead.message || ""
        ].join("\n");

        return "https://calendar.google.com/calendar/render?action=TEMPLATE" +
            `&text=${encodeURIComponent(title)}` +
            `&details=${encodeURIComponent(details)}` +
            `&dates=${encodeURIComponent(slot.dates)}` +
            "&ctz=Europe%2FParis";
    }


    async function loadPlanning() {

        if (!checkSession()) return;

        const container = $("planning-container");

        container.innerHTML = `
            <div class="loading-state">
                <span class="spinner"></span>
                Chargement…
            </div>`;

        try {

            allLeads = await api("admin-leads");

            if (!Array.isArray(allLeads)) allLeads = [];

            displayPlanning(
                allLeads.filter(lead => lead.status !== "done")
            );

            await loadQuotes();

        } catch (error) {

            container.innerHTML = `
                <div class="empty-state">
                    Impossible de charger le planning.
                </div>`;

            if (error.message !== "Session expirée") {
                toast(error.message, "error");
            }
        }
    }


    async function loadQuotes() {

        const status = $("quote-status-filter").value;
        const container = $("quotes-container");

        try {
            const quotes = await api(`admin-leads?resource=quotes&status=${encodeURIComponent(status)}`);
            displayQuotes(Array.isArray(quotes) ? quotes : []);
        } catch (error) {
            container.innerHTML = `<div class="empty-state">Impossible de charger l'historique des devis.</div>`;
            if (error.message !== "Session expirée") toast(error.message, "error");
        }
    }


    function displayQuotes(quotes) {

        const container = $("quotes-container");
        const labels = {
            draft: "Brouillon",
            sent: "Envoyé",
            accepted: "Accepté",
            rejected: "Refusé",
            expired: "Expiré",
            paid: "Payé"
        };

        if (!quotes.length) {
            container.innerHTML = `<div class="empty-state">Aucun devis enregistré pour le moment.</div>`;
            return;
        }

        container.innerHTML = quotes.map(quote => `
            <article class="quote-history-card">
                <div>
                    <div class="planning-card-top">
                        <strong>Devis #${Number(quote.id)}</strong>
                        <span class="planning-priority quote-status-${escapeHTML(quote.status || "draft")}">
                            ${labels[quote.status] || "Brouillon"}
                        </span>
                    </div>
                    <p class="planning-service">${escapeHTML(quote.client_name || "Client")}</p>
                    <div class="planning-meta">
                        <span>Créé le ${formatDate(quote.created_at)}</span>
                        <span>• Valide jusqu'au ${quote.valid_until ? formatDate(quote.valid_until) : "non défini"}</span>
                    </div>
                </div>
                <div class="quote-history-side">
                    <strong class="quote-history-total">${Number(quote.total || 0).toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}</strong>
                    <div class="quote-history-actions">
                        <select class="select-control quote-status-select" data-quote-action="status" data-id="${Number(quote.id)}" aria-label="Statut du devis #${Number(quote.id)}">
                            ${["draft", "sent", "accepted", "rejected", "expired", "paid"].map(status => `<option value="${status}" ${quote.status === status ? "selected" : ""}>${labels[status]}</option>`).join("")}
                        </select>
                        ${quote.client_email ? `<button class="btn btn-primary btn-small" data-quote-action="send" data-id="${Number(quote.id)}">Envoyer</button>` : ""}
                    </div>
                </div>
            </article>`).join("");
    }


    async function quoteAction(action, quoteId, status = null) {

        try {
            const payload = action === "send"
                ? { action: "send_quote", quoteId }
                : { action: "update_quote_status", quoteId, status };

            await api("admin-leads", {
                method: "POST",
                body: JSON.stringify(payload)
            });

            toast(action === "send" ? "Devis envoyé au client." : "Statut du devis mis à jour.", "success");
            await loadQuotes();
        } catch (error) {
            toast(error.message || "Impossible de modifier le devis.", "error");
        }
    }


    function displayPlanning(leads) {

        const container = $("planning-container");
        const suggestions = leads.map(lead => ({
            lead,
            suggestion: getPlanningSuggestion(lead)
        }));

        $("planning-count").textContent = suggestions.length;
        $("planning-priority-count").textContent =
            suggestions.filter(item => item.suggestion.priority === "high").length;
        $("planning-duration").textContent =
            formatDuration(
                suggestions.reduce((total, item) => total + item.suggestion.duration, 0)
            );

        if (!suggestions.length) {
            container.innerHTML = `
                <div class="empty-state">
                    Aucune demande à planifier. Les demandes clôturées n'apparaissent pas ici.
                </div>`;
            return;
        }

        container.innerHTML = suggestions
            .sort((a, b) => Number(b.suggestion.priority === "high") - Number(a.suggestion.priority === "high"))
            .map(({ lead, suggestion }) => `
                <article class="planning-card">
                    <div class="planning-card-main">
                        <div class="planning-card-top">
                            <strong>${escapeHTML(lead.name || "Sans nom")}</strong>
                            <span class="planning-priority priority-${suggestion.priority}">
                                ${suggestion.priority === "high" ? "Prioritaire" : "Standard"}
                            </span>
                        </div>
                        <p class="planning-service">${escapeHTML(lead.service || "Besoin non précisé")}</p>
                        <div class="planning-meta">
                            <span>⏱ ${formatDuration(suggestion.duration)}</span>
                            <span>• ${suggestion.label}</span>
                            <span>• Reçue le ${formatDate(lead.created_at)}</span>
                        </div>
                        ${lead.message ? `<p class="planning-message">${escapeHTML(lead.message)}</p>` : ""}
                    </div>
                    <div class="planning-actions">
                        <a class="btn btn-primary btn-small" href="${calendarHref(lead, suggestion)}" target="_blank" rel="noopener noreferrer">
                            Ajouter à Google Agenda
                        </a>
                        <button class="btn btn-secondary btn-small" data-open-panel="leads">
                            Voir la demande
                        </button>
                    </div>
                </article>`)
            .join("");

        container.querySelectorAll("[data-open-panel]").forEach(button => {
            button.addEventListener("click", () => openPanel(button.dataset.openPanel));
        });
    }


    function filterLeads() {

        const filter =
            $("leads-filter").value;

        const filtered =
            filter === "all"
                ? allLeads
                : allLeads.filter(
                    lead =>
                        lead.status ===
                        filter
                );

        const counts = {
            new:
                allLeads.filter(
                    l => l.status === "new"
                ).length,

            contacted:
                allLeads.filter(
                    l => l.status === "contacted"
                ).length,

            done:
                allLeads.filter(
                    l => l.status === "done"
                ).length
        };

        $("leads-count").textContent =
            `${allLeads.length} total · ` +
            `${counts.new} nouvelles · ` +
            `${counts.contacted} contactées · ` +
            `${counts.done} clôturées`;

        displayLeads(filtered);
    }


    function displayLeads(leads) {

        const container =
            $("leads-container");

        if (!leads.length) {

            container.innerHTML = `
                <div class="empty-state">
                    Aucune demande dans cette catégorie.
                </div>
            `;

            return;
        }

        const statusMap = {
            new: [
                "Nouveau",
                "status-new"
            ],

            contacted: [
                "Contacté",
                "status-contacted"
            ],

            done: [
                "Clôturé",
                "status-done"
            ]
        };

        container.innerHTML =
            leads.map(lead => {

                const [
                    statusLabel,
                    statusClass
                ] =
                    statusMap[
                        lead.status
                    ] ||
                    statusMap.new;

                const phone =
                    formatPhone(
                        lead.phone
                    );

                const email =
                    lead.email || "";

                return `
                    <article class="lead-card">

                        <div class="lead-main">

                            <div class="lead-name-row">

                                <strong class="lead-name">
                                    ${escapeHTML(
                                        lead.name ||
                                        "Sans nom"
                                    )}
                                </strong>

                                <span class="status-pill ${statusClass}">
                                    ${statusLabel}
                                </span>

                            </div>

                            <div class="lead-service">
                                ${escapeHTML(
                                    lead.service ||
                                    "Besoin non précisé"
                                )}
                            </div>

                            <div class="lead-contact">

                                ${
                                    email
                                        ? `
                                            <a
                                                class="contact-chip"
                                                href="${mailHref(
                                                    email
                                                )}"
                                            >
                                                ✉ ${escapeHTML(
                                                    email
                                                )}
                                            </a>
                                          `
                                        : ""
                                }

                                ${
                                    phone
                                        ? `
                                            <a
                                                class="contact-chip"
                                                href="${phoneHref(
                                                    phone
                                                )}"
                                                title="Appeler ${escapeHTML(
                                                    phone
                                                )}"
                                            >
                                                📞 ${escapeHTML(
                                                    phone
                                                )}
                                            </a>
                                          `
                                        : `
                                            <span class="contact-chip">
                                                📞 Téléphone non renseigné
                                            </span>
                                          `
                                }

                            </div>

                            ${
                                lead.message
                                    ? `
                                        <div class="lead-message">
                                            ${escapeHTML(
                                                lead.message
                                            )}
                                        </div>
                                      `
                                    : ""
                            }

                            <div class="lead-date">
                                Reçue le
                                ${formatDate(
                                    lead.created_at
                                )}
                            </div>

                        </div>

                        <div class="lead-actions">

                            <button
                                class="btn btn-secondary btn-small"
                                data-lead-action="quote"
                                data-id="${Number(lead.id)}"
                            >
                                Devis
                            </button>

                            ${
                                lead.status !==
                                "contacted"
                                    ? `
                                        <button
                                            class="btn btn-primary btn-small"
                                            data-lead-action="contacted"
                                            data-id="${Number(
                                                lead.id
                                            )}"
                                        >
                                            📞 Contacté
                                        </button>
                                      `
                                    : ""
                            }

                            ${
                                lead.status !==
                                "done"
                                    ? `
                                        <button
                                            class="btn btn-success btn-small"
                                            data-lead-action="done"
                                            data-id="${Number(
                                                lead.id
                                            )}"
                                        >
                                            ✓ Clôturer
                                        </button>
                                      `
                                    : ""
                            }

                            <button
                                class="btn btn-danger btn-small"
                                data-lead-action="delete"
                                data-id="${Number(
                                    lead.id
                                )}"
                                data-name="${escapeHTML(
                                    lead.name ||
                                    "ce contact"
                                )}"
                            >
                                Supprimer
                            </button>

                        </div>

                    </article>
                `;

            })
            .join("");
    }


    /* =========================================================
       11. DEVIS
    ========================================================== */

    let quoteLead = null;

    function addQuoteItem(description = "", quantity = 1, price = 0) {

        const row = document.createElement("div");
        row.className = "quote-item-row";
        row.innerHTML = `
            <input class="quote-item-description" type="text" placeholder="Description" value="${escapeHTML(description)}" required>
            <input class="quote-item-quantity" type="number" min="1" step="1" value="${quantity}" aria-label="Quantité">
            <input class="quote-item-price" type="number" min="0" step="0.01" value="${price}" aria-label="Prix unitaire">
            <button type="button" class="icon-button quote-remove-item" aria-label="Supprimer la ligne">×</button>
        `;

        $("quote-items").appendChild(row);
        row.querySelectorAll("input").forEach(input => input.addEventListener("input", calculateQuote));
        row.querySelector(".quote-remove-item").addEventListener("click", () => {
            row.remove();
            calculateQuote();
        });
        calculateQuote();
    }


    function calculateQuote() {

        const itemsTotal = [...document.querySelectorAll(".quote-item-row")]
            .reduce((total, row) => {
                const quantity = Number(row.querySelector(".quote-item-quantity").value) || 0;
                const price = Number(row.querySelector(".quote-item-price").value) || 0;
                return total + quantity * price;
            }, 0);

        const travel = Number($("quote-travel").value) || 0;
        const discount = Number($("quote-discount").value) || 0;
        const total = Math.max(0, itemsTotal + travel - discount);

        $("quote-total").textContent = total.toLocaleString("fr-FR", {
            style: "currency",
            currency: "EUR"
        });
    }


    function openQuote(leadId) {

        quoteLead = allLeads.find(lead => Number(lead.id) === Number(leadId));
        if (!quoteLead) return;

        $("quote-client").value = quoteLead.name || "";
        $("quote-email").value = quoteLead.email || "";
        $("quote-items").innerHTML = "";
        addQuoteItem(quoteLead.service || "Prestation informatique", 1, 0);
        $("quote-travel").value = 0;
        $("quote-discount").value = 0;
        $("quote-modal").hidden = false;
        $("quote-client").focus();
        calculateQuote();
    }


    function closeQuote() {
        $("quote-modal").hidden = true;
        quoteLead = null;
    }


    async function printQuote(event) {

        event.preventDefault();

        if (!quoteLead) return;

        calculateQuote();

        const items = [...document.querySelectorAll(".quote-item-row")].map(row => ({
            description: row.querySelector(".quote-item-description").value,
            quantity: Number(row.querySelector(".quote-item-quantity").value),
            unit_price: Number(row.querySelector(".quote-item-price").value)
        }));

        const validUntil = new Date();
        validUntil.setDate(validUntil.getDate() + 30);

        try {
            await api("admin-leads", {
                method: "POST",
                body: JSON.stringify({
                    action: "create_quote",
                    leadId: Number(quoteLead.id),
                    clientName: $("quote-client").value,
                    clientEmail: $("quote-email").value,
                    items,
                    travelCost: Number($("quote-travel").value) || 0,
                    discount: Number($("quote-discount").value) || 0,
                    validUntil: validUntil.toISOString().slice(0, 10)
                })
            });

            toast("Devis enregistré dans Supabase.", "success");
        } catch (error) {
            toast(error.message || "Impossible d'enregistrer le devis.", "error");
            return;
        }

        window.print();
    }


    async function leadAction(
        action,
        leadId,
        status = null
    ) {

        try {

            await api(
                "admin-leads",
                {
                    method: "POST",

                    body:
                        JSON.stringify({
                            action,
                            leadId,
                            status
                        })
                }
            );

            toast(
                action === "delete"
                    ? "Demande supprimée."
                    : "Demande mise à jour.",
                action === "delete"
                    ? "info"
                    : "success"
            );

            await loadLeads();

            await loadDashboard();

        } catch (error) {

            if (
                error.message !==
                "Session expirée"
            ) {

                toast(
                    error.message,
                    "error"
                );
            }
        }
    }


    /* =========================================================
       10. AVIS
    ========================================================== */

    async function loadReviews() {

        if (!checkSession()) {
            return;
        }

        $("reviews-container").innerHTML =
            `<div class="loading-state">
                <span class="spinner"></span>
                Chargement…
            </div>`;

        try {

            allReviews =
                await api("admin-reviews");

            if (!Array.isArray(allReviews)) {
                allReviews = [];
            }

            filterReviews();

        } catch (error) {

            $("reviews-container").innerHTML =
                `<div class="empty-state">
                    Impossible de charger les avis.
                </div>`;

            if (
                error.message !==
                "Session expirée"
            ) {

                toast(
                    error.message,
                    "error"
                );
            }
        }
    }


    function filterReviews() {

        const filter =
            $("reviews-filter").value;

        const filtered =
            filter === "all"
                ? allReviews
                : filter === "pending"
                    ? allReviews.filter(
                        review =>
                            !review.approved
                    )
                    : allReviews.filter(
                        review =>
                            review.approved
                    );

        const pending =
            allReviews.filter(
                review =>
                    !review.approved
            ).length;

        const approved =
            allReviews.filter(
                review =>
                    review.approved
            ).length;

        $("reviews-count").textContent =
            `${allReviews.length} total · ` +
            `${pending} en attente · ` +
            `${approved} approuvés`;

        updateBadge(
            "badge-pending",
            pending
        );

        displayReviews(filtered);
    }


    function displayReviews(reviews) {

        const container =
            $("reviews-container");

        if (!reviews.length) {

            container.innerHTML = `
                <div class="empty-state">
                    Aucun avis dans cette catégorie.
                </div>
            `;

            return;
        }

        container.innerHTML =
            reviews.map(review => {

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

                return `
                    <article class="review-card">

                        <div class="review-main">

                            <div class="review-top">

                                <strong class="review-name">
                                    ${escapeHTML(
                                        review.name ||
                                        "Client"
                                    )}
                                </strong>

                                <span class="review-rating">
                                    ${"★".repeat(
                                        rating
                                    )}${"☆".repeat(
                                        5 - rating
                                    )}
                                </span>

                                <span class="status-pill ${
                                    review.approved
                                        ? "approved-pill"
                                        : "pending-pill"
                                }">
                                    ${
                                        review.approved
                                            ? "Approuvé"
                                            : "En attente"
                                    }
                                </span>

                            </div>

                            <div class="review-service">
                                ${escapeHTML(
                                    review.service ||
                                    "Service non précisé"
                                )}
                            </div>

                            <div class="review-text">
                                « ${escapeHTML(
                                    review.text ||
                                    ""
                                )} »
                            </div>

                            <div class="review-date">
                                ${formatDate(
                                    review.created_at ||
                                    review.date
                                )}
                            </div>

                        </div>

                        <div class="review-actions">

                            ${
                                !review.approved
                                    ? `
                                        <button
                                            class="btn btn-success btn-small"
                                            data-review-action="approve"
                                            data-id="${Number(
                                                review.id
                                            )}"
                                        >
                                            ✓ Approuver
                                        </button>
                                      `
                                    : ""
                            }

                            <button
                                class="btn btn-danger btn-small"
                                data-review-action="delete"
                                data-id="${Number(
                                    review.id
                                )}"
                                data-name="${escapeHTML(
                                    review.name ||
                                    "ce client"
                                )}"
                            >
                                Supprimer
                            </button>

                        </div>

                    </article>
                `;

            })
            .join("");
    }


    async function reviewAction(
        action,
        reviewId
    ) {

        try {

            await api(
                "admin-reviews",
                {
                    method: "POST",

                    body:
                        JSON.stringify({
                            action,
                            reviewId
                        })
                }
            );

            toast(
                action === "approve"
                    ? "Avis approuvé."
                    : "Avis supprimé.",
                action === "approve"
                    ? "success"
                    : "info"
            );

            await loadReviews();

            await loadDashboard();

        } catch (error) {

            if (
                error.message !==
                "Session expirée"
            ) {

                toast(
                    error.message,
                    "error"
                );
            }
        }
    }


    /* =========================================================
       11. STATISTIQUES
    ========================================================== */

    async function loadSiteStats() {

        if (!checkSession()) {
            return;
        }

        try {

            const data =
                await api("admin-stats");

            if (!data.site) {
                return;
            }

            $("input-pc").value =
                data.site.pcBuilt ?? 0;

            $("input-clients").value =
                data.site.happyClients ?? 0;

            $("input-response").value =
                data.site.responseTime ?? 24;

        } catch (error) {

            if (
                error.message !==
                "Session expirée"
            ) {

                toast(
                    "Impossible de charger les statistiques.",
                    "error"
                );
            }
        }
    }


    async function saveStats() {

        if (!checkSession()) {
            return;
        }

        const saveStatus =
            $("save-status");

        const pcBuilt =
            Math.max(
                0,
                parseInt(
                    $("input-pc").value,
                    10
                ) || 0
            );

        const happyClients =
            Math.max(
                0,
                parseInt(
                    $("input-clients").value,
                    10
                ) || 0
            );

        const responseTime =
            Math.max(
                1,
                parseInt(
                    $("input-response").value,
                    10
                ) || 24
            );

        saveStatus.innerHTML =
            `<span class="spinner"></span>
             Sauvegarde…`;

        try {

            await api(
                "admin-stats",
                {
                    method: "POST",

                    body:
                        JSON.stringify({
                            pcBuilt,
                            happyClients,
                            responseTime
                        })
                }
            );

            saveStatus.textContent =
                "Enregistré.";

            toast(
                "Statistiques sauvegardées.",
                "success"
            );

        } catch (error) {

            saveStatus.textContent =
                "";

            if (
                error.message !==
                "Session expirée"
            ) {

                toast(
                    error.message,
                    "error"
                );
            }
        }
    }


    /* =========================================================
       12. ÉVÉNEMENTS
    ========================================================== */

    $("login-form")
        .addEventListener(
            "submit",
            event => {

                event.preventDefault();

                login();
            }
        );


    $("logout-button")
        .addEventListener(
            "click",
            () => logout()
        );


    $("burger-admin")
        .addEventListener(
            "click",
            toggleSidebar
        );


    $("sidebar-overlay")
        .addEventListener(
            "click",
            closeMobileSidebar
        );


    document
        .querySelectorAll(
            ".nav-item[data-panel]"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () =>
                    openPanel(
                        button.dataset.panel
                    )
            );
        });


    document
        .querySelectorAll(
            "[data-open-panel]"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () =>
                    openPanel(
                        button.dataset.openPanel
                    )
            );
        });


    $("refresh-dashboard")
        .addEventListener(
            "click",
            loadDashboard
        );


    $("refresh-leads")
        .addEventListener(
            "click",
            loadLeads
        );


    $("refresh-planning")
        .addEventListener(
            "click",
            loadPlanning
        );

    $("quote-status-filter")
        .addEventListener(
            "change",
            loadQuotes
        );

    $("quotes-container")
        .addEventListener("click", event => {
            const button = event.target.closest("[data-quote-action=send]");
            if (button) quoteAction("send", Number(button.dataset.id));
        });

    $("quotes-container")
        .addEventListener("change", event => {
            const select = event.target.closest("[data-quote-action=status]");
            if (select) quoteAction("status", Number(select.dataset.id), select.value);
        });


    $("refresh-reviews")
        .addEventListener(
            "click",
            loadReviews
        );


    $("leads-filter")
        .addEventListener(
            "change",
            filterLeads
        );


    $("reviews-filter")
        .addEventListener(
            "change",
            filterReviews
        );


    $("save-stats")
        .addEventListener(
            "click",
            saveStats
        );


    $("leads-container")
        .addEventListener(
            "click",
            event => {

                const button =
                    event.target.closest(
                        "[data-lead-action]"
                    );

                if (!button) {
                    return;
                }

                const action =
                    button.dataset.leadAction;

                const id =
                    Number(
                        button.dataset.id
                    );

                if (
                    action ===
                    "quote"
                ) {

                    openQuote(id);
                    return;
                }

                if (
                    action ===
                    "delete"
                ) {

                    const name =
                        button.dataset.name ||
                        "ce contact";

                    if (
                        !confirm(
                            `Supprimer la demande de ${name} ?`
                        )
                    ) {
                        return;
                    }

                    leadAction(
                        "delete",
                        id
                    );

                    return;
                }

                leadAction(
                    "update",
                    id,
                    action
                );
            }
        );


    $("quote-add-item")
        .addEventListener(
            "click",
            () => addQuoteItem()
        );

    $("quote-travel")
        .addEventListener("input", calculateQuote);

    $("quote-discount")
        .addEventListener("input", calculateQuote);

    $("quote-form")
        .addEventListener("submit", printQuote);

    document
        .querySelectorAll("[data-quote-close]")
        .forEach(button => button.addEventListener("click", closeQuote));


    $("reviews-container")
        .addEventListener(
            "click",
            event => {

                const button =
                    event.target.closest(
                        "[data-review-action]"
                    );

                if (!button) {
                    return;
                }

                const action =
                    button.dataset.reviewAction;

                const id =
                    Number(
                        button.dataset.id
                    );

                if (
                    action ===
                    "delete"
                ) {

                    const name =
                        button.dataset.name ||
                        "ce client";

                    if (
                        !confirm(
                            `Supprimer l'avis de ${name} ?`
                        )
                    ) {
                        return;
                    }
                }

                reviewAction(
                    action,
                    id
                );
            }
        );


    /* =========================================================
       13. AUTO REFRESH
    ========================================================== */

    setInterval(
        () => {

            if (!checkSession()) {
                return;
            }

            if (
                currentPanel ===
                "dashboard"
            ) {
                loadDashboard();
            }

            if (
                currentPanel ===
                "leads"
            ) {
                loadLeads();
            }

            if (
                currentPanel ===
                "planning"
            ) {
                loadPlanning();
            }

            if (
                currentPanel ===
                "reviews"
            ) {
                loadReviews();
            }

        },
        30000
    );


    /* =========================================================
       14. INITIALISATION
    ========================================================== */

    if (
        authToken &&
        checkSession()
    ) {

        showAdmin();

        loadDashboard();

    } else {

        showLogin();

    }

})();
