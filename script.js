/**
 * ============================================
 * HORIZON IT v2.0 - SCRIPT PRINCIPAL
 * ============================================
 *
 * 1. Animation Matrix (Intro)
 * 2. Cursor Glow Effect
 * 3. Navigation (Scroll + Burger)
 * 4. Pricing Tabs
 * 5. FAQ Accordion
 * 6. Formulaire de Contact (API Netlify)
 * 7. Animations au Scroll & Compteurs
 * 8. Smooth Scroll
 * 9. Système d'Avis Clients (API)
 * 10. Stats dynamiques
 *
 * ============================================
 */

// ============================================
// 1. ANIMATION MATRIX (INTRO)
// ============================================

const motionSafe = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const canvas = document.getElementById('matrix-canvas');
const siteContent = document.getElementById('site-content');

if (!motionSafe) {
    if (canvas) canvas.remove();
    if (siteContent) siteContent.style.opacity = '1';
} else if (!canvas || !siteContent) {
    if (siteContent) siteContent.style.opacity = '1';
} else {
    const ctx = canvas.getContext('2d', { alpha: false });
    let canvasWidth = window.innerWidth;
    let canvasHeight = window.innerHeight;
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    const CHARACTERS = ['0', '1'];
    const FONT_SIZE = 16;
    const ANIMATION_DURATION = 1400;
    const FADE_OUT_DURATION = 800;

    let columns = Math.floor(canvasWidth / FONT_SIZE);
    const drops = Array.from({ length: columns }, () => 1);

    ctx.fillStyle = "#00e5ff";
    ctx.shadowColor = "#00e5ff";
    ctx.shadowBlur = 5;
    ctx.font = `${FONT_SIZE}px 'Inter', monospace`;

    let animationId = null;
    let isAnimating = true;

    function draw() {
        if (!isAnimating) return;
        ctx.fillStyle = "rgba(6, 6, 17, 0.1)";
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
        ctx.fillStyle = "#00e5ff";

        for (let i = 0; i < drops.length; i++) {
            const char = CHARACTERS[Math.random() < 0.5 ? 0 : 1];
            ctx.fillText(char, i * FONT_SIZE, drops[i] * FONT_SIZE);
            if (drops[i] * FONT_SIZE > canvasHeight && Math.random() > 0.95) {
                drops[i] = 0;
            }
            drops[i]++;
        }
        animationId = requestAnimationFrame(draw);
    }

    animationId = requestAnimationFrame(draw);

    setTimeout(() => {
        isAnimating = false;
        if (animationId) cancelAnimationFrame(animationId);
        canvas.style.transition = `opacity ${FADE_OUT_DURATION}ms ease-in`;
        canvas.style.opacity = '0';
        siteContent.style.transition = 'opacity 0.9s ease-in 0.2s';
        siteContent.style.opacity = '1';
        setTimeout(() => canvas.remove(), FADE_OUT_DURATION);
    }, ANIMATION_DURATION);
}


// ============================================
// 2. CURSOR GLOW EFFECT
// ============================================

const cursorGlow = document.getElementById('cursor-glow');
if (cursorGlow && window.matchMedia('(hover: hover)').matches) {
    let mouseX = 0, mouseY = 0;
    let glowX = 0, glowY = 0;

    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
    }, { passive: true });

    function updateCursorGlow() {
        glowX += (mouseX - glowX) * 0.1;
        glowY += (mouseY - glowY) * 0.1;
        cursorGlow.style.left = glowX + 'px';
        cursorGlow.style.top = glowY + 'px';
        requestAnimationFrame(updateCursorGlow);
    }
    requestAnimationFrame(updateCursorGlow);
}


// ============================================
// 3. NAVIGATION
// ============================================

const mainNav = document.getElementById('main-nav');
const burger = document.getElementById('burger-btn');
const navLinks = document.getElementById('nav-links');
const allNavLinks = document.querySelectorAll('.nav-links a');

// Scroll detection for nav background
let lastScroll = 0;
window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;
    if (mainNav) {
        if (currentScroll > 50) {
            mainNav.classList.add('scrolled');
        } else {
            mainNav.classList.remove('scrolled');
        }
    }
    lastScroll = currentScroll;
}, { passive: true });

// Burger toggle
if (burger && navLinks) {
    burger.addEventListener('click', () => {
        const isExpanded = burger.getAttribute('aria-expanded') === 'true';
        burger.setAttribute('aria-expanded', !isExpanded);
        navLinks.classList.toggle('nav-active');
        burger.classList.toggle('toggle');
    });

    allNavLinks.forEach(link => {
        link.addEventListener('click', () => {
            navLinks.classList.remove('nav-active');
            burger.classList.remove('toggle');
            burger.setAttribute('aria-expanded', 'false');
        });
    });
}

// Logo click to top
const logo = document.querySelector('.nav-logo');
if (logo) {
    logo.addEventListener('click', (e) => {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}


// ============================================
// 4. PRICING TABS
// ============================================

const tabBtns = document.querySelectorAll('.tab-btn');
const panels = document.querySelectorAll('.pricing-panel');

tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const target = btn.getAttribute('data-tab');

        tabBtns.forEach(b => b.classList.remove('active'));
        panels.forEach(p => p.classList.remove('active'));

        btn.classList.add('active');
        const panel = document.getElementById(`panel-${target}`);
        if (panel) panel.classList.add('active');
    });
});


// ============================================
// 5. FAQ ACCORDION
// ============================================

const faqQuestions = document.querySelectorAll('.faq-question');

faqQuestions.forEach(question => {
    question.addEventListener('click', () => {
        const answer = question.nextElementSibling;
        const isOpen = question.getAttribute('aria-expanded') === 'true';

        // Close all others
        faqQuestions.forEach(q => {
            q.setAttribute('aria-expanded', 'false');
            q.nextElementSibling.classList.remove('open');
        });

        // Toggle current
        if (!isOpen) {
            question.setAttribute('aria-expanded', 'true');
            answer.classList.add('open');
        }
    });
});


// ============================================
// 6. FORMULAIRE DE CONTACT (API Netlify)
// ============================================

const formCooldowns = new Map();
const FORM_COOLDOWN_MS = 30000;

function canSubmitForm(formId) {
    const lastSubmit = formCooldowns.get(formId);
    if (!lastSubmit) return true;
    const elapsed = Date.now() - lastSubmit;
    if (elapsed >= FORM_COOLDOWN_MS) return true;
    return Math.ceil((FORM_COOLDOWN_MS - elapsed) / 1000);
}

const contactForm = document.getElementById('contact-form');
if (contactForm) {
    contactForm.addEventListener('submit', async function (event) {
        event.preventDefault();

        const submitBtn = this.querySelector('button[type="submit"]');
        const originalHTML = submitBtn.innerHTML;
        const formId = 'contact-form';

        const canSubmit = canSubmitForm(formId);
        if (canSubmit !== true) {
            submitBtn.innerHTML = `<span>⏳ Patientez ${canSubmit}s</span>`;
            submitBtn.disabled = true;
            setTimeout(() => {
                submitBtn.innerHTML = originalHTML;
                submitBtn.disabled = false;
            }, 2000);
            return;
        }

        submitBtn.innerHTML = '<span>Envoi en cours...</span>';
        submitBtn.disabled = true;
        submitBtn.style.opacity = '0.7';

        const formData = new FormData(this);
        const payload = {
            name: formData.get('user_name'),
            email: formData.get('user_email'),
            service: formData.get('service'),
            message: formData.get('message')
        };

        try {
            const response = await fetch('/.netlify/functions/contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'Erreur inconnue');

            formCooldowns.set(formId, Date.now());
            submitBtn.innerHTML = '<span>✅ Demande envoyée !</span>';
            submitBtn.style.background = '#00e676';
            submitBtn.style.color = '#000';
            this.reset();
        } catch (error) {
            submitBtn.innerHTML = '<span>❌ Erreur - Réessayer</span>';
            submitBtn.style.background = '#ff5252';
            alert(error.message || 'Impossible d\'envoyer pour le moment.');
        } finally {
            setTimeout(() => {
                submitBtn.innerHTML = originalHTML;
                submitBtn.disabled = false;
                submitBtn.style.opacity = '1';
                submitBtn.style.background = '';
                submitBtn.style.color = '';
            }, 2500);
        }
    });
}


// ============================================
// 7. ANIMATIONS AU SCROLL & COMPTEURS
// ============================================

const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');

            if (entry.target.classList.contains('stat-item')) {
                animateCounter(entry.target.querySelector('.stat-number'));
            }
        }
    });
}, observerOptions);

document.addEventListener('DOMContentLoaded', () => {
    // Observe all animatable elements
    const animatedElements = document.querySelectorAll(
        '.animate-on-scroll, .service-card, .process-step, .stat-item, .why-card, .gallery-item, .reassurance-item, .price-card, .faq-item, .contact-info-card'
    );
    animatedElements.forEach(el => {
        el.classList.add('animate-on-scroll');
        observer.observe(el);
    });
});

function animateCounter(element) {
    if (!element) return;
    const target = parseInt(element.getAttribute('data-target'));
    const duration = 2000;
    const step = target / (duration / 16);
    let current = 0;

    const statItem = element.closest('.stat-item');
    const label = statItem?.querySelector('.stat-label')?.textContent || '';
    const suffix = label.includes('%') ? '%' : '';

    const timer = setInterval(() => {
        current += step;
        if (current >= target) {
            current = target;
            clearInterval(timer);
        }
        element.textContent = Math.floor(current) + suffix;
    }, 16);
}


// ============================================
// 8. SMOOTH SCROLL
// ============================================

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));

        if (target) {
            const targetPosition = target.offsetTop - 80;
            const startPosition = window.pageYOffset;
            const distance = Math.abs(targetPosition - startPosition);
            const duration = Math.min(Math.max(distance / 3, 600), 1500);
            const startTime = performance.now();

            function animateScroll(currentTime) {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);
                const easeInOutCubic = progress < 0.5
                    ? 4 * progress * progress * progress
                    : 1 - Math.pow(-2 * progress + 2, 3) / 2;

                window.scrollTo(0, startPosition + (targetPosition - startPosition) * easeInOutCubic);
                if (progress < 1) requestAnimationFrame(animateScroll);
            }

            requestAnimationFrame(animateScroll);
        }
    });
});

// Scroll hint click
document.addEventListener('DOMContentLoaded', () => {
    const scrollHint = document.querySelector('.scroll-hint');
    if (scrollHint) {
        scrollHint.addEventListener('click', () => {
            const target = document.querySelector('#urgence') || document.querySelector('#services');
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    }
});


// ============================================
// 9. SYSTÈME D'AVIS CLIENTS (API Netlify)
// ============================================

const API_URL = '/.netlify/functions/reviews';

async function loadReviews() {
    try {
        const response = await fetch(API_URL);
        if (response.ok) return await response.json();
    } catch (error) {
        console.error('Erreur chargement avis:', error);
    }

    return [
        {
            name: "Thomas M.",
            rating: 5,
            service: "Montage PC Gaming",
            text: "Service au top ! Mon PC gaming fonctionne parfaitement, cable management impeccable. Je recommande vivement !",
            date: "2024-12-15"
        },
        {
            name: "Sarah L.",
            rating: 5,
            service: "Dépannage PC",
            text: "Intervention rapide pour un écran bleu. Problème résolu en 1h, très professionnel !",
            date: "2024-12-10"
        },
        {
            name: "Kevin R.",
            rating: 4,
            service: "Optimisation PC",
            text: "PC beaucoup plus rapide après optimisation. Bon rapport qualité/prix.",
            date: "2024-12-08"
        }
    ];
}

async function saveNewReview(reviewData) {
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(reviewData)
        });
        const result = await response.json();
        return { success: response.ok, data: result };
    } catch (error) {
        return { success: false, error: 'Erreur de connexion' };
    }
}

function getStarsHTML(rating) {
    return '⭐'.repeat(rating) + '☆'.repeat(5 - rating);
}

async function displayReviews() {
    const reviews = await loadReviews();
    const reviewsList = document.getElementById('reviews-list');
    if (!reviewsList) return;

    reviewsList.innerHTML = reviews.map(review => {
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
                <div class="review-service">${review.service}</div>
                <div class="review-text">"${review.text}"</div>
                <div class="review-date">${formattedDate}</div>
            </div>
        `;
    }).join('');

    const newCards = reviewsList.querySelectorAll('.animate-on-scroll');
    newCards.forEach(card => observer.observe(card));
}

function validateReviewData(data) {
    if (!data.name || data.name.length < 2) return '❌ Le nom doit contenir au moins 2 caractères';
    if (!data.rating || data.rating < 1 || data.rating > 5) return '❌ Veuillez sélectionner une note';
    if (!data.service || data.service.length < 3) return '❌ Le service doit contenir au moins 3 caractères';
    if (!data.text || data.text.length < 10) return '❌ Le commentaire doit contenir au moins 10 caractères';
    return null;
}

document.addEventListener('DOMContentLoaded', () => {
    const reviewForm = document.getElementById('review-form');

    if (reviewForm) {
        reviewForm.addEventListener('submit', async function (e) {
            e.preventDefault();

            const submitBtn = this.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            const formId = 'review-form';

            const canSubmit = canSubmitForm(formId);
            if (canSubmit !== true) {
                submitBtn.textContent = `⏳ Patientez ${canSubmit}s`;
                submitBtn.disabled = true;
                setTimeout(() => {
                    submitBtn.textContent = originalText;
                    submitBtn.disabled = false;
                }, 2000);
                return;
            }

            submitBtn.textContent = 'Publication...';
            submitBtn.disabled = true;

            const formData = new FormData(this);
            const reviewData = {
                name: formData.get('client_name')?.trim(),
                rating: parseInt(formData.get('rating')),
                service: formData.get('service_type')?.trim(),
                text: formData.get('review_text')?.trim()
            };

            const validationError = validateReviewData(reviewData);
            if (validationError) {
                alert(validationError);
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
                return;
            }

            const result = await saveNewReview(reviewData);

            if (result.success) {
                formCooldowns.set(formId, Date.now());
                submitBtn.textContent = '✅ Avis publié !';
                submitBtn.style.background = '#00e676';
                this.reset();
                setTimeout(() => displayReviews(), 1000);
            } else {
                submitBtn.textContent = '❌ Erreur - Réessayer';
                submitBtn.style.background = '#ff5252';
                if (result.data?.error) alert(`Erreur: ${result.data.error}`);
            }

            setTimeout(() => {
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
                submitBtn.style.background = '';
            }, 3000);
        });
    }

    displayReviews();
});


// ============================================
// 10. STATS DYNAMIQUES
// ============================================

async function loadDynamicStats() {
    try {
        const response = await fetch('/.netlify/functions/stats');
        if (!response.ok) return;

        const stats = await response.json();
        const statMappings = {
            'PC Montés': stats.pcBuilt,
            'Clients Satisfaits': stats.happyClients,
            'Réponse (h)': stats.responseTime,
            'Note Moyenne': stats.avgRating
        };

        document.querySelectorAll('.stat-item').forEach(item => {
            const label = item.querySelector('.stat-label');
            const number = item.querySelector('.stat-number');

            if (label && number) {
                const labelText = label.textContent.trim();
                for (const [key, value] of Object.entries(statMappings)) {
                    if (labelText.includes(key) || key.includes(labelText)) {
                        number.setAttribute('data-target', value);
                        break;
                    }
                }
            }
        });
    } catch (error) {
        console.warn('⚠️ Erreur chargement stats:', error);
    }
}

document.addEventListener('DOMContentLoaded', loadDynamicStats);
