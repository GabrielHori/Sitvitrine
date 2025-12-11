const fs = require('fs').promises;
const path = require('path');

const REVIEWS_FILE = path.join('/tmp', 'reviews.json');
const rateLimiter = new Map();

// Validation et sanitisation (VERSION CORRIGÉE)
function validateAndSanitize(data) {
    console.log('🔍 Données reçues:', data);
    
    const { name, rating, service, text } = data;
    
    // Validation avec logs détaillés
    if (!name || typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 50) {
        console.log('❌ Nom invalide:', name);
        throw new Error('Nom invalide (2-50 caractères)');
    }
    
    // Convertir rating en nombre si c'est une string
    const ratingNum = typeof rating === 'string' ? parseInt(rating) : rating;
    if (!ratingNum || !Number.isInteger(ratingNum) || ratingNum < 1 || ratingNum > 5) {
        console.log('❌ Rating invalide:', rating, 'converti en:', ratingNum);
        throw new Error('Note invalide (1-5)');
    }
    
    if (!service || typeof service !== 'string' || service.trim().length < 3 || service.trim().length > 100) {
        console.log('❌ Service invalide:', service);
        throw new Error('Service invalide (3-100 caractères)');
    }
    
    if (!text || typeof text !== 'string' || text.trim().length < 10 || text.trim().length > 500) {
        console.log('❌ Texte invalide:', text);
        throw new Error('Commentaire invalide (10-500 caractères)');
    }
    
    // Sanitisation
    const sanitized = {
        name: name.replace(/<[^>]*>/g, '').trim(),
        rating: ratingNum,
        service: service.replace(/<[^>]*>/g, '').trim(),
        text: text.replace(/<[^>]*>/g, '').trim()
    };
    
    console.log('✅ Données validées:', sanitized);
    return sanitized;
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
            console.log('📝 Nouvelle tentative d\'ajout d\'avis');
            console.log('📦 Body reçu:', event.body);
            
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

            // Parse et validation
            let rawData;
            try {
                rawData = JSON.parse(event.body);
            } catch (parseError) {
                console.log('❌ Erreur parsing JSON:', parseError);
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({ error: 'Format JSON invalide' })
                };
            }

            const validatedData = validateAndSanitize(rawData);
            
            const reviews = await getReviews();
            const newReview = {
                id: Date.now(),
                ...validatedData,
                date: new Date().toISOString().split('T')[0],
                approved: false,
                ip: clientIP.substring(0, 10) + '***'
            };

            reviews.unshift(newReview);
            await saveReviews(reviews);

            console.log(`✅ Nouvel avis ajouté: ${validatedData.name} - ${validatedData.rating}⭐`);

            return {
                statusCode: 201,
                headers: { ...headers, 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    message: 'Avis ajouté avec succès, en attente d\'approbation',
                    review: { ...newReview, ip: undefined }
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
        console.error('🚨 Stack:', error.stack);
        
        if (error.message.includes('invalide')) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ 
                    error: error.message,
                    details: 'Vérifiez que tous les champs sont correctement remplis'
                })
            };
        }
        
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Erreur serveur interne' })
        };
    }
};



