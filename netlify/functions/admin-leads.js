/**
 * ============================================
 * HORIZON IT - API ADMIN LEADS (DEMANDES DE DEVIS)
 * ============================================
 *
 * Endpoints protégés par JWT:
 * - GET  /.netlify/functions/admin-leads        → Liste les demandes
 * - POST /.netlify/functions/admin-leads        → Met à jour le statut ou supprime
 *
 * Variables d'environnement requises:
 * - JWT_SECRET
 * - SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY
 */

const jwt = require('jsonwebtoken');

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
    // Preflight CORS
    if (event.httpMethod === 'OPTIONS') {
        return optionsResponse();
    }

    // Auth
    const token = extractToken(event.headers.authorization);
    const decoded = token ? verifyToken(token) : null;

    if (!decoded || !decoded.admin) {
        return errorResponse('Non autorisé', 401);
    }

    try {
        // GET - Liste des leads (filtre optionnel ?status=new|contacted|done|all)
        if (event.httpMethod === 'GET') {
            const status = event.queryStringParameters?.status || 'all';
            const leads = await getLeads(status);
            return successResponse(leads);
        }

        // POST - Actions sur un lead
        if (event.httpMethod === 'POST') {
            let body;
            try {
                body = JSON.parse(event.body);
            } catch (e) {
                return errorResponse('Format JSON invalide', 400);
            }

            const { action, leadId, status } = body;

            if (!action || !leadId) {
                return errorResponse('Action et leadId requis', 400);
            }

            if (action === 'update') {
                if (!status) {
                    return errorResponse('Statut requis pour update', 400);
                }
                const updated = await updateLeadStatus(parseInt(leadId), status);
                return successResponse({ message: 'Lead mis à jour', lead: updated });
            }

            if (action === 'delete') {
                await deleteLead(parseInt(leadId));
                return successResponse({ message: 'Lead supprimé' });
            }

            return errorResponse('Action inconnue', 400);
        }

        return errorResponse('Méthode non autorisée', 405);

    } catch (error) {
        console.error('🚨 Erreur admin-leads:', error);
        return errorResponse('Erreur serveur', 500);
    }
};

