/**
 * ============================================================
 * HORIZON IT - ADMIN STATISTIQUES
 * ============================================================
 */

const jwt = require('jsonwebtoken');

const {
    successResponse,
    errorResponse,
    optionsResponse
} = require('./utils/shared');

const { getSupabaseClient } = require('./utils/supabase');

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

    const client = getSupabaseClient();

    try {
        if (event.httpMethod === 'GET') {
            return successResponse(await getAdminStats(client));
        }

        if (event.httpMethod === 'POST') {
            if (!client) return errorResponse('Base de données non configurée', 500);

            let body;
            try { body = JSON.parse(event.body || '{}'); }
            catch { return errorResponse('Format JSON invalide', 400); }

            const updateBody = {
                id: 1,
                updated_at: new Date().toISOString()
            };

            if (body.pcBuilt !== undefined) {
                const value = Number(body.pcBuilt);
                if (!Number.isInteger(value) || value < 0) return errorResponse('pcBuilt invalide', 400);
                updateBody.pc_built = value;
            }

            if (body.happyClients !== undefined) {
                const value = Number(body.happyClients);
                if (!Number.isInteger(value) || value < 0) return errorResponse('happyClients invalide', 400);
                updateBody.happy_clients = value;
            }

            if (body.responseTime !== undefined) {
                const value = Number(body.responseTime);
                if (!Number.isInteger(value) || value < 0) return errorResponse('responseTime invalide', 400);
                updateBody.response_time = value;
            }

            if (body.successRate !== undefined) {
                const value = Number(body.successRate);
                if (!Number.isInteger(value) || value < 0 || value > 100) {
                    return errorResponse('successRate doit être entre 0 et 100', 400);
                }
                updateBody.success_rate = value;
            }

            if (Object.keys(updateBody).length === 2) {
                return errorResponse('Aucune statistique à modifier', 400);
            }

            const { data, error } = await client
                .from('site_stats')
                .upsert(updateBody, { onConflict: 'id' })
                .select()
                .single();

            if (error) {
                console.error('Erreur Supabase admin-stats:', error);
                return errorResponse('Erreur lors de la sauvegarde des statistiques', 500);
            }

            return successResponse({ message: 'Stats mises à jour', stats: data });
        }

        return errorResponse('Méthode non autorisée', 405);
    } catch (error) {
        console.error('Erreur admin-stats:', error);
        return errorResponse('Erreur serveur', 500);
    }
};

async function getAdminStats(client) {
    const stats = {
        reviews: { total: 0, approved: 0, pending: 0, avgRating: 0 },
        leads: { total: 0, new: 0, contacted: 0, done: 0 },
        site: { pcBuilt: 0, happyClients: 0, responseTime: 24, successRate: 100 },
        recent: [],
        recentLeads: []
    };

    if (!client) return stats;

    try {
        const { data: reviews, error: reviewsError } = await client
            .from('reviews')
            .select('id, name, rating, service, text, approved, created_at')
            .order('created_at', { ascending: false });

        if (!reviewsError && reviews) {
            stats.reviews.total = reviews.length;
            stats.reviews.approved = reviews.filter(r => r.approved).length;
            stats.reviews.pending = reviews.filter(r => !r.approved).length;

            const approved = reviews.filter(r => r.approved);
            if (approved.length) {
                stats.reviews.avgRating = Math.round(
                    (approved.reduce((sum, r) => sum + Number(r.rating || 0), 0) / approved.length) * 10
                ) / 10;
            }

            stats.recent = reviews.slice(0, 5);
        }

        const { data: leads, error: leadsError } = await client
            .from('leads')
            .select('id, status, name, email, phone, service, message, created_at')
            .order('created_at', { ascending: false });

        if (!leadsError && leads) {
            stats.leads.total = leads.length;
            stats.leads.new = leads.filter(l => l.status === 'new').length;
            stats.leads.contacted = leads.filter(l => l.status === 'contacted').length;
            stats.leads.done = leads.filter(l => l.status === 'done').length;
            stats.recentLeads = leads.slice(0, 5);
        }

        const { data: siteStats, error: siteError } = await client
            .from('site_stats')
            .select('*')
            .eq('id', 1)
            .maybeSingle();

        if (!siteError && siteStats) {
            stats.site = {
                pcBuilt: siteStats.pc_built ?? 0,
                happyClients: siteStats.happy_clients ?? 0,
                responseTime: siteStats.response_time ?? 24,
                successRate: siteStats.success_rate ?? 100
            };
        }
    } catch (error) {
        console.error('Erreur getAdminStats:', error);
    }

    return stats;
}
