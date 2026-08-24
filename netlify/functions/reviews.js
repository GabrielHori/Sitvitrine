/**
 * ============================================================
 * HORIZON IT - API AVIS CLIENTS
 * ============================================================
 */

const {
    validateReviewData,
    successResponse,
    errorResponse,
    optionsResponse,
    logger
} = require('./utils/shared');

const { getReviews, addReview } = require('./utils/supabase');

exports.handler = async (event) => {
    if (event.httpMethod === 'OPTIONS') {
        return optionsResponse();
    }

    const clientIP =
        event.headers?.['x-forwarded-for'] ||
        event.headers?.['client-ip'] ||
        'unknown';

    try {
        if (event.httpMethod === 'GET') {
            const reviews = await getReviews(true);
            return successResponse(reviews);
        }

        if (event.httpMethod === 'POST') {
            let rawData;
            try {
                rawData = JSON.parse(event.body || '{}');
            } catch {
                return errorResponse('Format JSON invalide', 400);
            }

            const validation = validateReviewData(rawData);
            if (!validation.valid) {
                return errorResponse('Données invalides', 400, validation.errors);
            }

            const newReview = await addReview(validation.data, clientIP);

            return successResponse({
                message: 'Avis ajouté avec succès ! Il sera visible après modération.',
                review: {
                    id: newReview.id,
                    name: newReview.name,
                    rating: newReview.rating
                }
            }, 201);
        }

        return errorResponse('Méthode non autorisée', 405);
    } catch (error) {
        logger.error('Erreur reviews:', error);
        return errorResponse('Erreur serveur interne', 500);
    }
};
