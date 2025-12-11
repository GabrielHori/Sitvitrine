const jwt = require('jsonwebtoken');

// Fonction pour lire les avis depuis le stockage
async function getReviews() {
    try {
        const fs = require('fs').promises;
        const path = require('path');
        const filePath = path.join('/tmp', 'reviews.json');
        
        const data = await fs.readFile(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.log('📁 Fichier avis non trouvé, retour aux avis par défaut');
        return [
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
    }
}

// Fonction pour sauvegarder les avis
async function saveReviews(reviews) {
    try {
        const fs = require('fs').promises;
        const path = require('path');
        const filePath = path.join('/tmp', 'reviews.json');
        
        await fs.writeFile(filePath, JSON.stringify(reviews, null, 2));
        console.log(`💾 ${reviews.length} avis sauvegardés`);
    } catch (error) {
        console.error('❌ Erreur sauvegarde:', error);
        throw error;
    }
}

// Vérifier le token JWT
function verifyToken(token) {
    try {
        return jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
        console.error('❌ Token invalide:', error.message);
        return null;
    }
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
        // Vérifier l'authentification
        const authHeader = event.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            console.log('❌ Token manquant');
            return {
                statusCode: 401,
                headers,
                body: JSON.stringify({ error: 'Token manquant' })
            };
        }

        const token = authHeader.split(' ')[1];
        const decoded = verifyToken(token);
        
        if (!decoded) {
            console.log('❌ Token invalide');
            return {
                statusCode: 401,
                headers,
                body: JSON.stringify({ error: 'Token invalide' })
            };
        }

        console.log('✅ Admin authentifié:', decoded.admin);

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
                console.log(`✅ Avis ${reviewId} approuvé par admin`);
            } else if (action === 'delete') {
                reviews.splice(reviewIndex, 1);
                console.log(`🗑️ Avis ${reviewId} supprimé par admin`);
            }

            await saveReviews(reviews);

            return {
                statusCode: 200,
                headers: { ...headers, 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: 'Action effectuée avec succès' })
            };
        }

        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Méthode non autorisée' })
        };

    } catch (error) {
        console.error('🚨 Erreur admin:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Erreur serveur' })
        };
    }
};

