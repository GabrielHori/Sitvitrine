/**
 * ============================================
 * HORIZON IT - CLIENT SUPABASE
 * ============================================
 * 
 * Gestion de la base de données des avis
 * 
 * Variables d'environnement requises:
 * - SUPABASE_URL: URL de votre projet Supabase
 * - SUPABASE_ANON_KEY: Clé anonyme (publique)
 */

const { createClient } = require('@supabase/supabase-js');
const { DEFAULT_REVIEWS, logger } = require('./shared');

// ============================================
// INITIALISATION SUPABASE
// ============================================

function getSupabaseClient() {
    const supabaseUrl = process.env.SUPABASE_URL;
    // Utiliser service_role pour bypass RLS
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
        logger.error('Variables Supabase manquantes!');
        logger.error('   SUPABASE_URL:', supabaseUrl ? '✓' : '✗');
        logger.error('   SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✓' : '✗');
        return null;
    }

    logger.debug('Supabase: utilisation de', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SERVICE_ROLE' : 'ANON');
    return createClient(supabaseUrl, supabaseKey);
}

// ============================================
// OPÉRATIONS SUR LES AVIS
// ============================================

/**
 * Récupère tous les avis (approuvés uniquement par défaut)
 */
async function getReviews(approvedOnly = true) {
    const client = getSupabaseClient();

    if (!client) {
        logger.warn('Supabase non configuré, retour aux avis par défaut');
        return DEFAULT_REVIEWS;
    }

    try {
        let query = client.from('reviews').select('*');

        if (approvedOnly) {
            query = query.eq('approved', true);
        }

        const { data, error } = await query.order('created_at', { ascending: false });

        if (error) {
            logger.error('Erreur Supabase getReviews:', error);
            return DEFAULT_REVIEWS;
        }

        logger.info(`📋 ${data.length} avis récupérés depuis Supabase`);
        return data.length > 0 ? data : DEFAULT_REVIEWS;

    } catch (error) {
        logger.error('Exception getReviews:', error);
        return DEFAULT_REVIEWS;
    }
}

/**
 * Ajoute un nouvel avis
 */
async function addReview(reviewData, clientIP = 'unknown') {
    const client = getSupabaseClient();

    if (!client) {
        throw new Error('Base de données non configurée');
    }

    const newReview = {
        name: reviewData.name,
        rating: reviewData.rating,
        service: reviewData.service,
        text: reviewData.text,
        approved: false,
        ip_hash: hashIP(clientIP),
        created_at: new Date().toISOString()
    };

    const { data, error } = await client
        .from('reviews')
        .insert([newReview])
        .select()
        .single();

    if (error) {
        logger.error('Erreur Supabase addReview:', error);
        throw new Error('Erreur lors de l\'ajout de l\'avis');
    }

    logger.info(`✅ Nouvel avis ajouté: ID ${data.id}`);
    return data;
}

/**
 * Met à jour le statut d'un avis (approuver/rejeter)
 */
async function updateReviewStatus(reviewId, approved) {
    const client = getSupabaseClient();

    if (!client) {
        throw new Error('Base de données non configurée');
    }

    const { data, error } = await client
        .from('reviews')
        .update({ approved })
        .eq('id', reviewId)
        .select()
        .single();

    if (error) {
        logger.error('Erreur Supabase updateReviewStatus:', error);
        throw new Error('Erreur lors de la mise à jour');
    }

    return data;
}

/**
 * Supprime un avis
 */
async function deleteReview(reviewId) {
    const client = getSupabaseClient();

    if (!client) {
        throw new Error('Base de données non configurée');
    }

    const { error } = await client
        .from('reviews')
        .delete()
        .eq('id', reviewId);

    if (error) {
        logger.error('Erreur Supabase deleteReview:', error);
        throw new Error('Erreur lors de la suppression');
    }

    return true;
}

// ============================================
// OPÉRATIONS SUR LES DEMANDES DE CONTACT / DEVIS
// ============================================

/**
 * Ajoute une demande de devis/contact
 */
async function addLead(leadData) {
    const client = getSupabaseClient();

    if (!client) {
        throw new Error('Base de données non configurée');
    }

    const newLead = {
        name: leadData.name,
        email: leadData.email,
        service: leadData.service,
        message: leadData.message,
        status: 'new',
        created_at: new Date().toISOString()
    };

    const { data, error } = await client
        .from('leads')
        .insert([newLead])
        .select()
        .single();

    if (error) {
        logger.error('Erreur Supabase addLead:', error);
        throw new Error('Erreur lors de l\'ajout de la demande');
    }

    logger.info(`✅ Lead ajouté: ID ${data.id}`);
    return data;
}

/**
 * Récupère les demandes de devis
 */
async function getLeads(status = 'all') {
    const client = getSupabaseClient();

    if (!client) {
        logger.warn('Supabase non configuré, aucun lead retourné');
        return [];
    }

    let query = client.from('leads').select('*').order('created_at', { ascending: false });
    if (status && status !== 'all') {
        query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
        logger.error('Erreur Supabase getLeads:', error);
        return [];
    }

    return data || [];
}

/**
 * Met à jour le statut d'un lead
 */
async function updateLeadStatus(leadId, status) {
    const client = getSupabaseClient();

    if (!client) {
        throw new Error('Base de données non configurée');
    }

    const { data, error } = await client
        .from('leads')
        .update({ status })
        .eq('id', leadId)
        .select()
        .single();

    if (error) {
        logger.error('Erreur Supabase updateLeadStatus:', error);
        throw new Error('Erreur lors de la mise à jour du lead');
    }

    return data;
}

/**
 * Supprime un lead
 */
async function deleteLead(leadId) {
    const client = getSupabaseClient();

    if (!client) {
        throw new Error('Base de données non configurée');
    }

    const { error } = await client
        .from('leads')
        .delete()
        .eq('id', leadId);

    if (error) {
        logger.error('Erreur Supabase deleteLead:', error);
        throw new Error('Erreur lors de la suppression du lead');
    }

    return true;
}

/**
 * Hash sécurisé de l'IP avec SHA-256 et salt
 * Anonymise l'IP tout en permettant de détecter les doublons
 */
function hashIP(ip) {
    if (!ip) return 'unknown';

    const crypto = require('crypto');
    const salt = process.env.IP_HASH_SALT;

    // Avertissement si le salt n'est pas configuré
    if (!salt) {
        logger.warn('⚠️ IP_HASH_SALT non configuré ! Utilisation d\'un salt par défaut (NON SÉCURISÉ pour la production)');
        // Utiliser un salt par défaut uniquement en développement
        const defaultSalt = 'horizon-it-default-salt-2024';
        return crypto
            .createHash('sha256')
            .update(ip + defaultSalt)
            .digest('hex')
            .slice(0, 16);
    }

    return crypto
        .createHash('sha256')
        .update(ip + salt)
        .digest('hex')
        .slice(0, 16); // Garder 16 caractères pour un hash compact
}

// ============================================
// EXPORTS
// ============================================

module.exports = {
    getSupabaseClient,
    getReviews,
    addReview,
    updateReviewStatus,
    deleteReview,
    hashIP,
    addLead,
    getLeads,
    updateLeadStatus,
    deleteLead
};
