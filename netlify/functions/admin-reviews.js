/**
 * ============================================
 * HORIZON IT - API ADMIN AVIS
 * ============================================
 *
 * Endpoints protégés par JWT:
 * - GET  /api/admin-reviews     → Liste tous les avis (même non approuvés)
 * - POST /api/admin-reviews     → Approuver ou supprimer un avis
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

// ============================================
// VÉRIFICATION JWT
// ============================================

function verifyToken(token) {
    try {
        if (!process.env.JWT_SECRET) {
            console.error('❌ JWT_SECRET non configuré');
            return null;
        }
        return jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
        console.error('❌ Token invalide:', error.message);
        return null;
    }
}

function extractToken(authHeader) {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }
    return authHeader.split(' ')[1];
}

// ============================================
// HANDLER PRINCIPAL
// ============================================

exports.handler = async (event) => {
    // Preflight CORS
    if (event.httpMethod === 'OPTIONS') {
        return optionsResponse();
    }

    try {
        // ========================================
        // Vérification de l'authentification
        // ========================================
        const token = extractToken(event.headers.authorization);

        if (!token) {
            console.log('❌ Token manquant');
            return errorResponse('Token d\'authentification requis', 401);
        }

        const decoded = verifyToken(token);

        if (!decoded || !decoded.admin) {
            console.log('❌ Token invalide ou non-admin');
            return errorResponse('Token invalide ou expiré', 401);
        }

        console.log('✅ Admin authentifié');

        // ========================================
        // GET - Récupérer TOUS les avis
        // ========================================
        if (event.httpMethod === 'GET') {
            const reviews = await getReviews(false); // false = tous les avis

            console.log(`📋 Admin: ${reviews.length} avis récupérés`);
            return successResponse(reviews);
        }

        // ========================================
        // POST - Actions admin (approuver/supprimer)
        // ========================================
        if (event.httpMethod === 'POST') {
            let body;
            try {
                body = JSON.parse(event.body);
            } catch (e) {
                return errorResponse('Format JSON invalide', 400);
            }

            const { action, reviewId } = body;

            if (!action || !reviewId) {
                return errorResponse('Action et reviewId requis', 400);
            }

            // Action: Approuver
            if (action === 'approve') {
                await updateReviewStatus(parseInt(reviewId), true);
                console.log(`✅ Avis ${reviewId} approuvé`);
                return successResponse({
                    message: 'Avis approuvé avec succès',
                    reviewId
                });
            }

            // Action: Rejeter (désapprouver)
            if (action === 'reject') {
                await updateReviewStatus(parseInt(reviewId), false);
                console.log(`⛔ Avis ${reviewId} rejeté`);
                return successResponse({
                    message: 'Avis rejeté',
                    reviewId
                });
            }

            // Action: Supprimer
            if (action === 'delete') {
                await deleteReview(parseInt(reviewId));
                console.log(`🗑️ Avis ${reviewId} supprimé`);
                return successResponse({
                    message: 'Avis supprimé définitivement',
                    reviewId
                });
            }

            return errorResponse('Action non reconnue (approve/reject/delete)', 400);
        }

        return errorResponse('Méthode non autorisée', 405);

    } catch (error) {
        console.error('🚨 Erreur admin-reviews:', error);
        return errorResponse('Erreur serveur interne', 500);
    }
};
