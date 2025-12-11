const fs = require('fs').promises;
const path = require('path');
const jwt = require('jsonwebtoken');

const REVIEWS_FILE = path.join('/tmp', 'reviews.json');

// Vérifier le token JWT
function verifyToken(token) {
    try {
        return jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
        return null;
    }
}

async function getReviews() {
    try {
        const data = await fs.readFile(REVIEWS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return [];
    }
}

async function saveReviews(reviews) {
    await fs.writeFile(REVIEWS_FILE, JSON.stringify(reviews, null, 2));
}

exports.handler = async (event, context) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    try {
        // Vérifier l'authentification JWT
        const authHeader = event.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return {
                statusCode: 401,
                headers,
                body: JSON.stringify({ error: 'Token manquant' })
            };
        }

        const token = authHeader.substring(7);
        const decoded = verifyToken(token);
        
        if (!decoded || !decoded.admin) {
            console.log(`🚨 SECURITY: Token invalide depuis IP ${event.headers['x-forwarded-for']}`);
            return {
                statusCode: 401,
                headers,
                body: JSON.stringify({ error: 'Token invalide' })
            };
        }

        const reviews = await getReviews();

        // GET - Voir tous les avis
        if (event.httpMethod === 'GET') {
            console.log('📊 Admin: Consultation des avis');
            return {
                statusCode: 200,
                headers: { ...headers, 'Content-Type': 'application/json' },
                body: JSON.stringify(reviews)
            };
        }

        // POST - Approuver ou supprimer
        if (event.httpMethod === 'POST') {
            const { action, reviewId } = JSON.parse(event.body);
            
            const reviewIndex = reviews.findIndex(r => r.id === parseInt(reviewId));
            
            if (reviewIndex === -1) {
                return {
                    statusCode: 404,
                    headers,
                    body: JSON.stringify({ error: 'Avis non trouvé' })
                };
            }

            if (action === 'approve') {
                reviews[reviewIndex].approved = true;
                console.log(`✅ Admin: Avis approuvé - ID ${reviewId}`);
            } else if (action === 'delete') {
                const deletedReview = reviews.splice(reviewIndex, 1)[0];
                console.log(`🗑️ Admin: Avis supprimé - ${deletedReview.name}`);
            }

            await saveReviews(reviews);

            return {
                statusCode: 200,
                headers: { ...headers, 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: 'Action effectuée avec succès' })
            };
        }

    } catch (error) {
        console.error('🚨 Erreur admin:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Erreur serveur' })
        };
    }
};
