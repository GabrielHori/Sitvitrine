/**
 * ============================================================
 * HORIZON IT - STATISTIQUES PUBLIQUES
 * ============================================================
 */

const {
    successResponse,
    errorResponse,
    optionsResponse,
    logger
} = require('./utils/shared');

const { getSupabaseClient } = require('./utils/supabase');

const DEFAULT_STATS = {
    pcBuilt: 0,
    happyClients: 0,
    responseTime: 24,
    successRate: 100,
    avgRating: 0,
    totalReviews: 0
};

exports.handler = async (event) => {
    if (event.httpMethod === 'OPTIONS') {
        return optionsResponse();
    }

    if (event.httpMethod !== 'GET') {
        return errorResponse('Méthode non autorisée', 405);
    }

    try {
        const client = getSupabaseClient();
        if (!client) return successResponse(DEFAULT_STATS);

        const stats = await getStatsFromDB(client);
        return successResponse(stats);
    } catch (error) {
        logger.error('Erreur stats:', error);
        return successResponse(DEFAULT_STATS);
    }
};

async function getStatsFromDB(client) {
    const { data: siteStats, error: statsError } = await client
        .from('site_stats')
        .select('*')
        .eq('id', 1)
        .maybeSingle();

    const { data: reviews, error: reviewsError } = await client
        .from('reviews')
        .select('rating')
        .eq('approved', true);

    let avgRating = 0;
    let totalReviews = 0;

    if (!reviewsError && reviews?.length) {
        totalReviews = reviews.length;
        avgRating = Math.round(
            (reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) / totalReviews) * 10
        ) / 10;
    }

    return {
        pcBuilt: siteStats?.pc_built ?? DEFAULT_STATS.pcBuilt,
        happyClients: siteStats?.happy_clients ?? DEFAULT_STATS.happyClients,
        responseTime: siteStats?.response_time ?? DEFAULT_STATS.responseTime,
        successRate: siteStats?.success_rate ?? DEFAULT_STATS.successRate,
        avgRating,
        totalReviews
    };
}
