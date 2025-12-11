// ============================================
// OPTIMIZED MATRIX ANIMATION
// ============================================

// Cache DOM elements
const canvas = document.getElementById('matrix-canvas');
const ctx = canvas.getContext('2d', { alpha: false }); // Disable alpha for better performance
const siteContent = document.getElementById('site-content');

// Initialize canvas
let canvasWidth = window.innerWidth;
let canvasHeight = window.innerHeight;
canvas.width = canvasWidth;
canvas.height = canvasHeight;

// Constants
const CHARACTERS = ['0', '1']; // Pre-split array
const FONT_SIZE = 16;
const ANIMATION_DURATION = 1400;
const FADE_OUT_DURATION = 800;

// Calculate columns and initialize drops
let columns = Math.floor(canvasWidth / FONT_SIZE);
const drops = Array.from({ length: columns }, () => 1);

// Pre-set static styles
ctx.fillStyle = "#00f0ff";
ctx.shadowColor = "#00f0ff";
ctx.shadowBlur = 5;
ctx.font = `${FONT_SIZE}px 'Rajdhani', monospace`;

// Animation state
let animationId = null;
let isAnimating = true;

// Optimized draw function using requestAnimationFrame
function draw() {
    if (!isAnimating) return;

    // Clear with trail effect
    ctx.fillStyle = "rgba(5, 5, 5, 0.1)";
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Reset fill style for characters
    ctx.fillStyle = "#00f0ff";

    // Draw characters
    for (let i = 0; i < drops.length; i++) {
        const char = CHARACTERS[Math.random() < 0.5 ? 0 : 1];
        const x = i * FONT_SIZE;
        const y = drops[i] * FONT_SIZE;

        ctx.fillText(char, x, y);

        // Reset drop randomly when it goes off screen
        if (y > canvasHeight && Math.random() > 0.95) {
            drops[i] = 0;
        }

        drops[i]++;
    }

    animationId = requestAnimationFrame(draw);
}

// Start animation
animationId = requestAnimationFrame(draw);

// Stop animation and fade out
setTimeout(() => {
    isAnimating = false;
    if (animationId) {
        cancelAnimationFrame(animationId);
    }

    // Fade out canvas
    canvas.style.transition = `opacity ${FADE_OUT_DURATION}ms ease-in`;
    canvas.style.opacity = '0';

    // Fade in site content
    siteContent.style.transition = 'opacity 0.9s ease-in 0.2s';
    siteContent.style.opacity = '1';

    // Remove canvas from DOM after fade
    setTimeout(() => {
        canvas.remove();
    }, FADE_OUT_DURATION);

}, ANIMATION_DURATION);

// ============================================
// DEBOUNCED RESIZE HANDLER
// ============================================

let resizeTimeout;
function handleResize() {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        if (canvas && canvas.parentNode) {
            canvasWidth = window.innerWidth;
            canvasHeight = window.innerHeight;
            canvas.width = canvasWidth;
            canvas.height = canvasHeight;
            columns = Math.floor(canvasWidth / FONT_SIZE);

            // Adjust drops array
            drops.length = columns;
            for (let i = 0; i < columns; i++) {
                if (drops[i] === undefined) drops[i] = 1;
            }
        }
    }, 150); // Debounce delay
}

window.addEventListener('resize', handleResize, { passive: true });

// ============================================
// BURGER MENU
// ============================================

const burger = document.querySelector('.burger');
const nav = document.querySelector('nav ul');
const navLinks = document.querySelectorAll('nav ul li a');

burger.addEventListener('click', () => {
    nav.classList.toggle('nav-active');
    burger.classList.toggle('toggle');
});

// Auto-close menu when clicking on a link
navLinks.forEach(link => {
    link.addEventListener('click', () => {
        nav.classList.remove('nav-active');
        burger.classList.remove('toggle');
    });
});

// EmailJS Contact Form Handler
document.getElementById('contact-form').addEventListener('submit', function(event) {
    event.preventDefault();
    
    const submitBtn = this.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    
    // Show loading state
    submitBtn.textContent = 'Envoi en cours...';
    submitBtn.disabled = true;
    submitBtn.style.opacity = '0.7';
    
    // Send email using EmailJS
    emailjs.sendForm('service_yb6h9t7', 'template_idokhq6', this)
        .then(function(response) {
            console.log('SUCCESS!', response.status, response.text);
            
            // Success feedback
            submitBtn.textContent = '✅ Message envoyé !';
            submitBtn.style.backgroundColor = '#00ff88';
            submitBtn.style.color = '#000';
            
            // Reset form
            document.getElementById('contact-form').reset();
            
            // Reset button after 3 seconds
            setTimeout(() => {
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
                submitBtn.style.opacity = '1';
                submitBtn.style.backgroundColor = '';
                submitBtn.style.color = '';
            }, 3000);
            
        }, function(error) {
            console.log('FAILED...', error);
            
            // Error feedback
            submitBtn.textContent = '❌ Erreur - Réessayer';
            submitBtn.style.backgroundColor = '#ff4444';
            submitBtn.style.color = '#fff';
            
            // Reset button after 3 seconds
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
// SCROLL ANIMATIONS & COUNTERS
// ============================================

// Intersection Observer pour les animations au scroll
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            
            // Animation des compteurs
            if (entry.target.classList.contains('stat-item')) {
                animateCounter(entry.target.querySelector('.stat-number'));
            }
        }
    });
}, observerOptions);

// Observer tous les éléments à animer
document.addEventListener('DOMContentLoaded', () => {
    const animatedElements = document.querySelectorAll('.animate-on-scroll');
    animatedElements.forEach(el => observer.observe(el));
    
    // Ajouter la classe animate-on-scroll aux sections
    const sections = document.querySelectorAll('.card, .process-step, .stat-item');
    sections.forEach(section => {
        section.classList.add('animate-on-scroll');
        observer.observe(section);
    });
});

// Animation des compteurs
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
// SMOOTH SCROLL AMÉLIORÉ
// ============================================

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            // Calcul de la distance pour ajuster la durée
            const targetPosition = target.offsetTop - 80; // -80px pour la nav fixe
            const startPosition = window.pageYOffset;
            const distance = Math.abs(targetPosition - startPosition);
            const duration = Math.min(Math.max(distance / 3, 800), 2000); // Entre 800ms et 2s
            
            // Animation personnalisée plus fluide
            const startTime = performance.now();
            
            function animateScroll(currentTime) {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);
                
                // Fonction d'easing pour un mouvement plus naturel
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
// PARALLAX EFFECT SUR LE BACKGROUND GLOW
// ============================================

window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    const backgroundGlow = document.querySelector('.background-glow');
    if (backgroundGlow) {
        backgroundGlow.style.transform = `translateY(${scrolled * 0.5}px)`;
    }
});

// Scroll indicator click handler - Refait au propre
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

// Logo click handler - Scroll to top
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
        
        // Add cursor pointer to show it's clickable
        logo.style.cursor = 'pointer';
    }
});

// ============================================
// SYSTÈME D'AVIS CLIENTS AVEC BACKEND
// ============================================

const API_URL = '/.netlify/functions/reviews';

// Charger les avis depuis l'API
async function loadReviews() {
    try {
        const response = await fetch(API_URL);
        if (response.ok) {
            return await response.json();
        }
    } catch (error) {
        console.error('Erreur lors du chargement des avis:', error);
    }
    
    // Fallback vers les avis par défaut
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

// Sauvegarder un nouvel avis
async function saveNewReview(reviewData) {
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(reviewData)
        });
        
        const result = await response.json();
        return { success: response.ok, data: result };
    } catch (error) {
        console.error('Erreur lors de la sauvegarde:', error);
        return { success: false, error: 'Erreur de connexion' };
    }
}

// Afficher les étoiles
function getStarsHTML(rating) {
    return '⭐'.repeat(rating) + '☆'.repeat(5 - rating);
}

// Afficher les avis
async function displayReviews() {
    const reviews = await loadReviews();
    const reviewsList = document.getElementById('reviews-list');
    
    if (!reviewsList) return;
    
    reviewsList.innerHTML = reviews.map(review => `
        <div class="review-card animate-on-scroll">
            <div class="review-header">
                <div class="review-client">${review.name}</div>
                <div class="review-rating">${getStarsHTML(review.rating)}</div>
            </div>
            <div class="review-service">Service: ${review.service}</div>
            <div class="review-text">"${review.text}"</div>
            <div class="review-date">${new Date(review.date).toLocaleDateString('fr-FR')}</div>
        </div>
    `).join('');
    
    // Réappliquer l'observer pour les nouvelles cartes
    const newCards = reviewsList.querySelectorAll('.animate-on-scroll');
    newCards.forEach(card => observer.observe(card));
}

// Gérer l'ajout d'un nouvel avis (VERSION CORRIGÉE)
document.addEventListener('DOMContentLoaded', () => {
    const reviewForm = document.getElementById('review-form');
    
    if (reviewForm) {
        reviewForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const submitBtn = this.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            
            // Loading state
            submitBtn.textContent = 'Publication...';
            submitBtn.disabled = true;
            
            const formData = new FormData(this);
            const reviewData = {
                name: formData.get('client_name')?.trim(),
                rating: parseInt(formData.get('rating')),
                service: formData.get('service_type')?.trim(),
                text: formData.get('review_text')?.trim()
            };
            
            console.log('📤 Envoi des données:', reviewData);
            
            // Validation côté client
            if (!reviewData.name || reviewData.name.length < 2) {
                alert('❌ Le nom doit contenir au moins 2 caractères');
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
                return;
            }
            
            if (!reviewData.rating || reviewData.rating < 1 || reviewData.rating > 5) {
                alert('❌ Veuillez sélectionner une note');
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
                return;
            }
            
            if (!reviewData.service || reviewData.service.length < 3) {
                alert('❌ Le service doit contenir au moins 3 caractères');
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
                return;
            }
            
            if (!reviewData.text || reviewData.text.length < 10) {
                alert('❌ Le commentaire doit contenir au moins 10 caractères');
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
                return;
            }
            
            const result = await saveNewReview(reviewData);
            
            if (result.success) {
                // Succès
                submitBtn.textContent = '✅ Avis publié !';
                submitBtn.style.backgroundColor = '#00ff88';
                this.reset();
                
                // Recharger les avis
                setTimeout(() => {
                    displayReviews();
                }, 1000);
            } else {
                // Erreur
                console.error('❌ Erreur:', result);
                submitBtn.textContent = '❌ Erreur - Réessayer';
                submitBtn.style.backgroundColor = '#ff4444';
                
                // Afficher l'erreur détaillée
                if (result.data?.error) {
                    alert(`Erreur: ${result.data.error}`);
                }
            }
            
            // Reset button
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
