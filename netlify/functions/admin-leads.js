/**
 * ============================================================
 * HORIZON IT - ADMIN LEADS
 * ============================================================
 */

const {
    successResponse,
    errorResponse,
    optionsResponse
} = require('./utils/shared');

const {
    getLeads,
    updateLeadStatus,
    deleteLead,
    createQuote,
    getQuotes,
    getQuoteById,
    updateQuoteStatus
} = require('./utils/supabase');

const jwt = require('jsonwebtoken');

function escapeHtml(value) {
    return String(value || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function verifyAdminToken(authHeader) {
    if (!authHeader || !authHeader.startsWith('Bearer ') || !process.env.JWT_SECRET) return null;
    try {
        const token = authHeader.slice(7).trim();
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        return decoded?.admin === true ? decoded : null;
    } catch {
        return null;
    }
}

exports.handler = async (event) => {
    if (event.httpMethod === 'OPTIONS') return optionsResponse();

    if (!verifyAdminToken(event.headers?.authorization)) {
        return errorResponse('Non autorisé', 401);
    }

    try {
        if (event.httpMethod === 'GET') {
            if (event.queryStringParameters?.resource === 'quotes') {
                const quoteStatus = event.queryStringParameters?.status || 'all';
                if (!['all', 'draft', 'sent', 'accepted', 'rejected', 'expired', 'paid'].includes(quoteStatus)) {
                    return errorResponse('Statut de devis invalide', 400);
                }
                return successResponse(await getQuotes(quoteStatus));
            }

            const status = event.queryStringParameters?.status || 'all';
            if (!['all', 'new', 'contacted', 'done'].includes(status)) {
                return errorResponse('Statut invalide', 400);
            }
            return successResponse(await getLeads(status));
        }

        if (event.httpMethod === 'POST') {
            let body;
            try { body = JSON.parse(event.body || '{}'); }
            catch { return errorResponse('Format JSON invalide', 400); }

            const action = body.action;
            const leadId = Number(body.leadId);

            if (!Number.isInteger(leadId) || leadId <= 0) {
                return errorResponse('leadId invalide', 400);
            }

            if (action === 'update') {
                if (!['new', 'contacted', 'done'].includes(body.status)) {
                    return errorResponse('Statut invalide', 400);
                }
                const lead = await updateLeadStatus(leadId, body.status);
                return successResponse({ message: 'Lead mis à jour', lead });
            }

            if (action === 'delete') {
                await deleteLead(leadId);
                return successResponse({ message: 'Lead supprimé' });
            }

            if (action === 'create_quote') {
                const clientName = String(body.clientName || '').trim().slice(0, 120);
                const clientEmail = String(body.clientEmail || '').trim().slice(0, 254);
                const items = Array.isArray(body.items) ? body.items : [];
                const cleanItems = items
                    .map(item => ({
                        description: String(item.description || '').trim().slice(0, 200),
                        quantity: Number(item.quantity),
                        unit_price: Number(item.unit_price)
                    }))
                    .filter(item => item.description && Number.isFinite(item.quantity) && item.quantity > 0 && item.quantity <= 100 && Number.isFinite(item.unit_price) && item.unit_price >= 0 && item.unit_price <= 100000)
                    .slice(0, 30);

                if (!clientName || !cleanItems.length) {
                    return errorResponse('Client et au moins une prestation requis', 400);
                }

                const travelCost = Math.max(0, Number(body.travelCost) || 0);
                const discount = Math.max(0, Number(body.discount) || 0);
                const subtotal = cleanItems.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);
                const total = Math.max(0, subtotal + travelCost - discount);

                const quote = await createQuote({
                    quote: {
                        lead_id: leadId,
                        client_name: clientName,
                        client_email: clientEmail || null,
                        subtotal: subtotal.toFixed(2),
                        travel_cost: travelCost.toFixed(2),
                        discount: discount.toFixed(2),
                        total: total.toFixed(2),
                        valid_until: body.validUntil || null,
                        notes: String(body.notes || '').trim().slice(0, 2000) || null
                    },
                    items: cleanItems
                });

                return successResponse({ message: 'Devis enregistré', quote }, 201);
            }

            if (action === 'update_quote_status') {
                const quoteId = Number(body.quoteId);
                const allowedStatuses = ['draft', 'sent', 'accepted', 'rejected', 'expired', 'paid'];
                if (!Number.isInteger(quoteId) || quoteId <= 0 || !allowedStatuses.includes(body.status)) {
                    return errorResponse('Données du devis invalides', 400);
                }
                const quote = await updateQuoteStatus(quoteId, body.status);
                return successResponse({ message: 'Statut du devis mis à jour', quote });
            }

            if (action === 'send_quote') {
                const quoteId = Number(body.quoteId);
                if (!Number.isInteger(quoteId) || quoteId <= 0) {
                    return errorResponse('Devis invalide', 400);
                }

                const quote = await getQuoteById(quoteId);
                if (!quote.client_email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(quote.client_email)) {
                    return errorResponse('Ce devis ne contient pas d’adresse e-mail valide', 400);
                }

                const resendKey = process.env.RESEND_API_KEY;
                if (!resendKey) return errorResponse('RESEND_API_KEY manquante', 503);

                const itemsHtml = (quote.quote_items || []).map(item =>
                    `<tr><td>${escapeHtml(item.description)}</td><td>${Number(item.quantity)}</td><td>${Number(item.unit_price).toFixed(2)} €</td></tr>`
                ).join('');

                const emailResponse = await fetch('https://api.resend.com/emails', {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${resendKey}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        from: process.env.RESEND_FROM_EMAIL || 'Horizon IT <onboarding@resend.dev>',
                        to: quote.client_email,
                        subject: `Votre devis Horizon IT #${quote.id}`,
                        html: `<h2>Votre devis Horizon IT</h2><p>Bonjour ${escapeHtml(quote.client_name)},</p><p>Voici votre devis pour les prestations demandées.</p><table border="1" cellpadding="8" cellspacing="0"><thead><tr><th>Prestation</th><th>Qté</th><th>Prix</th></tr></thead><tbody>${itemsHtml}</tbody></table><p><strong>Total : ${Number(quote.total).toFixed(2)} €</strong></p><p>Ce devis est valable jusqu’au ${escapeHtml(quote.valid_until || 'date non définie')}.</p><p>Répondez à cet e-mail pour toute question.</p>`
                    })
                });

                if (!emailResponse.ok) return errorResponse('Impossible d’envoyer le devis', 502);
                const updatedQuote = await updateQuoteStatus(quoteId, 'sent');
                return successResponse({ message: 'Devis envoyé au client', quote: updatedQuote });
            }

            return errorResponse('Action inconnue', 400);
        }

        return errorResponse('Méthode non autorisée', 405);
    } catch (error) {
        console.error('Erreur admin-leads:', error);
        return errorResponse('Erreur serveur', 500);
    }
};
