  const canvas = document.getElementById('matrix-canvas');
    const ctx = canvas.getContext('2d');
    const siteContent = document.getElementById('site-content');
    
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const binary = "01";
    const characters = binary.split("");

    const fontSize = 16;
    const columns = canvas.width / fontSize; 

    const drops = [];
    for (let i = 0; i < columns; i++) {
        drops[i] = 1;
    }

    // Fonction d'animation Matrix (inchangée)
    function draw() {
        ctx.fillStyle = "rgba(5, 5, 5, 0.05)"; 
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = "#00f0ff"; 
        ctx.shadowColor = "#00f0ff";
        ctx.shadowBlur = 5;
        ctx.font = fontSize + "px 'Rajdhani', monospace";

        for (let i = 0; i < drops.length; i++) {
            const text = characters[Math.floor(Math.random() * characters.length)];
            ctx.fillText(text, i * fontSize, drops[i] * fontSize);

            if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
                drops[i] = 0;
            }

            drops[i]++;
        }
    }

    // Lancer l'animation
    const animationInterval = setInterval(draw, 35);

    // --- Arrêt progressif et fondu enchaîné ---
    // Total de l'intro = 4.5 secondes (4500ms)

    setTimeout(() => {
        // 1. ARRÊT DU DESSIN APRÈS 3.5s
        // Le code arrête la logique de descente des chiffres, mais la traînée (fade) continue
        clearInterval(animationInterval); 
        
        // On rend la traînée du canvas plus transparente pour accélérer son effacement visuel
        ctx.fillStyle = "rgba(5, 5, 5, 0.1)"; 

        // 2. DÉMARRAGE DU FADE-OUT DU CANVAS (dure 1.5s)
        canvas.style.transition = "opacity 1.5s ease-in"; // Augmenté à 1.5s
        canvas.style.opacity = 0;

        // 3. DÉMARRAGE DU FADE-IN DU CONTENU (dure 1.5s, mais démarre 0.5s après)
        // L'effet "0.5s" permet de commencer à voir le site apparaître quand l'animation Matrix est déjà bien transparente.
        siteContent.style.transition = "opacity 1.5s ease-in 0.5s";
        siteContent.style.opacity = 1;

        // 4. NETTOYAGE : Suppression du canvas du DOM une fois que tout est fini
        setTimeout(() => {
            canvas.remove();
        }, 2000); // On attend 2 secondes après le début du fade-out pour être sûr

    }, 3000); // <-- On laisse l'animation "vivre" pendant 3 secondes (au lieu de 3.5s) avant le fondu.

    // Gestion du Responsive
    window.addEventListener('resize', () => {
        if (canvas) {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        }
    });