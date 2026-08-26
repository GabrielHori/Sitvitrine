/**
 * ============================================================
 * HORIZON IT - MODULE PARTAGÉ BACKEND
 * ============================================================
 */

const SITE_URL = process.env.URL || 'https://ithorizon.netlify.app';
const rateLimits = new Map();

function getClientIdentifier(event) {
    const forwarded = event.headers?.['x-forwarded-for'];
    return (forwarded ? forwarded.split(',')[0].trim() : event.headers?.['client-ip']) || 'unknown';
}

function checkRateLimit(scope, clientIdentifier, limit, windowMs) {
    const now = Date.now();
    const key = `${scope}:${clientIdentifier}`;
    const current = rateLimits.get(key);

    if (!current || now >= current.resetAt) {
        rateLimits.set(key, { count: 1, resetAt: now + windowMs });
        return { allowed: true, retryAfter: 0 };
    }

    if (current.count >= limit) {
        return {
            allowed: false,
            retryAfter: Math.ceil((current.resetAt - now) / 1000)
        };
    }

    current.count += 1;
    return { allowed: true, retryAfter: 0 };
}

async function verifyTurnstile(token, remoteip, expectedAction) {
    const secret = process.env.TURNSTILE_SECRET_KEY;
    if (!secret || typeof token !== 'string' || !token) {
        return { valid: false };
    }

    const formData = new URLSearchParams({ secret, response: token });
    if (remoteip && remoteip !== 'unknown') formData.set('remoteip', remoteip);

    try {
        const response = await fetch(
            'https://challenges.cloudflare.com/turnstile/v0/siteverify',
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: formData.toString()
            }
        );
        const result = await response.json();
        return {
            valid: response.ok &&
                result.success === true &&
                result.action === expectedAction
        };
    } catch (error) {
        logger.error('Erreur de vérification Turnstile:', error);
        return { valid: false };
    }
}

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
    return phone
        .replace(/[^\d+().\s-]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}

function validatePhone(phone) {
    if (!phone) return true;
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

    if (name.length < 2 || name.length > 80) errors.push('Nom: 2-80 caractères');
    if (!validateEmail(email)) errors.push('Adresse email invalide');
    if (!validatePhone(phone)) errors.push('Numéro de téléphone invalide');
    if (service.length < 2 || service.length > 120) errors.push('Service: 2-120 caractères');
    if (message.length < 10 || message.length > 3000) errors.push('Message: 10-3000 caractères');

    if (errors.length) return { valid: false, errors };

    return { valid: true, data: { name, email, phone, service, message } };
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

    return { valid: true, data: { name, rating: ratingNum, service, text } };
}

function successResponse(data, statusCode = 200) {
    return { statusCode, headers: getCorsHeaders(), body: JSON.stringify(data) };
}

function errorResponse(message, statusCode = 400, details = null) {
    const body = { error: message };
    if (details) body.details = details;
    return { statusCode, headers: getCorsHeaders(), body: JSON.stringify(body) };
}

function optionsResponse(allowedMethods = 'GET, POST, OPTIONS') {
    return { statusCode: 204, headers: getCorsHeaders(allowedMethods), body: '' };
}

const IS_PRODUCTION =
    process.env.NODE_ENV === 'production' ||
    process.env.CONTEXT === 'production';

const logger = {
    info: (...args) => { if (!IS_PRODUCTION) console.log(...args); },
    debug: (...args) => { if (!IS_PRODUCTION) console.log('🔍', ...args); },
    warn: (...args) => {
        if (IS_PRODUCTION) console.warn('⚠️ Warning occurred');
        else console.warn('⚠️', ...args);
    },
    error: (...args) => console.error('🚨', ...args),
    security: (...args) => console.warn('🔒 SECURITY:', ...args)
};

module.exports = {
    SITE_URL,
    getClientIdentifier,
    checkRateLimit,
    verifyTurnstile,
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
