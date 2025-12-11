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
        const reviews = JSON.parse(data);
        console.log(`📖 Admin lit ${reviews.length} avis depuis ${REVIEWS_FILE}`);
        return reviews;
    } catch (error) {
        console.log('📝 Admin: Fichier avis introuvable, retour tableau vide');
        return [];
    }
}

async function saveReviews(reviews) {
    console.log(`💾 Admin sauvegarde ${reviews.length} avis dans ${REVIEWS_FILE}`);
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
        // TEMPORAIRE : Pas d'auth pour tester - SUPPRIME CETTE LIGNE
        // const reviews = await getReviews();

        // VÉRIFICATION TOKEN (RÉACTIVE CETTE PARTIE)
        const authHeader = event.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return {
                statusCode: 401,
                headers,
                body: JSON.stringify({ error: 'Token manquant' })
            };
        }

        const token = authHeader.split(' ')[1];
        const decoded = verifyToken(token);
        
        if (!decoded) {
            return {
                statusCode: 401,
                headers,
                body: JSON.stringify({ error: 'Token invalide' })
            };
        }

        const reviews = await getReviews();

        // GET - Voir tous les avis
        if (event.httpMethod === 'GET') {
            console.log(`📋 Admin récupère ${reviews.length} avis`);
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
                console.log(`✅ Avis ${reviewId} approuvé`);
            } else if (action === 'delete') {
                reviews.splice(reviewIndex, 1);
                console.log(`🗑️ Avis ${reviewId} supprimé`);
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



