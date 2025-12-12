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
        date: "2024-12-15",
        approved: true,
        is_default: true
    },
    {
        id: 998,
        name: "Sarah L.",
        rating: 5,
        service: "Dépannage PC",
        text: "Intervention rapide pour un écran bleu. Problème résolu en 1h, très professionnel !",
        date: "2024-12-10",
        approved: true,
        is_default: true
    },
    {
        id: 997,
        name: "Kevin R.",
        rating: 4,
        service: "Optimisation PC",
        text: "PC beaucoup plus rapide après optimisation. Bon rapport qualité/prix.",
        date: "2024-12-08",
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
    optionsResponse
};

