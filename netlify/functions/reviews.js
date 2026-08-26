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
    getClientIdentifier,
    checkRateLimit,
    verifyTurnstile,
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
            const rateLimit = checkRateLimit(
                'review',
                getClientIdentifier(event),
                3,
                24 * 60 * 60 * 1000
            );
            if (!rateLimit.allowed) {
                return errorResponse(
                    `Trop d'avis envoyés. Réessayez dans ${Math.ceil(rateLimit.retryAfter / 3600)} heure(s).`,
                    429
                );
            }

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

            const turnstile = await verifyTurnstile(
                rawData.turnstileToken,
                getClientIdentifier(event),
                'review'
            );
            if (!turnstile.valid) {
                return errorResponse('Vérification anti-spam invalide. Réessayez.', 403);
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
