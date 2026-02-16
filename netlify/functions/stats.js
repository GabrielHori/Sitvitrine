/**
 * ============================================
 * HORIZON IT - API STATISTIQUES PUBLIQUES
 * ============================================
 *
 * Endpoint:
 * - GET /.netlify/functions/stats → Retourne les stats pour le site
 */

const {
    successResponse,
    errorResponse,
    optionsResponse
} = require('./utils/shared');

const { getSupabaseClient } = require('./utils/supabase');

// ============================================
// STATISTIQUES PAR DÉFAUT
// ============================================

const DEFAULT_STATS = {
    pcBuilt: 50,
    happyClients: 100,
    responseTime: 24,
    successRate: 100,
    avgRating: 5.0,
    totalReviews: 3
};

// ============================================
// HANDLER PRINCIPAL
// ============================================

exports.handler = async (event) => {
    // Preflight CORS
    if (event.httpMethod === 'OPTIONS') {
        return optionsResponse();
    }

    if (event.httpMethod !== 'GET') {
        return errorResponse('Méthode non autorisée', 405);
    }

    try {
        const client = getSupabaseClient();

        // Si Supabase non configuré, retourner les stats par défaut
        if (!client) {
            console.log('⚠️ Supabase non configuré, stats par défaut');
            return successResponse(DEFAULT_STATS);
        }

        // Récupérer les statistiques depuis Supabase
        const stats = await getStatsFromDB(client);

        console.log('📊 Stats récupérées:', stats);
        return successResponse(stats);

    } catch (error) {
        console.error('🚨 Erreur stats:', error);
        return successResponse(DEFAULT_STATS); // Fallback en cas d'erreur
    }
};

// ============================================
// RÉCUPÉRATION DES STATS
// ============================================

async function getStatsFromDB(client) {
    try {
        // 1. Récupérer les stats depuis la table 'site_stats' si elle existe
        const { data: siteStats, error: statsError } = await client
            .from('site_stats')
            .select('*')
            .single();

        // 2. Récupérer les stats des avis
        const { data: reviews, error: reviewsError } = await client
            .from('reviews')
            .select('rating')
            .eq('approved', true);

        // Calculer la moyenne des notes
        let avgRating = 5.0;
        let totalReviews = 0;

        if (!reviewsError && reviews && reviews.length > 0) {
            totalReviews = reviews.length;
            const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
            avgRating = Math.round((sum / totalReviews) * 10) / 10;
        }

        // Combiner les stats
        // Si siteStats existe, l'utiliser, sinon utiliser DEFAULT_STATS
        if (siteStats && !statsError) {
            return {
                pcBuilt: siteStats.pc_built || DEFAULT_STATS.pcBuilt,
                happyClients: siteStats.happy_clients || DEFAULT_STATS.happyClients,
                responseTime: siteStats.response_time || DEFAULT_STATS.responseTime,
                successRate: siteStats.success_rate ?? DEFAULT_STATS.successRate,
                avgRating,
                totalReviews
            };
        }

        // Fallback si pas de table site_stats
        return {
            ...DEFAULT_STATS,
            avgRating,
            totalReviews
        };

    } catch (error) {
        console.error('❌ Erreur getStatsFromDB:', error);
        return DEFAULT_STATS;
    }
}

