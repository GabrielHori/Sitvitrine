/**
 * ============================================================
 * HORIZON IT - ADMIN AVIS
 * ============================================================
 */

const jwt = require('jsonwebtoken');

const {
    successResponse,
    errorResponse,
    optionsResponse
} = require('./utils/shared');

const {
    getReviews,
    updateReviewStatus,
    deleteReview
} = require('./utils/supabase');

function verifyAdminToken(authHeader) {
    if (!authHeader || !authHeader.startsWith('Bearer ') || !process.env.JWT_SECRET) return null;
    try {
        const decoded = jwt.verify(authHeader.slice(7).trim(), process.env.JWT_SECRET);
        return decoded?.admin === true ? decoded : null;
    } catch {
        return null;
    }
}

exports.handler = async (event) => {
    if (event.httpMethod === 'OPTIONS') return optionsResponse();

    if (!verifyAdminToken(event.headers?.authorization)) {
        return errorResponse('Non autorisé', 401);
    }

    try {
        if (event.httpMethod === 'GET') {
            return successResponse(await getReviews(false));
        }

        if (event.httpMethod === 'POST') {
            let body;
            try { body = JSON.parse(event.body || '{}'); }
            catch { return errorResponse('Format JSON invalide', 400); }

            const reviewId = Number(body.reviewId);
            if (!Number.isInteger(reviewId) || reviewId <= 0) {
                return errorResponse('reviewId invalide', 400);
            }

            if (body.action === 'approve') {
                await updateReviewStatus(reviewId, true);
                return successResponse({ message: 'Avis approuvé avec succès', reviewId });
            }

            if (body.action === 'reject') {
                await updateReviewStatus(reviewId, false);
                return successResponse({ message: 'Avis rejeté', reviewId });
            }

            if (body.action === 'delete') {
                await deleteReview(reviewId);
                return successResponse({ message: 'Avis supprimé définitivement', reviewId });
            }

            return errorResponse('Action non reconnue', 400);
        }

        return errorResponse('Méthode non autorisée', 405);
    } catch (error) {
        console.error('Erreur admin-reviews:', error);
        return errorResponse('Erreur serveur interne', 500);
    }
};
