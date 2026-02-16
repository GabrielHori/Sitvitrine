/**
 * ============================================
 * HORIZON IT - API AVIS CLIENTS
 * ============================================
 *
 * Endpoints:
 * - GET  /api/reviews     → Récupère les avis approuvés
 * - POST /api/reviews     → Soumet un nouvel avis
 */

const {
    validateReviewData,
    successResponse,
    errorResponse,
    optionsResponse,
    logger
} = require('./utils/shared');

const {
    getReviews,
    addReview
} = require('./utils/supabase');

// ============================================
// HANDLER PRINCIPAL
// ============================================

exports.handler = async (event) => {
    // Preflight CORS
    if (event.httpMethod === 'OPTIONS') {
        return optionsResponse();
    }

    const clientIP = event.headers['x-forwarded-for'] ||
        event.headers['client-ip'] ||
        'unknown';

    try {
        // ========================================
        // GET - Récupérer les avis approuvés
        // ========================================
        if (event.httpMethod === 'GET') {
            const reviews = await getReviews(true); // true = approuvés uniquement

            logger.info(`📋 ${reviews.length} avis approuvés envoyés`);
            return successResponse(reviews);
        }

        // ========================================
        // POST - Ajouter un nouvel avis
        // ========================================
        if (event.httpMethod === 'POST') {
            logger.info('📝 Nouvelle soumission d\'avis');

            // Parse du body
            let rawData;
            try {
                rawData = JSON.parse(event.body);
            } catch (parseError) {
                logger.warn('Erreur parsing JSON');
                return errorResponse('Format JSON invalide', 400);
            }

            // Validation des données
            const validation = validateReviewData(rawData);
            if (!validation.valid) {
                logger.warn('Validation échouée:', validation.errors);
                return errorResponse(
                    'Données invalides',
                    400,
                    validation.errors
                );
            }

            // Ajout en base de données
            const newReview = await addReview(validation.data, clientIP);

            logger.info(`✅ Avis ajouté: ${validation.data.name} - ${validation.data.rating}⭐`);

            return successResponse({
                message: 'Avis ajouté avec succès ! Il sera visible après modération.',
                review: {
                    id: newReview.id,
                    name: newReview.name,
                    rating: newReview.rating
                }
            }, 201);
        }

        // Méthode non autorisée
        return errorResponse('Méthode non autorisée', 405);

    } catch (error) {
        logger.error('Erreur reviews:', error.message);

        // Erreur de validation personnalisée
        if (error.message.includes('invalide')) {
            return errorResponse(error.message, 400);
        }

        return errorResponse('Erreur serveur interne', 500);
    }
};
