const fs = require('fs').promises;
const path = require('path');

const REVIEWS_FILE = path.join('/tmp', 'reviews.json');
const rateLimiter = new Map();

// Validation et sanitisation
function validateAndSanitize(data) {
    const { name, rating, service, text } = data;
    
    // Validation stricte
    if (!name || typeof name !== 'string' || name.length < 2 || name.length > 50) {
        throw new Error('Nom invalide (2-50 caractères)');
    }
    
    if (!rating || !Number.isInteger(parseInt(rating)) || rating < 1 || rating > 5) {
        throw new Error('Note invalide (1-5)');
    }
    
    if (!service || typeof service !== 'string' || service.length < 3 || service.length > 100) {
        throw new Error('Service invalide');
    }
    
    if (!text || typeof text !== 'string' || text.length < 10 || text.length > 500) {
        throw new Error('Commentaire invalide (10-500 caractères)');
    }
    
    // Sanitisation (supprimer HTML/scripts)
    return {
        name: name.replace(/<[^>]*>/g, '').trim(),
        rating: parseInt(rating),
        service: service.replace(/<[^>]*>/g, '').trim(),
        text: text.replace(/<[^>]*>/g, '').trim()
    };
}

// Rate limiting
function checkRateLimit(clientIP) {
    const now = Date.now();
    const windowMs = 3600000; // 1 heure
    const maxRequests = 3;
    
    if (!rateLimiter.has(clientIP)) {
        rateLimiter.set(clientIP, []);
    }
    
    const requests = rateLimiter.get(clientIP);
    const recentRequests = requests.filter(time => now - time < windowMs);
    
    if (recentRequests.length >= maxRequests) {
        return false;
    }
    
    recentRequests.push(now);
    rateLimiter.set(clientIP, recentRequests);
    return true;
}

// Avis par défaut sécurisés
const defaultReviews = [
    {
        id: 999,
        name: "Thomas M.",
        rating: 5,
        service: "Montage PC Gaming",
        text: "Service au top ! Mon PC gaming fonctionne parfaitement, cable management impeccable. Je recommande vivement !",
        date: "2024-12-15",
        approved: true,
        isDefault: true
    },
    {
        id: 998,
        name: "Sarah L.",
        rating: 5,
        service: "Dépannage PC",
        text: "Intervention rapide pour un écran bleu. Problème résolu en 1h, très professionnel !",
        date: "2024-12-10",
        approved: true,
        isDefault: true
    },
    {
        id: 997,
        name: "Kevin R.",
        rating: 4,
        service: "Optimisation PC",
        text: "PC beaucoup plus rapide après optimisation. Bon rapport qualité/prix.",
        date: "2024-12-08",
        approved: true,
        isDefault: true
    }
];

async function getReviews() {
    try {
        const data = await fs.readFile(REVIEWS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        await saveReviews(defaultReviews);
        return defaultReviews;
    }
}

async function saveReviews(reviews) {
    await fs.writeFile(REVIEWS_FILE, JSON.stringify(reviews, null, 2));
}

exports.handler = async (event, context) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    const clientIP = event.headers['x-forwarded-for'] || event.headers['client-ip'] || 'unknown';

    try {
        // GET - Récupérer les avis approuvés
        if (event.httpMethod === 'GET') {
            const reviews = await getReviews();
            const approvedReviews = reviews.filter(review => review.approved);
            
            return {
                statusCode: 200,
                headers: { ...headers, 'Content-Type': 'application/json' },
                body: JSON.stringify(approvedReviews)
            };
        }

        // POST - Ajouter un nouvel avis
        if (event.httpMethod === 'POST') {
            // Rate limiting
            if (!checkRateLimit(clientIP)) {
                console.log(`🚨 RATE LIMIT: IP ${clientIP} a dépassé la limite`);
                return {
                    statusCode: 429,
                    headers,
                    body: JSON.stringify({ 
                        error: 'Trop de tentatives. Réessayez dans 1 heure.' 
                    })
                };
            }

            const rawData = JSON.parse(event.body);
            const validatedData = validateAndSanitize(rawData);
            
            const reviews = await getReviews();
            const newReview = {
                id: Date.now(),
                ...validatedData,
                date: new Date().toISOString().split('T')[0],
                approved: false,
                ip: clientIP.substring(0, 10) + '***' // IP partielle pour logs
            };

            reviews.unshift(newReview);
            await saveReviews(reviews);

            console.log(`✅ Nouvel avis ajouté: ${validatedData.name} - ${validatedData.rating}⭐`);

            return {
                statusCode: 201,
                headers: { ...headers, 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    message: 'Avis ajouté avec succès, en attente d\'approbation',
                    review: { ...newReview, ip: undefined } // Ne pas renvoyer l'IP
                })
            };
        }

        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Méthode non autorisée' })
        };

    } catch (error) {
        console.error('🚨 Erreur reviews:', error.message);
        
        if (error.message.includes('invalide')) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: error.message })
            };
        }
        
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Erreur serveur' })
        };
    }
};

