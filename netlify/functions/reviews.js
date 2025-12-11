const fs = require('fs').promises;
const path = require('path');

// Fichier pour stocker les avis
const REVIEWS_FILE = path.join('/tmp', 'reviews.json');

// Avis par défaut
const defaultReviews = [
    {
        id: 1,
        name: "Thomas M.",
        rating: 5,
        service: "Montage PC Gaming",
        text: "Service au top ! Mon PC gaming fonctionne parfaitement, cable management impeccable. Je recommande vivement !",
        date: "2024-12-15",
        approved: true
    },
    {
        id: 2,
        name: "Sarah L.",
        rating: 5,
        service: "Dépannage PC",
        text: "Intervention rapide pour un écran bleu. Problème résolu en 1h, très professionnel !",
        date: "2024-12-10",
        approved: true
    },
    {
        id: 3,
        name: "Kevin R.",
        rating: 4,
        service: "Optimisation PC",
        text: "PC beaucoup plus rapide après optimisation. Bon rapport qualité/prix.",
        date: "2024-12-08",
        approved: true
    }
];

// Lire les avis
async function getReviews() {
    try {
        const data = await fs.readFile(REVIEWS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        // Si le fichier n'existe pas, retourner les avis par défaut
        await saveReviews(defaultReviews);
        return defaultReviews;
    }
}

// Sauvegarder les avis
async function saveReviews(reviews) {
    await fs.writeFile(REVIEWS_FILE, JSON.stringify(reviews, null, 2));
}

exports.handler = async (event, context) => {
    // Headers CORS
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
    };

    // Gérer les requêtes OPTIONS (CORS preflight)
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers,
            body: ''
        };
    }

    try {
        // GET - Récupérer les avis approuvés
        if (event.httpMethod === 'GET') {
            const reviews = await getReviews();
            const approvedReviews = reviews.filter(review => review.approved);
            
            return {
                statusCode: 200,
                headers: {
                    ...headers,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(approvedReviews)
            };
        }

        // POST - Ajouter un nouvel avis
        if (event.httpMethod === 'POST') {
            const { name, rating, service, text } = JSON.parse(event.body);
            
            // Validation
            if (!name || !rating || !service || !text) {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({ error: 'Tous les champs sont requis' })
                };
            }

            const reviews = await getReviews();
            const newReview = {
                id: Date.now(),
                name: name.trim(),
                rating: parseInt(rating),
                service: service.trim(),
                text: text.trim(),
                date: new Date().toISOString().split('T')[0],
                approved: false // En attente d'approbation
            };

            reviews.unshift(newReview);
            await saveReviews(reviews);

            return {
                statusCode: 201,
                headers: {
                    ...headers,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    message: 'Avis ajouté avec succès, en attente d\'approbation',
                    review: newReview 
                })
            };
        }

        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Méthode non autorisée' })
        };

    } catch (error) {
        console.error('Erreur:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Erreur serveur' })
        };
    }
};