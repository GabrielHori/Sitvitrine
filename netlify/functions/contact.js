/**
 * ============================================================
 * HORIZON IT - CONTACT / DEMANDES DE DEVIS
 * ============================================================
 */

const {
    validateLead,
    successResponse,
    errorResponse,
    optionsResponse,
    logger
} = require('./utils/shared');

const { addLead } = require('./utils/supabase');

function escapeHtml(value) {
    return String(value || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

exports.handler = async (event) => {
    if (event.httpMethod === 'OPTIONS') {
        return optionsResponse();
    }

    if (event.httpMethod !== 'POST') {
        return errorResponse('Méthode non autorisée', 405);
    }

    try {
        let body;
        try {
            body = JSON.parse(event.body || '{}');
        } catch {
            return errorResponse('Format JSON invalide', 400);
        }

        // Honeypot : répondre comme si la demande était acceptée sans l'enregistrer.
        if (body._honey) {
            logger.warn('Honeypot déclenché');
            return successResponse({
                message: 'Demande enregistrée, je reviens vers toi rapidement.'
            }, 201);
        }

        const validation = validateLead(body);
        if (!validation.valid) {
            return errorResponse('Données invalides', 400, validation.errors);
        }

        const lead = await addLead(validation.data);

        const resendKey = process.env.RESEND_API_KEY;
        const adminEmail = process.env.ADMIN_EMAIL;

        if (resendKey && adminEmail) {
            try {
                const d = validation.data;

                await fetch('https://api.resend.com/emails', {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${resendKey}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        from: process.env.RESEND_FROM_EMAIL ||
                            'Horizon IT <onboarding@resend.dev>',
                        to: adminEmail,
                        reply_to: d.email,
                        subject: `Nouvelle demande : ${d.service} - ${d.name}`,
                        html: `
                            <h2>Nouvelle demande Horizon IT</h2>
                            <p><strong>Nom :</strong> ${escapeHtml(d.name)}</p>
                            <p><strong>Email :</strong> ${escapeHtml(d.email)}</p>
                            <p><strong>Téléphone :</strong> ${escapeHtml(d.phone || 'Non renseigné')}</p>
                            <p><strong>Service :</strong> ${escapeHtml(d.service)}</p>
                            <p><strong>Message :</strong><br>${escapeHtml(d.message).replace(/\n/g, '<br>')}</p>
                        `
                    })
                });

                logger.info('Notification email envoyée');
            } catch (emailError) {
                // L'enregistrement du lead reste valide même si l'email échoue.
                logger.error('Erreur notification email:', emailError);
            }
        }

        return successResponse({
            message: 'Demande enregistrée, je reviens vers toi rapidement.',
            leadId: lead.id
        }, 201);

    } catch (error) {
        logger.error('Erreur contact:', error);
        return errorResponse('Erreur serveur', 500);
    }
};
