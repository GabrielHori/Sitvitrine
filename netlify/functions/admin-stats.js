/**
 * ============================================
 * HORIZON IT - API ADMIN STATISTIQUES
 * ============================================
 *
 * Endpoints protégés par JWT:
 * - GET  /.netlify/functions/admin-stats     → Dashboard stats
 * - POST /.netlify/functions/admin-stats     → Mettre à jour les stats
 */

const jwt = require('jsonwebtoken');

const {
    successResponse,
    errorResponse,
    optionsResponse
} = require('./utils/shared');

const { getSupabaseClient } = require('./utils/supabase');

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
    if (event.httpMethod === 'OPTIONS') {
        return optionsResponse();
    }

    // Vérification auth
    const token = extractToken(event.headers.authorization);
    if (!token) {
        return errorResponse('Token requis', 401);
    }

    const decoded = verifyToken(token);
    if (!decoded || !decoded.admin) {
        return errorResponse('Non autorisé', 401);
    }

    const client = getSupabaseClient();

    try {
        // ========================================
        // GET - Récupérer les stats admin
        // ========================================
        if (event.httpMethod === 'GET') {
            const stats = await getAdminStats(client);
            return successResponse(stats);
        }

        // ========================================
        // POST - Mettre à jour les stats du site
        // ========================================
        if (event.httpMethod === 'POST') {
            let body;
            try {
                body = JSON.parse(event.body);
            } catch (e) {
                return errorResponse('Format JSON invalide', 400);
            }

            const { pcBuilt, happyClients, responseTime } = body;

            // DEBUG: Log des valeurs reçues
            console.log('📥 Valeurs reçues:', { pcBuilt, happyClients, responseTime });
            console.log('📊 Types:', {
                pcBuilt: typeof pcBuilt,
                happyClients: typeof happyClients,
                responseTime: typeof responseTime
            });

            // Conversion et validation des données
            let pcBuiltNum, happyClientsNum, responseTimeNum;

            if (pcBuilt !== undefined) {
                pcBuiltNum = parseInt(pcBuilt, 10);
                console.log('🔢 pcBuiltNum après parseInt:', pcBuiltNum, 'isNaN:', isNaN(pcBuiltNum));
                if (isNaN(pcBuiltNum) || pcBuiltNum < 0) {
                    console.error('❌ Validation pcBuilt échouée:', pcBuiltNum);
                    return errorResponse('pcBuilt doit être un entier positif', 400);
                }
            }
            if (happyClients !== undefined) {
                happyClientsNum = parseInt(happyClients, 10);
                console.log('🔢 happyClientsNum après parseInt:', happyClientsNum, 'isNaN:', isNaN(happyClientsNum));
                if (isNaN(happyClientsNum) || happyClientsNum < 0) {
                    console.error('❌ Validation happyClients échouée:', happyClientsNum);
                    return errorResponse('happyClients doit être un entier positif', 400);
                }
            }
            if (responseTime !== undefined) {
                responseTimeNum = parseInt(responseTime, 10);
                console.log('🔢 responseTimeNum après parseInt:', responseTimeNum, 'isNaN:', isNaN(responseTimeNum));
                if (isNaN(responseTimeNum) || responseTimeNum < 0) {
                    console.error('❌ Validation responseTime échouée:', responseTimeNum);
                    return errorResponse('responseTime doit être un entier positif', 400);
                }
            }

            console.log('✅ Validation passée, valeurs converties:', { pcBuiltNum, happyClientsNum, responseTimeNum });

            if (!client) {
                return errorResponse('Base de données non configurée', 500);
            }

            // Upsert dans site_stats
            const { error } = await client
                .from('site_stats')
                .upsert({
                    id: 1,
                    pc_built: pcBuiltNum !== undefined ? pcBuiltNum : undefined,
                    happy_clients: happyClientsNum !== undefined ? happyClientsNum : undefined,
                    response_time: responseTimeNum !== undefined ? responseTimeNum : undefined,
                    updated_at: new Date().toISOString()
                });

            if (error) {
                console.error('❌ Erreur update stats:', error);
                return errorResponse('Erreur mise à jour', 500);
            }

            console.log('✅ Stats mises à jour');
            return successResponse({ message: 'Stats mises à jour' });
        }

        return errorResponse('Méthode non autorisée', 405);

    } catch (error) {
        console.error('🚨 Erreur admin-stats:', error);
        return errorResponse('Erreur serveur', 500);
    }
};

// ============================================
// RÉCUPÉRATION STATS ADMIN
// ============================================

async function getAdminStats(client) {
    const stats = {
        reviews: { total: 0, approved: 0, pending: 0, avgRating: 0 },
        leads: { total: 0, new: 0, contacted: 0, done: 0 },
        site: { pcBuilt: 50, happyClients: 100, responseTime: 24 },
        recent: []
    };

    if (!client) return stats;

    try {
        // Stats des avis
        const { data: reviews } = await client
            .from('reviews')
            .select('id, name, rating, approved, created_at')
            .order('created_at', { ascending: false });

        if (reviews) {
            stats.reviews.total = reviews.length;
            stats.reviews.approved = reviews.filter(r => r.approved).length;
            stats.reviews.pending = reviews.filter(r => !r.approved).length;

            const approvedReviews = reviews.filter(r => r.approved);
            if (approvedReviews.length > 0) {
                const sum = approvedReviews.reduce((acc, r) => acc + r.rating, 0);
                stats.reviews.avgRating = Math.round((sum / approvedReviews.length) * 10) / 10;
            }

            stats.recent = reviews.slice(0, 5);
        }

        // Stats des leads (demandes)
        const { data: leads } = await client
            .from('leads')
            .select('id, status, name, email, service, created_at')
            .order('created_at', { ascending: false });

        if (leads) {
            stats.leads.total = leads.length;
            stats.leads.new = leads.filter(l => l.status === 'new').length;
            stats.leads.contacted = leads.filter(l => l.status === 'contacted').length;
            stats.leads.done = leads.filter(l => l.status === 'done').length;
            stats.recentLeads = leads.slice(0, 5);
        }

        // Stats du site
        const { data: siteStats } = await client
            .from('site_stats')
            .select('*')
            .single();

        if (siteStats) {
            stats.site = {
                pcBuilt: siteStats.pc_built || 50,
                happyClients: siteStats.happy_clients || 100,
                responseTime: siteStats.response_time || 24
            };
        }

    } catch (error) {
        console.error('❌ Erreur getAdminStats:', error);
    }

    return stats;
}

