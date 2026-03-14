/**
 * ============================================
 * HORIZON IT - MODULE PARTAGÉ BACKEND
 * ============================================
 * 
 * Centralise les fonctions communes entre les endpoints
 */

// ============================================
// CONFIGURATION & CONSTANTES
// ============================================

const SITE_URL = process.env.URL || 'https://ithorizon.netlify.app';

// Avis par défaut (utilisés si la BDD est vide)
const DEFAULT_REVIEWS = [
    {
        id: 999,
        name: "Thomas M.",
        rating: 5,
        service: "Montage PC Gaming",
        text: "Service au top ! Mon PC gaming fonctionne parfaitement, cable management impeccable. Je recommande vivement !",
        date: "2026-03-02",
        approved: true,
        is_default: true
    },
    {
        id: 998,
        name: "Sarah L.",
        rating: 5,
        service: "Dépannage PC",
        text: "Intervention rapide pour un écran bleu. Problème résolu en 1h, très professionnel !",
        date: "2026-02-27",
        approved: true,
        is_default: true
    },
    {
        id: 997,
        name: "Kevin R.",
        rating: 4,
        service: "Optimisation PC",
        text: "PC beaucoup plus rapide après optimisation. Bon rapport qualité/prix.",
        date: "2026-02-20",
        approved: true,
        is_default: true
    }
];

// ============================================
// HEADERS CORS SÉCURISÉS
// ============================================

function getCorsHeaders(allowedMethods = 'GET, POST, OPTIONS') {
    return {
        'Access-Control-Allow-Origin': SITE_URL,
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': allowedMethods,
        'Access-Control-Max-Age': '86400',
        'Content-Type': 'application/json'
    };
}

// ============================================
// VALIDATION & SANITISATION
// ============================================

function sanitizeString(str) {
    if (typeof str !== 'string') return '';
    return str
        .replace(/<[^>]*>/g, '')     // Supprime les balises HTML
        .replace(/[<>\"'`;()]/g, '') // Supprime les caractères dangereux
        .trim();
}

function validateReviewData(data) {
    const errors = [];
    const { name, rating, service, text } = data;

    // Validation du nom
    if (!name || typeof name !== 'string') {
        errors.push('Nom requis');
    } else if (name.trim().length < 2 || name.trim().length > 50) {
        errors.push('Nom: 2-50 caractères');
    }

    // Validation de la note
    const ratingNum = typeof rating === 'string' ? parseInt(rating) : rating;
    if (!ratingNum || !Number.isInteger(ratingNum) || ratingNum < 1 || ratingNum > 5) {
        errors.push('Note: 1-5 requise');
    }

    // Validation du service
    if (!service || typeof service !== 'string') {
        errors.push('Service requis');
    } else if (service.trim().length < 3 || service.trim().length > 100) {
        errors.push('Service: 3-100 caractères');
    }

    // Validation du texte
    if (!text || typeof text !== 'string') {
        errors.push('Commentaire requis');
    } else if (text.trim().length < 10 || text.trim().length > 500) {
        errors.push('Commentaire: 10-500 caractères');
    }

    if (errors.length > 0) {
        return { valid: false, errors };
    }

    // Retourne les données sanitisées
    return {
        valid: true,
        data: {
            name: sanitizeString(name),
            rating: ratingNum,
            service: sanitizeString(service),
            text: sanitizeString(text)
        }
    };
}

// ============================================
// RÉPONSES HTTP STANDARDISÉES
// ============================================

function successResponse(data, statusCode = 200) {
    return {
        statusCode,
        headers: getCorsHeaders(),
        body: JSON.stringify(data)
    };
}

function errorResponse(message, statusCode = 400, details = null) {
    const body = { error: message };
    if (details) body.details = details;

    return {
        statusCode,
        headers: getCorsHeaders(),
        body: JSON.stringify(body)
    };
}

function optionsResponse() {
    return {
        statusCode: 204,
        headers: getCorsHeaders(),
        body: ''
    };
}

// ============================================
// LOGGING SÉCURISÉ
// ============================================

const IS_PRODUCTION = process.env.NODE_ENV === 'production' ||
    process.env.CONTEXT === 'production';

/**
 * Log conditionnel - désactivé en production (sauf erreurs)
 */
const logger = {
    // Info: seulement en développement
    info: (...args) => {
        if (!IS_PRODUCTION) {
            console.log(...args);
        }
    },

    // Debug: seulement en développement
    debug: (...args) => {
        if (!IS_PRODUCTION) {
            console.log('🔍', ...args);
        }
    },

    // Warn: toujours affiché mais sans détails sensibles en prod
    warn: (...args) => {
        if (IS_PRODUCTION) {
            console.warn('⚠️ Warning occurred');
        } else {
            console.warn('⚠️', ...args);
        }
    },

    // Error: toujours affiché (nécessaire pour le debugging)
    error: (...args) => {
        console.error('🚨', ...args);
    },

    // Security: alertes de sécurité (toujours loggées)
    security: (...args) => {
        console.log('🔒 SECURITY:', ...args);
    }
};

// ============================================
// EXPORTS
// ============================================

module.exports = {
    SITE_URL,
    DEFAULT_REVIEWS,
    getCorsHeaders,
    sanitizeString,
    validateReviewData,
    successResponse,
    errorResponse,
    optionsResponse,
    logger,
    IS_PRODUCTION
};
