/**
 * ============================================
 * HORIZON IT - API CONTACT / DEMANDE DE DEVIS
 * ============================================
 *
 * Endpoint:
 * - POST /.netlify/functions/contact → Enregistre une demande
 *
 * Variables d'environnement requises:
 * - SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY (ou SUPABASE_ANON_KEY + RLS désactivé, déconseillé)
 */

const {
    sanitizeString,
    successResponse,
    errorResponse,
    optionsResponse
} = require('./utils/shared');

const { addLead } = require('./utils/supabase');

// ============================================
// VALIDATION
// ============================================

function validateLead(data) {
    const errors = [];

    const name = sanitizeString(data.name);
    const email = sanitizeString(data.email);
    const service = sanitizeString(data.service);
    const message = sanitizeString(data.message);

    // Nom
    if (!name || name.length < 2 || name.length > 80) {
        errors.push('Nom: 2-80 caractères');
    }

    // Email (regex simple)
    const emailRegex = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
    if (!email || !emailRegex.test(email)) {
        errors.push('Email invalide');
    }

    // Service
    if (!service || service.length < 3 || service.length > 100) {
        errors.push('Service requis (3-100 caractères)');
    }

    // Message
    if (!message || message.length < 10 || message.length > 1000) {
        errors.push('Message: 10-1000 caractères');
    }

    if (errors.length) {
        return { valid: false, errors };
    }

    return {
        valid: true,
        data: { name, email, service, message }
    };
}

// ============================================
// HANDLER PRINCIPAL
// ============================================

exports.handler = async (event) => {
    // Preflight CORS
    if (event.httpMethod === 'OPTIONS') {
        return optionsResponse();
    }

    if (event.httpMethod !== 'POST') {
        return errorResponse('Méthode non autorisée', 405);
    }

    try {
        let body;
        try {
            body = JSON.parse(event.body);
        } catch (e) {
            return errorResponse('Format JSON invalide', 400);
        }

        const validation = validateLead(body);
        if (!validation.valid) {
            return errorResponse('Données invalides', 400, validation.errors);
        }

        const lead = await addLead(validation.data);

        return successResponse({
            message: 'Demande enregistrée, je reviens vers toi rapidement.',
            leadId: lead.id
        }, 201);

    } catch (error) {
        console.error('🚨 Erreur contact:', error);
        return errorResponse('Erreur serveur', 500);
    }
};

