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
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
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
