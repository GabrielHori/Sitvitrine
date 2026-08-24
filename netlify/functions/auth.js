/**
 * ============================================================
 * HORIZON IT - AUTHENTIFICATION ADMIN
 * ============================================================
 */

const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const {
    successResponse,
    errorResponse,
    optionsResponse,
    logger
} = require('./utils/shared');

const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000;
const TOKEN_EXPIRY = '24h';
const loginAttempts = new Map();

function getClientIP(event) {
    const forwarded = event.headers?.['x-forwarded-for'];
    return (forwarded ? forwarded.split(',')[0].trim() : event.headers?.['client-ip']) || 'unknown';
}

function hashSecret(value) {
    return crypto.createHash('sha256').update(String(value)).digest('hex');
}

function safeEqual(a, b) {
    const ah = Buffer.from(hashSecret(a), 'hex');
    const bh = Buffer.from(hashSecret(b), 'hex');
    return ah.length === bh.length && crypto.timingSafeEqual(ah, bh);
}

function checkBruteForce(clientIP) {
    const now = Date.now();
    const attempts = loginAttempts.get(clientIP);
    if (!attempts) return { blocked: false };

    if (attempts.lockedUntil && now < attempts.lockedUntil) {
        return {
            blocked: true,
            message: `Trop de tentatives. Réessayez dans ${Math.ceil((attempts.lockedUntil - now) / 60000)} minute(s).`
        };
    }

    if (attempts.lockedUntil && now >= attempts.lockedUntil) {
        loginAttempts.delete(clientIP);
    }

    return { blocked: false };
}

function recordFailedAttempt(clientIP) {
    const now = Date.now();
    const attempts = loginAttempts.get(clientIP) || { count: 0 };
    attempts.count += 1;

    if (attempts.count >= MAX_LOGIN_ATTEMPTS) {
        attempts.lockedUntil = now + LOCKOUT_DURATION;
    }

    loginAttempts.set(clientIP, attempts);
}

exports.handler = async (event) => {
    if (event.httpMethod === 'OPTIONS') return optionsResponse();

    if (event.httpMethod !== 'POST') {
        return errorResponse('Méthode non autorisée', 405);
    }

    const clientIP = getClientIP(event);
    const bruteCheck = checkBruteForce(clientIP);

    if (bruteCheck.blocked) {
        return errorResponse(bruteCheck.message, 429);
    }

    try {
        let body;
        try { body = JSON.parse(event.body || '{}'); }
        catch { return errorResponse('Format JSON invalide', 400); }

        if (typeof body.password !== 'string' || !body.password) {
            return errorResponse('Mot de passe requis', 400);
        }

        const adminPassword = process.env.ADMIN_PASSWORD;
        const jwtSecret = process.env.JWT_SECRET;

        if (!adminPassword || !jwtSecret) {
            logger.error('ADMIN_PASSWORD ou JWT_SECRET manquant');
            return errorResponse('Configuration serveur incorrecte', 500);
        }

        if (!safeEqual(body.password, adminPassword)) {
            recordFailedAttempt(clientIP);
            return errorResponse('Mot de passe incorrect', 401);
        }

        loginAttempts.delete(clientIP);

        const token = jwt.sign(
            { admin: true },
            jwtSecret,
            { expiresIn: TOKEN_EXPIRY }
        );

        return successResponse({
            token,
            message: 'Connexion réussie',
            expiresIn: TOKEN_EXPIRY
        });
    } catch (error) {
        logger.error('Erreur auth:', error);
        return errorResponse('Erreur serveur', 500);
    }
};
