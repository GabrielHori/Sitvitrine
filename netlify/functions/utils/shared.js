/**
 * ============================================================
 * HORIZON IT - MODULE PARTAGÉ BACKEND
 * ============================================================
 */

const SITE_URL = process.env.URL || 'https://ithorizon.netlify.app';

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

function getCorsHeaders(allowedMethods = 'GET, POST, OPTIONS') {
    return {
        'Access-Control-Allow-Origin': SITE_URL,
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': allowedMethods,
        'Access-Control-Max-Age': '86400',
        'Content-Type': 'application/json',
        'X-Content-Type-Options': 'nosniff',
        'Referrer-Policy': 'strict-origin-when-cross-origin'
    };
}

function sanitizeString(str) {
    if (typeof str !== 'string') return '';
    return str
        .replace(/<[^>]*>/g, '')
        .replace(/[\u0000-\u001F\u007F]/g, '')
        .trim();
}

function validateEmail(email) {
    return typeof email === 'string' &&
        email.length <= 254 &&
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function sanitizePhone(phone) {
    if (typeof phone !== 'string') return '';
    // Conserve uniquement les caractères utiles à un numéro français/international.
    return phone
        .replace(/[^\d+().\s-]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}

function validatePhone(phone) {
    if (!phone) return true; // facultatif
    const normalized = phone.replace(/[^\d+]/g, '');
    return normalized.length >= 8 && normalized.length <= 15;
}

function validateLead(data) {
    const errors = [];

    if (!data || typeof data !== 'object') {
        return { valid: false, errors: ['Données invalides'] };
    }

    const name = sanitizeString(data.name);
    const email = sanitizeString(data.email).toLowerCase();
    const phone = sanitizePhone(data.phone);
    const service = sanitizeString(data.service);
    const message = sanitizeString(data.message);

    if (name.length < 2 || name.length > 80) {
        errors.push('Nom: 2-80 caractères');
    }

    if (!validateEmail(email)) {
        errors.push('Adresse email invalide');
    }

    if (!validatePhone(phone)) {
        errors.push('Numéro de téléphone invalide');
    }

    if (service.length < 2 || service.length > 120) {
        errors.push('Service: 2-120 caractères');
    }

    if (message.length < 10 || message.length > 3000) {
        errors.push('Message: 10-3000 caractères');
    }

    if (errors.length) {
        return { valid: false, errors };
    }

    return {
        valid: true,
        data: { name, email, phone, service, message }
    };
}

function validateReviewData(data) {
    const errors = [];
    if (!data || typeof data !== 'object') {
        return { valid: false, errors: ['Données invalides'] };
    }

    const name = sanitizeString(data.name);
    const ratingNum = typeof data.rating === 'string' ? Number(data.rating) : data.rating;
    const service = sanitizeString(data.service);
    const text = sanitizeString(data.text);

    if (name.length < 2 || name.length > 50) errors.push('Nom: 2-50 caractères');
    if (!Number.isInteger(ratingNum) || ratingNum < 1 || ratingNum > 5) errors.push('Note: 1-5 requise');
    if (service.length < 3 || service.length > 100) errors.push('Service: 3-100 caractères');
    if (text.length < 10 || text.length > 500) errors.push('Commentaire: 10-500 caractères');

    if (errors.length) return { valid: false, errors };

    return {
        valid: true,
        data: { name, rating: ratingNum, service, text }
    };
}

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

function optionsResponse(allowedMethods = 'GET, POST, OPTIONS') {
    return {
        statusCode: 204,
        headers: getCorsHeaders(allowedMethods),
        body: ''
    };
}

const IS_PRODUCTION =
    process.env.NODE_ENV === 'production' ||
    process.env.CONTEXT === 'production';

const logger = {
    info: (...args) => {
        if (!IS_PRODUCTION) console.log(...args);
    },
    debug: (...args) => {
        if (!IS_PRODUCTION) console.log('🔍', ...args);
    },
    warn: (...args) => {
        if (IS_PRODUCTION) console.warn('⚠️ Warning occurred');
        else console.warn('⚠️', ...args);
    },
    error: (...args) => console.error('🚨', ...args),
    security: (...args) => console.warn('🔒 SECURITY:', ...args)
};

module.exports = {
    SITE_URL,
    DEFAULT_REVIEWS,
    getCorsHeaders,
    sanitizeString,
    validateEmail,
    sanitizePhone,
    validatePhone,
    validateLead,
    validateReviewData,
    successResponse,
    errorResponse,
    optionsResponse,
    logger,
    IS_PRODUCTION
};
