/**
 * ============================================================
 * HORIZON IT - ADMIN LEADS
 * ============================================================
 */

const {
    successResponse,
    errorResponse,
    optionsResponse
} = require('./utils/shared');

const {
    getLeads,
    updateLeadStatus,
    deleteLead
} = require('./utils/supabase');

const jwt = require('jsonwebtoken');

function verifyAdminToken(authHeader) {
    if (!authHeader || !authHeader.startsWith('Bearer ') || !process.env.JWT_SECRET) return null;
    try {
        const token = authHeader.slice(7).trim();
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
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
            const status = event.queryStringParameters?.status || 'all';
            if (!['all', 'new', 'contacted', 'done'].includes(status)) {
                return errorResponse('Statut invalide', 400);
            }
            return successResponse(await getLeads(status));
        }

        if (event.httpMethod === 'POST') {
            let body;
            try { body = JSON.parse(event.body || '{}'); }
            catch { return errorResponse('Format JSON invalide', 400); }

            const action = body.action;
            const leadId = Number(body.leadId);

            if (!Number.isInteger(leadId) || leadId <= 0) {
                return errorResponse('leadId invalide', 400);
            }

            if (action === 'update') {
                if (!['new', 'contacted', 'done'].includes(body.status)) {
                    return errorResponse('Statut invalide', 400);
                }
                const lead = await updateLeadStatus(leadId, body.status);
                return successResponse({ message: 'Lead mis à jour', lead });
            }

            if (action === 'delete') {
                await deleteLead(leadId);
                return successResponse({ message: 'Lead supprimé' });
            }

            return errorResponse('Action inconnue', 400);
        }

        return errorResponse('Méthode non autorisée', 405);
    } catch (error) {
        console.error('Erreur admin-leads:', error);
        return errorResponse('Erreur serveur', 500);
    }
};
