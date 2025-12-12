/**
 * ============================================
 * HORIZON IT - API AUTHENTIFICATION ADMIN
 * ============================================
 *
 * Endpoint:
 * - POST /api/auth     → Authentification avec mot de passe
 *
 * Variables d'environnement requises:
 * - ADMIN_PASSWORD: Mot de passe admin
 * - JWT_SECRET: Clé secrète pour signer les tokens
 */

const jwt = require('jsonwebtoken');

const {
    successResponse,
    errorResponse,
    optionsResponse
} = require('./utils/shared');

// ============================================
// CONFIGURATION
// ============================================

const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes
const TOKEN_EXPIRY = '24h';

// Stockage temporaire des tentatives (reset au redémarrage de la fonction)
// Note: Pour une vraie protection, utiliser Redis ou Supabase
const loginAttempts = new Map();

// ============================================
// PROTECTION BRUTE-FORCE
// ============================================

function checkBruteForce(clientIP) {
    const now = Date.now();
    const attempts = loginAttempts.get(clientIP);

    if (!attempts) {
        return { blocked: false };
    }

    // Vérifier si le lockout est expiré
    if (attempts.lockedUntil && now < attempts.lockedUntil) {
        const remainingMinutes = Math.ceil((attempts.lockedUntil - now) / 60000);
        return {
            blocked: true,
            message: `Trop de tentatives. Réessayez dans ${remainingMinutes} minute(s).`
        };
    }

    // Reset si lockout expiré
    if (attempts.lockedUntil && now >= attempts.lockedUntil) {
        loginAttempts.delete(clientIP);
        return { blocked: false };
    }

    return { blocked: false };
}

function recordFailedAttempt(clientIP) {
    const now = Date.now();
    const attempts = loginAttempts.get(clientIP) || { count: 0, firstAttempt: now };

    attempts.count++;

    // Si trop de tentatives, bloquer
    if (attempts.count >= MAX_LOGIN_ATTEMPTS) {
        attempts.lockedUntil = now + LOCKOUT_DURATION;
        console.log(`🔒 IP ${clientIP} bloquée pour 15 minutes après ${attempts.count} tentatives`);
    }

    loginAttempts.set(clientIP, attempts);
}

function resetAttempts(clientIP) {
    loginAttempts.delete(clientIP);
}

// ============================================
// HANDLER PRINCIPAL
// ============================================

exports.handler = async (event) => {
    // Preflight CORS
    if (event.httpMethod === 'OPTIONS') {
        return optionsResponse();
    }

    // Seulement POST autorisé
    if (event.httpMethod !== 'POST') {
        return errorResponse('Méthode non autorisée', 405);
    }

    const clientIP = event.headers['x-forwarded-for'] ||
                     event.headers['client-ip'] ||
                     'unknown';

    try {
        // ========================================
        // Vérification brute-force
        // ========================================
        const bruteCheck = checkBruteForce(clientIP);
        if (bruteCheck.blocked) {
            console.log(`🚨 Tentative bloquée pour IP: ${clientIP}`);
            return errorResponse(bruteCheck.message, 429);
        }

        // ========================================
        // Parse du body
        // ========================================
        let body;
        try {
            body = JSON.parse(event.body);
        } catch (e) {
            return errorResponse('Format JSON invalide', 400);
        }

        const { password } = body;

        if (!password) {
            return errorResponse('Mot de passe requis', 400);
        }

        // ========================================
        // Vérification des variables d'environnement
        // ========================================
        if (!process.env.ADMIN_PASSWORD || !process.env.JWT_SECRET) {
            console.error('🚨 Variables d\'environnement manquantes!');
            console.error('   ADMIN_PASSWORD:', process.env.ADMIN_PASSWORD ? '✓' : '✗');
            console.error('   JWT_SECRET:', process.env.JWT_SECRET ? '✓' : '✗');
            return errorResponse('Configuration serveur incorrecte', 500);
        }

        // ========================================
        // Vérification du mot de passe
        // ========================================
        console.log(`🔐 Tentative de connexion depuis IP: ${clientIP.substring(0, 10)}...`);

        if (password === process.env.ADMIN_PASSWORD) {
            // Succès - Reset les tentatives et créer le token
            resetAttempts(clientIP);

            const token = jwt.sign(
                {
                    admin: true,
                    ip: clientIP.substring(0, 10),
                    iat: Math.floor(Date.now() / 1000)
                },
                process.env.JWT_SECRET,
                { expiresIn: TOKEN_EXPIRY }
            );

            console.log('✅ Connexion admin réussie');

            return successResponse({
                token,
                message: 'Connexion réussie',
                expiresIn: TOKEN_EXPIRY
            });
        }

        // ========================================
        // Échec - Enregistrer la tentative
        // ========================================
        recordFailedAttempt(clientIP);

        console.log(`🚨 SECURITY ALERT: Tentative échouée depuis IP: ${clientIP}`);

        return errorResponse('Mot de passe incorrect', 401);

    } catch (error) {
        console.error('🚨 Erreur auth:', error);
        return errorResponse('Erreur serveur', 500);
    }
};