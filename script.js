/**
 * ============================================
 * HORIZON IT - SCRIPT PRINCIPAL
 * ============================================
 *
 * Table des matières:
 * 1. Animation Matrix (Intro)
 * 2. Gestion du Resize
 * 3. Menu Burger (Navigation mobile)
 * 4. Formulaire de Contact (EmailJS)
 * 5. Animations au Scroll & Compteurs
 * 6. Smooth Scroll amélioré
 * 7. Effet Parallax
 * 8. Système d'Avis Clients
 *
 * ============================================
 */


// ============================================
// 1. ANIMATION MATRIX (INTRO)
// ============================================

// Cache des éléments DOM
const canvas = document.getElementById('matrix-canvas');
const ctx = canvas.getContext('2d', { alpha: false });
const siteContent = document.getElementById('site-content');

// Initialisation du canvas
let canvasWidth = window.innerWidth;
let canvasHeight = window.innerHeight;
canvas.width = canvasWidth;
canvas.height = canvasHeight;

// Constantes de configuration
const CHARACTERS = ['0', '1'];
const FONT_SIZE = 16;
const ANIMATION_DURATION = 1400;
const FADE_OUT_DURATION = 800;

// Calcul des colonnes et initialisation des gouttes
let columns = Math.floor(canvasWidth / FONT_SIZE);
const drops = Array.from({ length: columns }, () => 1);

// Styles pré-définis pour le canvas
ctx.fillStyle = "#00f0ff";
ctx.shadowColor = "#00f0ff";
ctx.shadowBlur = 5;
ctx.font = `${FONT_SIZE}px 'Rajdhani', monospace`;

// État de l'animation
let animationId = null;
let isAnimating = true;

/**
 * Fonction de dessin optimisée avec requestAnimationFrame
 */
function draw() {
    if (!isAnimating) return;

    // Effet de traînée
    ctx.fillStyle = "rgba(5, 5, 5, 0.1)";
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Couleur des caractères
    ctx.fillStyle = "#00f0ff";

    // Dessiner les caractères
    for (let i = 0; i < drops.length; i++) {
        const char = CHARACTERS[Math.random() < 0.5 ? 0 : 1];
        const x = i * FONT_SIZE;
        const y = drops[i] * FONT_SIZE;

        ctx.fillText(char, x, y);

        // Reset aléatoire quand la goutte sort de l'écran
        if (y > canvasHeight && Math.random() > 0.95) {
            drops[i] = 0;
        }

        drops[i]++;
    }

    animationId = requestAnimationFrame(draw);
}

// Démarrage de l'animation
animationId = requestAnimationFrame(draw);

// Arrêt et fondu après la durée définie
setTimeout(() => {
    isAnimating = false;
    if (animationId) {
        cancelAnimationFrame(animationId);
    }

    // Fondu du canvas
    canvas.style.transition = `opacity ${FADE_OUT_DURATION}ms ease-in`;
    canvas.style.opacity = '0';

    // Apparition du contenu du site
    siteContent.style.transition = 'opacity 0.9s ease-in 0.2s';
    siteContent.style.opacity = '1';

    // Suppression du canvas du DOM
    setTimeout(() => {
        canvas.remove();
    }, FADE_OUT_DURATION);

}, ANIMATION_DURATION);

// ============================================
// 2. GESTION DU RESIZE (Debounced)
// ============================================

let resizeTimeout;

/**
 * Gestion du redimensionnement avec debounce pour les performances
 */
function handleResize() {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        if (canvas && canvas.parentNode) {
            canvasWidth = window.innerWidth;
            canvasHeight = window.innerHeight;
            canvas.width = canvasWidth;
            canvas.height = canvasHeight;
            columns = Math.floor(canvasWidth / FONT_SIZE);

            // Ajuster le tableau des gouttes
            drops.length = columns;
            for (let i = 0; i < columns; i++) {
                if (drops[i] === undefined) drops[i] = 1;
            }
        }
    }, 150);
}

window.addEventListener('resize', handleResize, { passive: true });


// ============================================
// 3. MENU BURGER (Navigation mobile)
// ============================================

const burger = document.querySelector('.burger');
const nav = document.querySelector('nav ul');
const navLinks = document.querySelectorAll('nav ul li a');

// Toggle du menu burger
burger.addEventListener('click', () => {
    nav.classList.toggle('nav-active');
    burger.classList.toggle('toggle');
});

// Fermeture auto du menu au clic sur un lien
navLinks.forEach(link => {
    link.addEventListener('click', () => {
        nav.classList.remove('nav-active');
        burger.classList.remove('toggle');
    });
});


// ============================================
// 4. FORMULAIRE DE CONTACT (EmailJS)
// ============================================

document.getElementById('contact-form').addEventListener('submit', function(event) {
    event.preventDefault();

    const submitBtn = this.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;

    // État de chargement
    submitBtn.textContent = 'Envoi en cours...';
    submitBtn.disabled = true;
    submitBtn.style.opacity = '0.7';

    // Envoi via EmailJS
    emailjs.sendForm('service_yb6h9t7', 'template_idokhq6', this)
        .then(function(response) {
            console.log('SUCCESS!', response.status, response.text);

            // Feedback succès
            submitBtn.textContent = '✅ Message envoyé !';
            submitBtn.style.backgroundColor = '#00ff88';
            submitBtn.style.color = '#000';

            // Reset du formulaire
            document.getElementById('contact-form').reset();

            // Reset du bouton après 3 secondes
            setTimeout(() => {
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
                submitBtn.style.opacity = '1';
                submitBtn.style.backgroundColor = '';
                submitBtn.style.color = '';
            }, 3000);

        }, function(error) {
            console.log('FAILED...', error);

            // Feedback erreur
            submitBtn.textContent = '❌ Erreur - Réessayer';
            submitBtn.style.backgroundColor = '#ff4444';
            submitBtn.style.color = '#fff';

            // Reset du bouton après 3 secondes
            setTimeout(() => {
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
                submitBtn.style.opacity = '1';
                submitBtn.style.backgroundColor = '';
                submitBtn.style.color = '';
            }, 3000);
        });
});

// ============================================
// 5. ANIMATIONS AU SCROLL & COMPTEURS
// ============================================

// Configuration de l'Intersection Observer
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');

            // Animation des compteurs statistiques
            if (entry.target.classList.contains('stat-item')) {
                animateCounter(entry.target.querySelector('.stat-number'));
            }
        }
    });
}, observerOptions);

// Initialisation des éléments animés au chargement
document.addEventListener('DOMContentLoaded', () => {
    const animatedElements = document.querySelectorAll('.animate-on-scroll');
    animatedElements.forEach(el => observer.observe(el));

    // Ajout automatique de l'animation aux cartes et étapes
    const sections = document.querySelectorAll('.card, .process-step, .stat-item');
    sections.forEach(section => {
        section.classList.add('animate-on-scroll');
        observer.observe(section);
    });
});

/**
 * Animation des compteurs de statistiques
 * @param {HTMLElement} element - L'élément contenant le compteur
 */
function animateCounter(element) {
    const target = parseInt(element.getAttribute('data-target'));
    const duration = 2000;
    const step = target / (duration / 16);
    let current = 0;

    const timer = setInterval(() => {
        current += step;
        if (current >= target) {
            current = target;
            clearInterval(timer);
        }
        element.textContent = Math.floor(current) + (target === 99 ? '%' : '');
    }, 16);
}


// ============================================
// 6. SMOOTH SCROLL AMÉLIORÉ
// ============================================

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));

        if (target) {
            // Calcul de la distance pour ajuster la durée
            const targetPosition = target.offsetTop - 80; // Offset pour la nav fixe
            const startPosition = window.pageYOffset;
            const distance = Math.abs(targetPosition - startPosition);
            const duration = Math.min(Math.max(distance / 3, 800), 2000);

            const startTime = performance.now();

            /**
             * Animation du scroll avec easing cubic
             */
            function animateScroll(currentTime) {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);

                // Fonction d'easing pour un mouvement naturel
                const easeInOutCubic = progress < 0.5
                    ? 4 * progress * progress * progress
                    : 1 - Math.pow(-2 * progress + 2, 3) / 2;

                const currentPosition = startPosition + (targetPosition - startPosition) * easeInOutCubic;
                window.scrollTo(0, currentPosition);

                if (progress < 1) {
                    requestAnimationFrame(animateScroll);
                }
            }

            requestAnimationFrame(animateScroll);
        }
    });
});


// ============================================
// 7. EFFET PARALLAX & INTERACTIONS
// ============================================

// Parallax sur le background glow
window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    const backgroundGlow = document.querySelector('.background-glow');
    if (backgroundGlow) {
        backgroundGlow.style.transform = `translateY(${scrolled * 0.5}px)`;
    }
});

// Clic sur l'indicateur de scroll (flèche du hero)
document.addEventListener('DOMContentLoaded', () => {
    const scrollIndicator = document.querySelector('.scroll-indicator');
    if (scrollIndicator) {
        scrollIndicator.addEventListener('click', (e) => {
            e.preventDefault();
            const servicesSection = document.querySelector('#services');
            if (servicesSection) {
                servicesSection.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    }
});

// Clic sur le logo pour remonter en haut
document.addEventListener('DOMContentLoaded', () => {
    const logo = document.querySelector('.logo');
    if (logo) {
        logo.addEventListener('click', (e) => {
            e.preventDefault();
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
        logo.style.cursor = 'pointer';
    }
});

// ============================================
// 8. SYSTÈME D'AVIS CLIENTS (API Netlify)
// ============================================

const API_URL = '/.netlify/functions/reviews';

/**
 * Charge les avis depuis l'API
 * @returns {Promise<Array>} Liste des avis
 */
async function loadReviews() {
    try {
        const response = await fetch(API_URL);
        if (response.ok) {
            return await response.json();
        }
    } catch (error) {
        console.error('Erreur lors du chargement des avis:', error);
    }

    // Fallback vers un avis par défaut
    return [
        {
            name: "Thomas M.",
            rating: 5,
            service: "Montage PC Gaming",
            text: "Service au top ! Mon PC gaming fonctionne parfaitement, cable management impeccable. Je recommande vivement !",
            date: "2024-12-15"
        }
    ];
}

/**
 * Sauvegarde un nouvel avis via l'API
 * @param {Object} reviewData - Les données de l'avis
 * @returns {Promise<Object>} Résultat de la sauvegarde
 */
async function saveNewReview(reviewData) {
    try {
        console.log('📤 Envoi avis:', reviewData);

        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(reviewData)
        });

        const result = await response.json();
        console.log('📥 Réponse serveur:', result);

        return { success: response.ok, data: result };
    } catch (error) {
        console.error('❌ Erreur lors de la sauvegarde:', error);
        return { success: false, error: 'Erreur de connexion' };
    }
}

/**
 * Génère le HTML des étoiles pour une note donnée
 * @param {number} rating - Note de 1 à 5
 * @returns {string} HTML des étoiles
 */
function getStarsHTML(rating) {
    return '⭐'.repeat(rating) + '☆'.repeat(5 - rating);
}

/**
 * Affiche les avis dans le DOM
 */
async function displayReviews() {
    console.log('🔄 Rechargement des avis...');
    const reviews = await loadReviews();
    console.log(`📋 ${reviews.length} avis chargés`);

    const reviewsList = document.getElementById('reviews-list');
    if (!reviewsList) return;

    reviewsList.innerHTML = reviews.map(review => {
        // Supabase utilise created_at, fallback sur date pour compatibilité
        const reviewDate = review.created_at || review.date;
        const formattedDate = reviewDate
            ? new Date(reviewDate).toLocaleDateString('fr-FR')
            : '';

        return `
            <div class="review-card animate-on-scroll">
                <div class="review-header">
                    <div class="review-client">${review.name}</div>
                    <div class="review-rating">${getStarsHTML(review.rating)}</div>
                </div>
                <div class="review-service">Service: ${review.service}</div>
                <div class="review-text">"${review.text}"</div>
                <div class="review-date">${formattedDate}</div>
            </div>
        `;
    }).join('');

    // Réappliquer l'observer pour les animations
    const newCards = reviewsList.querySelectorAll('.animate-on-scroll');
    newCards.forEach(card => observer.observe(card));
}

/**
 * Validation des données du formulaire d'avis
 * @param {Object} data - Données à valider
 * @returns {string|null} Message d'erreur ou null si valide
 */
function validateReviewData(data) {
    if (!data.name || data.name.length < 2) {
        return '❌ Le nom doit contenir au moins 2 caractères';
    }
    if (!data.rating || data.rating < 1 || data.rating > 5) {
        return '❌ Veuillez sélectionner une note';
    }
    if (!data.service || data.service.length < 3) {
        return '❌ Le service doit contenir au moins 3 caractères';
    }
    if (!data.text || data.text.length < 10) {
        return '❌ Le commentaire doit contenir au moins 10 caractères';
    }
    return null;
}

// Gestion du formulaire d'ajout d'avis
document.addEventListener('DOMContentLoaded', () => {
    const reviewForm = document.getElementById('review-form');

    if (reviewForm) {
        reviewForm.addEventListener('submit', async function(e) {
            e.preventDefault();

            const submitBtn = this.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;

            // État de chargement
            submitBtn.textContent = 'Publication...';
            submitBtn.disabled = true;

            // Récupération des données
            const formData = new FormData(this);
            const reviewData = {
                name: formData.get('client_name')?.trim(),
                rating: parseInt(formData.get('rating')),
                service: formData.get('service_type')?.trim(),
                text: formData.get('review_text')?.trim()
            };

            console.log('📤 Envoi des données:', reviewData);

            // Validation côté client
            const validationError = validateReviewData(reviewData);
            if (validationError) {
                alert(validationError);
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
                return;
            }

            // Envoi à l'API
            const result = await saveNewReview(reviewData);

            if (result.success) {
                // Succès
                submitBtn.textContent = '✅ Avis publié !';
                submitBtn.style.backgroundColor = '#00ff88';
                this.reset();

                // Recharger les avis après 1 seconde
                setTimeout(() => {
                    displayReviews();
                }, 1000);
            } else {
                // Erreur
                console.error('❌ Erreur:', result);
                submitBtn.textContent = '❌ Erreur - Réessayer';
                submitBtn.style.backgroundColor = '#ff4444';

                if (result.data?.error) {
                    alert(`Erreur: ${result.data.error}`);
                }
            }

            // Reset du bouton après 3 secondes
            setTimeout(() => {
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
                submitBtn.style.backgroundColor = '';
            }, 3000);
        });
    }

    // Charger les avis au démarrage
    displayReviews();
});
