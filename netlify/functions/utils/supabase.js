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
const { DEFAULT_REVIEWS } = require('./shared');

// ============================================
// INITIALISATION SUPABASE
// ============================================

let supabase = null;

function getSupabaseClient() {
    if (supabase) return supabase;

    const supabaseUrl = process.env.SUPABASE_URL;
    // Utiliser service_role pour bypass RLS, sinon fallback sur anon
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
        console.error('❌ Variables Supabase manquantes!');
        console.error('   SUPABASE_URL:', supabaseUrl ? '✓' : '✗');
        console.error('   SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✓' : '✗');
        console.error('   SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY ? '✓' : '✗');
        return null;
    }

    supabase = createClient(supabaseUrl, supabaseKey);
    console.log('✅ Client Supabase initialisé (service_role:', !!process.env.SUPABASE_SERVICE_ROLE_KEY, ')');
    return supabase;
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
        console.log('⚠️ Supabase non configuré, retour aux avis par défaut');
        return DEFAULT_REVIEWS;
    }

    try {
        let query = client.from('reviews').select('*');
        
        if (approvedOnly) {
            query = query.eq('approved', true);
        }
        
        const { data, error } = await query.order('created_at', { ascending: false });

        if (error) {
            console.error('❌ Erreur Supabase getReviews:', error);
            return DEFAULT_REVIEWS;
        }

        console.log(`📋 ${data.length} avis récupérés depuis Supabase`);
        return data.length > 0 ? data : DEFAULT_REVIEWS;

    } catch (error) {
        console.error('❌ Exception getReviews:', error);
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
        console.error('❌ Erreur Supabase addReview:', error);
        throw new Error('Erreur lors de l\'ajout de l\'avis');
    }

    console.log(`✅ Nouvel avis ajouté: ID ${data.id}`);
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
        console.error('❌ Erreur Supabase updateReviewStatus:', error);
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
        console.error('❌ Erreur Supabase deleteReview:', error);
        throw new Error('Erreur lors de la suppression');
    }

    return true;
}

/**
 * Hash simple de l'IP pour le rate limiting (sans stocker l'IP complète)
 */
function hashIP(ip) {
    if (!ip) return 'unknown';
    // Hash simple pour anonymiser
    let hash = 0;
    for (let i = 0; i < ip.length; i++) {
        const char = ip.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return hash.toString(16);
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
    hashIP
};

