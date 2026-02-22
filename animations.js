/**
 * ============================================
 * HORIZON IT v2.0 - ANIMATIONS GSAP
 * ============================================
 * GSAP + ScrollTrigger pour les animations premium
 * ============================================
 */

// Wait for DOM and GSAP to be ready
document.addEventListener('DOMContentLoaded', () => {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
        console.warn('⚠️ GSAP not loaded, skipping advanced animations');
        return;
    }

    // Check for reduced motion preference
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        return;
    }

    gsap.registerPlugin(ScrollTrigger);

    // ── Hero Animations ──
    const heroTl = gsap.timeline({ delay: 1.8 }); // Wait for matrix animation

    heroTl
        .from('.hero-badge', {
            opacity: 0,
            y: 20,
            duration: 0.6,
            ease: 'power3.out'
        })
        .from('.hero-title .line', {
            opacity: 0,
            y: 40,
            stagger: 0.15,
            duration: 0.8,
            ease: 'power3.out'
        }, '-=0.3')
        .from('.hero-description', {
            opacity: 0,
            y: 20,
            duration: 0.6,
            ease: 'power3.out'
        }, '-=0.4')
        .from('.hero-actions .btn', {
            opacity: 0,
            y: 20,
            stagger: 0.1,
            duration: 0.5,
            ease: 'power3.out'
        }, '-=0.3')
        .from('.hero-trust .trust-item', {
            opacity: 0,
            y: 15,
            stagger: 0.08,
            duration: 0.4,
            ease: 'power3.out'
        }, '-=0.2')
        .from('.floating-card', {
            opacity: 0,
            scale: 0.8,
            stagger: 0.15,
            duration: 0.6,
            ease: 'back.out(1.7)'
        }, '-=0.5')
        .from('.scroll-hint', {
            opacity: 0,
            y: -10,
            duration: 0.5,
            ease: 'power2.out'
        }, '-=0.2');

    // ── Section Headers ──
    gsap.utils.toArray('.section-header').forEach(header => {
        gsap.from(header.children, {
            scrollTrigger: {
                trigger: header,
                start: 'top 85%',
                toggleActions: 'play none none none'
            },
            opacity: 0,
            y: 30,
            stagger: 0.1,
            duration: 0.7,
            ease: 'power3.out'
        });
    });

    // ── Service Cards Stagger ──
    ScrollTrigger.batch('.service-card', {
        start: 'top 85%',
        onEnter: (elements) => {
            gsap.from(elements, {
                opacity: 0,
                y: 40,
                stagger: 0.1,
                duration: 0.7,
                ease: 'power3.out'
            });
        },
        once: true
    });

    // ── Why Cards ──
    ScrollTrigger.batch('.why-card', {
        start: 'top 85%',
        onEnter: (elements) => {
            gsap.from(elements, {
                opacity: 0,
                y: 30,
                stagger: 0.12,
                duration: 0.6,
                ease: 'power3.out'
            });
        },
        once: true
    });

    // ── Stats Counter Animation ──
    gsap.from('.stat-item', {
        scrollTrigger: {
            trigger: '.stats-section',
            start: 'top 80%',
            toggleActions: 'play none none none'
        },
        opacity: 0,
        y: 20,
        stagger: 0.1,
        duration: 0.5,
        ease: 'power2.out'
    });

    // ── Process Timeline ──
    gsap.utils.toArray('.process-step').forEach((step, i) => {
        gsap.from(step, {
            scrollTrigger: {
                trigger: step,
                start: 'top 85%',
                toggleActions: 'play none none none'
            },
            opacity: 0,
            x: -30,
            duration: 0.6,
            delay: i * 0.1,
            ease: 'power3.out'
        });
    });

    // ── Gallery Items ──
    ScrollTrigger.batch('.gallery-item', {
        start: 'top 85%',
        onEnter: (elements) => {
            gsap.from(elements, {
                opacity: 0,
                scale: 0.95,
                stagger: 0.1,
                duration: 0.7,
                ease: 'power3.out'
            });
        },
        once: true
    });

    // ── Reassurance Items ──
    ScrollTrigger.batch('.reassurance-item', {
        start: 'top 85%',
        onEnter: (elements) => {
            gsap.from(elements, {
                opacity: 0,
                y: 20,
                stagger: 0.08,
                duration: 0.5,
                ease: 'power2.out'
            });
        },
        once: true
    });

    // ── Price Cards ──
    ScrollTrigger.batch('.price-card', {
        start: 'top 85%',
        onEnter: (elements) => {
            gsap.from(elements, {
                opacity: 0,
                y: 30,
                stagger: 0.1,
                duration: 0.6,
                ease: 'power3.out'
            });
        },
        once: true
    });

    // ── FAQ Items ──
    ScrollTrigger.batch('.faq-item', {
        start: 'top 90%',
        onEnter: (elements) => {
            gsap.from(elements, {
                opacity: 0,
                y: 15,
                stagger: 0.06,
                duration: 0.4,
                ease: 'power2.out'
            });
        },
        once: true
    });

    // ── Contact Grid ──
    gsap.from('.contact-info-card', {
        scrollTrigger: {
            trigger: '.contact-grid',
            start: 'top 80%',
            toggleActions: 'play none none none'
        },
        opacity: 0,
        x: -20,
        stagger: 0.1,
        duration: 0.5,
        ease: 'power3.out'
    });

    gsap.from('.contact-form-box', {
        scrollTrigger: {
            trigger: '.contact-grid',
            start: 'top 80%',
            toggleActions: 'play none none none'
        },
        opacity: 0,
        x: 20,
        duration: 0.7,
        ease: 'power3.out'
    });

    // ── Urgence Section ──
    gsap.from('.urgence-container', {
        scrollTrigger: {
            trigger: '.urgence-section',
            start: 'top 85%',
            toggleActions: 'play none none none'
        },
        opacity: 0,
        y: 30,
        duration: 0.7,
        ease: 'power3.out'
    });

    // ── Nav scroll effect ──
    ScrollTrigger.create({
        start: 'top -80',
        end: 99999,
        toggleClass: {
            className: 'scrolled',
            targets: '#main-nav'
        }
    });

    console.log('✨ GSAP animations initialized');
});
