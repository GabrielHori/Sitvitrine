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

// Toggle menu
burger.addEventListener('click', () => {
    nav.classList.toggle('nav-active');
    burger.classList.toggle('toggle');
});

// Close menu when clicking on a link (mobile)
navLinks.forEach(link => {
    link.addEventListener('click', () => {
        if (nav.classList.contains('nav-active')) {
            nav.classList.remove('nav-active');
            burger.classList.remove('toggle');
        }
    });
});
