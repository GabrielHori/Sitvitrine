/**
 * ============================================
 * HORIZON IT - ANIMATIONS GSAP
 * ============================================
 * 
 * Table des matières:
 * 1. Configuration GSAP
 * 2. Hero Animations (Logo, Texte, Particles)
 * 3. Scroll Animations (Sections, Cards)
 * 4. Navbar Animations
 * 5. Micro-interactions
 * 6. Dark Mode Toggle
 * 
 * ============================================
 */

// ============================================
// 1. CONFIGURATION GSAP
// ============================================

gsap.registerPlugin(ScrollTrigger);

// Configuration globale
gsap.config({
    nullTargetWarn: false
});

// Defaults pour des animations fluides
gsap.defaults({
    ease: "power2.out",
    duration: 0.8
});

// ============================================
// 2. HERO ANIMATIONS
// ============================================

function initHeroAnimations() {
    const hero = document.querySelector('.hero, #accueil, #hero, header');
    if (!hero) return;

    // S'assurer que tous les éléments sont visibles par défaut
    const logo = document.querySelector('.logo');
    const heroTitle = hero.querySelector('h1, .hero-title');
    const heroSubtitles = hero.querySelectorAll('p, .hero-subtitle, .hero-description, .subtitle, .description');
    const heroCTAs = hero.querySelectorAll('.btn-primary, .btn-secondary, .cta-button, .hero-cta');
    const scrollIndicator = hero.querySelector('.scroll-indicator');

    // Garantir visibilité avant animation
    [logo, heroTitle, scrollIndicator].forEach(el => {
        if (el) el.style.opacity = '1';
    });
    heroSubtitles.forEach(el => el.style.opacity = '1');
    heroCTAs.forEach(el => el.style.opacity = '1');

    // Timeline pour le hero avec animations subtiles
    const heroTL = gsap.timeline({
        defaults: { ease: "power3.out" }
    });

    // Animation du logo avec effet "splash"
    if (logo) {
        heroTL.fromTo(logo,
            { scale: 0.9, filter: "blur(5px)" },
            { scale: 1, filter: "blur(0px)", duration: 0.8 }
        )
        .to(logo, {
            textShadow: "0 0 30px rgba(0, 240, 255, 0.8), 0 0 60px rgba(0, 240, 255, 0.4)",
            duration: 0.5
        }, "-=0.3");
    }

    // Animation du titre hero
    if (heroTitle) {
        heroTL.fromTo(heroTitle,
            { y: 20 },
            { y: 0, duration: 0.6 }
        , "-=0.5");
    }

    // Animation des boutons CTA
    if (heroCTAs.length) {
        heroTL.fromTo(heroCTAs,
            { y: 10 },
            { y: 0, stagger: 0.1, duration: 0.4 }
        , "-=0.3");
    }
}

// ============================================
// 3. SCROLL ANIMATIONS - SECTIONS
// ============================================

function initScrollAnimations() {
    // S'assurer que toutes les sections et leurs éléments sont visibles
    const sections = document.querySelectorAll('section');

    sections.forEach(section => {
        // Garantir que la section est visible
        section.style.opacity = '1';
        section.style.visibility = 'visible';

        // Titre de section
        const title = section.querySelector('.section-title, h2');
        if (title) {
            title.style.opacity = '1';
            // Animation subtile sans cacher l'élément
            gsap.fromTo(title,
                { y: 20 },
                {
                    scrollTrigger: {
                        trigger: title,
                        start: "top 90%",
                        toggleActions: "play none none none"
                    },
                    y: 0,
                    duration: 0.6
                }
            );
        }
    });

    // Cards avec effet stagger
    initCardAnimations();
}

function initCardAnimations() {
    // Sélectionner tous les conteneurs de cartes
    const cardContainers = document.querySelectorAll(
        '.services-grid, .tarifs-grid, .pricing-grid, .builds-grid, .tips-grid, .reviews-grid'
    );

    cardContainers.forEach(container => {
        const cards = container.querySelectorAll(
            '.service-card, .tarif-card, .pricing-category, .build-card, .tip-card, .review-card, .card'
        );

        // S'assurer que toutes les cartes sont visibles
        cards.forEach(card => {
            card.style.opacity = '1';
            card.style.visibility = 'visible';
        });

        if (cards.length) {
            // Animation subtile sans cacher les éléments
            gsap.fromTo(cards,
                { y: 30, scale: 0.98 },
                {
                    scrollTrigger: {
                        trigger: container,
                        start: "top 85%",
                        toggleActions: "play none none none"
                    },
                    y: 0,
                    scale: 1,
                    stagger: {
                        amount: 0.4,
                        from: "start"
                    },
                    duration: 0.5
                }
            );
        }
    });
}

// ============================================
// 4. NAVBAR ANIMATIONS
// ============================================

function initNavbarAnimations() {
    const nav = document.querySelector('nav');
    if (!nav) return;

    let lastScroll = 0;
    const navHeight = nav.offsetHeight;

    // ScrollTrigger pour la navbar
    ScrollTrigger.create({
        start: "top -100",
        onUpdate: (self) => {
            const currentScroll = self.scroll();

            // Ajouter/retirer classe scrolled
            if (currentScroll > 50) {
                nav.classList.add('scrolled');
            } else {
                nav.classList.remove('scrolled');
            }

            // Hide/Show navbar on scroll direction
            if (currentScroll > lastScroll && currentScroll > navHeight) {
                // Scroll down - hide
                gsap.to(nav, { y: -navHeight, duration: 0.3 });
            } else {
                // Scroll up - show
                gsap.to(nav, { y: 0, duration: 0.3 });
            }

            lastScroll = currentScroll;
        }
    });
}

// ============================================
// 5. MICRO-INTERACTIONS
// ============================================

function initMicroInteractions() {
    // Hover effect sur les boutons
    const buttons = document.querySelectorAll('.btn-primary, .btn-secondary, .cta-button');

    buttons.forEach(btn => {
        btn.addEventListener('mouseenter', () => {
            gsap.to(btn, {
                scale: 1.05,
                boxShadow: "0 10px 40px rgba(0, 240, 255, 0.3)",
                duration: 0.3
            });
        });

        btn.addEventListener('mouseleave', () => {
            gsap.to(btn, {
                scale: 1,
                boxShadow: "none",
                duration: 0.3
            });
        });
    });

    // Hover effect sur les cartes
    const cards = document.querySelectorAll('.service-card, .tarif-card, .build-card');

    cards.forEach(card => {
        card.addEventListener('mouseenter', () => {
            gsap.to(card, {
                scale: 1.03,
                boxShadow: "0 20px 60px rgba(0, 240, 255, 0.15)",
                borderColor: "rgba(0, 240, 255, 0.5)",
                duration: 0.4,
                ease: "power2.out"
            });
        });

        card.addEventListener('mouseleave', () => {
            gsap.to(card, {
                scale: 1,
                boxShadow: "none",
                borderColor: "rgba(0, 240, 255, 0.1)",
                duration: 0.4
            });
        });
    });

    // Animation des liens de navigation
    const navLinks = document.querySelectorAll('.nav-links a');

    navLinks.forEach(link => {
        link.addEventListener('mouseenter', () => {
            gsap.to(link, {
                color: "#00f0ff",
                textShadow: "0 0 10px rgba(0, 240, 255, 0.5)",
                duration: 0.2
            });
        });

        link.addEventListener('mouseleave', () => {
            gsap.to(link, {
                color: "",
                textShadow: "none",
                duration: 0.2
            });
        });
    });
}

// ============================================
// 6. PARTICLES BACKGROUND (Subtle)
// ============================================

function initParticles() {
    const canvas = document.createElement('canvas');
    canvas.id = 'particles-canvas';
    canvas.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 0;
        opacity: 0.3;
    `;

    // Insérer après le matrix-canvas ou au début du body
    const matrixCanvas = document.getElementById('matrix-canvas');
    if (matrixCanvas) {
        matrixCanvas.after(canvas);
    } else {
        document.body.prepend(canvas);
    }

    const ctx = canvas.getContext('2d');
    let particles = [];
    const particleCount = 50;

    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    function createParticle() {
        return {
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: Math.random() * 2 + 0.5,
            speedX: (Math.random() - 0.5) * 0.3,
            speedY: (Math.random() - 0.5) * 0.3,
            opacity: Math.random() * 0.5 + 0.1
        };
    }

    function init() {
        resize();
        particles = [];
        for (let i = 0; i < particleCount; i++) {
            particles.push(createParticle());
        }
    }

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        particles.forEach(p => {
            p.x += p.speedX;
            p.y += p.speedY;

            // Wrap around edges
            if (p.x < 0) p.x = canvas.width;
            if (p.x > canvas.width) p.x = 0;
            if (p.y < 0) p.y = canvas.height;
            if (p.y > canvas.height) p.y = 0;

            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(0, 240, 255, ${p.opacity})`;
            ctx.fill();
        });

        requestAnimationFrame(animate);
    }

    window.addEventListener('resize', resize);
    init();
    animate();
}

// ============================================
// 8. FORM FEEDBACK ANIMATIONS
// ============================================

function initFormAnimations() {
    const forms = document.querySelectorAll('form');

    forms.forEach(form => {
        const inputs = form.querySelectorAll('input, textarea, select');

        inputs.forEach(input => {
            // Focus animation
            input.addEventListener('focus', () => {
                gsap.to(input, {
                    borderColor: "#00f0ff",
                    boxShadow: "0 0 20px rgba(0, 240, 255, 0.2)",
                    duration: 0.3
                });
            });

            // Blur animation
            input.addEventListener('blur', () => {
                gsap.to(input, {
                    borderColor: "rgba(0, 240, 255, 0.2)",
                    boxShadow: "none",
                    duration: 0.3
                });
            });
        });
    });
}

// ============================================
// 9. TOAST NOTIFICATIONS
// ============================================

function showToast(message, type = 'success') {
    // Supprimer les toasts existants
    const existingToast = document.querySelector('.toast-notification');
    if (existingToast) existingToast.remove();

    const toast = document.createElement('div');
    toast.className = `toast-notification toast-${type}`;
    toast.innerHTML = `
        <span class="toast-icon">${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}</span>
        <span class="toast-message">${message}</span>
    `;

    toast.style.cssText = `
        position: fixed;
        bottom: 80px;
        right: 20px;
        padding: 15px 25px;
        background: ${type === 'success' ? 'rgba(0, 255, 136, 0.9)' : type === 'error' ? 'rgba(255, 68, 68, 0.9)' : 'rgba(0, 240, 255, 0.9)'};
        color: #000;
        border-radius: 10px;
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 10px;
        z-index: 10000;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
    `;

    document.body.appendChild(toast);

    // Animation d'entrée
    gsap.fromTo(toast,
        { opacity: 0, y: 50, scale: 0.8 },
        { opacity: 1, y: 0, scale: 1, duration: 0.4, ease: "back.out(1.7)" }
    );

    // Auto-remove après 4 secondes
    setTimeout(() => {
        gsap.to(toast, {
            opacity: 0,
            y: -20,
            duration: 0.3,
            onComplete: () => toast.remove()
        });
    }, 4000);
}

// Exposer globalement pour utilisation dans d'autres scripts
window.showToast = showToast;

// ============================================
// INITIALISATION
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    // Attendre que le site-content soit visible
    const siteContent = document.getElementById('site-content');

    // S'assurer que le contenu est visible immédiatement si pas d'animation matrix
    if (!siteContent) {
        initAllAnimations();
        return;
    }

    // Si opacity n'est pas défini ou est déjà visible, lancer immédiatement
    const currentOpacity = window.getComputedStyle(siteContent).opacity;
    if (currentOpacity !== '0' && siteContent.style.opacity !== '0') {
        siteContent.style.opacity = '1';
        initAllAnimations();
        return;
    }

    // Observer pour démarrer après l'animation matrix
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.attributeName === 'style' &&
                siteContent.style.opacity === '1') {
                initAllAnimations();
                observer.disconnect();
            }
        });
    });

    observer.observe(siteContent, { attributes: true });

    // Fallback rapide si l'animation matrix ne se déclenche pas (1.5s au lieu de 5s)
    setTimeout(() => {
        if (siteContent.style.opacity === '0' || window.getComputedStyle(siteContent).opacity === '0') {
            console.log('⚠️ Fallback: affichage forcé du contenu');
            siteContent.style.opacity = '1';
            initAllAnimations();
            observer.disconnect();
        }
    }, 1500);
});

function initAllAnimations() {
    console.log('🎨 Initialisation des animations GSAP...');

    initHeroAnimations();
    initScrollAnimations();
    initNavbarAnimations();
    initMicroInteractions();
    initFormAnimations();
    initParticles();

    console.log('✅ Animations initialisées !');
}

