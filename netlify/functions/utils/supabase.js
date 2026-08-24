/**
 * ============================================================
 * HORIZON IT - CLIENT SUPABASE
 * ============================================================
 */

const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');
const { DEFAULT_REVIEWS, logger } = require('./shared');

function getSupabaseClient() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey =
        process.env.SUPABASE_SERVICE_ROLE_KEY ||
        process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
        logger.error('Variables Supabase manquantes');
        return null;
    }

    return createClient(supabaseUrl, supabaseKey, {
        auth: { persistSession: false, autoRefreshToken: false }
    });
}

async function getReviews(approvedOnly = true) {
    const client = getSupabaseClient();
    if (!client) return DEFAULT_REVIEWS;

    try {
        let query = client.from('reviews').select('*');
        if (approvedOnly) query = query.eq('approved', true);

        const { data, error } = await query.order('created_at', { ascending: false });
        if (error) {
            logger.error('Erreur getReviews:', error);
            return DEFAULT_REVIEWS;
        }

        return data && data.length ? data : DEFAULT_REVIEWS;
    } catch (error) {
        logger.error('Exception getReviews:', error);
        return DEFAULT_REVIEWS;
    }
}

async function addReview(reviewData, clientIP = 'unknown') {
    const client = getSupabaseClient();
    if (!client) throw new Error('Base de données non configurée');

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
        logger.error('Erreur addReview:', error);
        throw new Error('Erreur lors de l’ajout de l’avis');
    }

    return data;
}

async function updateReviewStatus(reviewId, approved) {
    const client = getSupabaseClient();
    if (!client) throw new Error('Base de données non configurée');

    const { data, error } = await client
        .from('reviews')
        .update({ approved })
        .eq('id', reviewId)
        .select()
        .single();

    if (error) {
        logger.error('Erreur updateReviewStatus:', error);
        throw new Error('Erreur lors de la mise à jour');
    }

    return data;
}

async function deleteReview(reviewId) {
    const client = getSupabaseClient();
    if (!client) throw new Error('Base de données non configurée');

    const { error } = await client
        .from('reviews')
        .delete()
        .eq('id', reviewId);

    if (error) {
        logger.error('Erreur deleteReview:', error);
        throw new Error('Erreur lors de la suppression');
    }

    return true;
}

async function addLead(leadData) {
    const client = getSupabaseClient();
    if (!client) throw new Error('Base de données non configurée');

    const newLead = {
        name: leadData.name,
        email: leadData.email,
        phone: leadData.phone || null,
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
        logger.error('Erreur addLead:', error);
        throw new Error('Erreur lors de l’ajout de la demande');
    }

    return data;
}

async function getLeads(status = 'all') {
    const client = getSupabaseClient();
    if (!client) return [];

    let query = client
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });

    if (status && status !== 'all') query = query.eq('status', status);

    const { data, error } = await query;
    if (error) {
        logger.error('Erreur getLeads:', error);
        return [];
    }

    return data || [];
}

async function updateLeadStatus(leadId, status) {
    const client = getSupabaseClient();
    if (!client) throw new Error('Base de données non configurée');

    const { data, error } = await client
        .from('leads')
        .update({ status })
        .eq('id', leadId)
        .select()
        .single();

    if (error) {
        logger.error('Erreur updateLeadStatus:', error);
        throw new Error('Erreur lors de la mise à jour du lead');
    }

    return data;
}

async function deleteLead(leadId) {
    const client = getSupabaseClient();
    if (!client) throw new Error('Base de données non configurée');

    const { error } = await client
        .from('leads')
        .delete()
        .eq('id', leadId);

    if (error) {
        logger.error('Erreur deleteLead:', error);
        throw new Error('Erreur lors de la suppression du lead');
    }

    return true;
}

function hashIP(ip) {
    const value = String(ip || 'unknown');
    const salt = process.env.IP_HASH_SALT;

    if (!salt) {
        // Ne pas utiliser un salt fixe en production.
        if (process.env.CONTEXT === 'production') {
            logger.warn('IP_HASH_SALT non configuré en production');
        }
        return crypto.createHash('sha256').update(value).digest('hex').slice(0, 16);
    }

    return crypto
        .createHash('sha256')
        .update(value + salt)
        .digest('hex')
        .slice(0, 16);
}

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
