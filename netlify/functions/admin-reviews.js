const fs = require('fs').promises;
const path = require('path');

const REVIEWS_FILE = path.join('/tmp', 'reviews.json');
const ADMIN_PASSWORD = 'HorizonIT2024!'; // Change ce mot de passe !

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
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    try {
        const { password, action, reviewId } = JSON.parse(event.body || '{}');

        // Vérifier le mot de passe
        if (password !== ADMIN_PASSWORD) {
            return {
                statusCode: 401,
                headers,
                body: JSON.stringify({ error: 'Mot de passe incorrect' })
            };
        }

        const reviews = await getReviews();

        // GET - Voir tous les avis (approuvés et en attente)
        if (event.httpMethod === 'GET') {
            return {
                statusCode: 200,
                headers: { ...headers, 'Content-Type': 'application/json' },
                body: JSON.stringify(reviews)
            };
        }

        // POST - Approuver ou supprimer un avis
        if (event.httpMethod === 'POST') {
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
            } else if (action === 'delete') {
                reviews.splice(reviewIndex, 1);
            }

            await saveReviews(reviews);

            return {
                statusCode: 200,
                headers: { ...headers, 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: 'Action effectuée avec succès' })
            };
        }

    } catch (error) {
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Erreur serveur' })
        };
    }
};