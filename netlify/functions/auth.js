const jwt = require('jsonwebtoken');

exports.handler = async (event, context) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    try {
        const { password } = JSON.parse(event.body);
        
        // Vérifier les variables d'environnement
        if (!process.env.ADMIN_PASSWORD || !process.env.JWT_SECRET) {
            console.error('🚨 Variables d\'environnement manquantes');
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({ error: 'Configuration serveur incorrecte' })
            };
        }

        // Log de tentative de connexion
        console.log(`🔐 Tentative de connexion admin depuis IP: ${event.headers['x-forwarded-for']}`);

        if (password === process.env.ADMIN_PASSWORD) {
            const token = jwt.sign(
                { 
                    admin: true,
                    iat: Math.floor(Date.now() / 1000)
                }, 
                process.env.JWT_SECRET, 
                { expiresIn: '24h' }
            );
            
            console.log('✅ Connexion admin réussie');
            return {
                statusCode: 200,
                headers: { ...headers, 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, message: 'Connexion réussie' })
            };
        }

        // Log de tentative échouée
        console.log(`🚨 SECURITY ALERT: Tentative de connexion admin échouée depuis IP: ${event.headers['x-forwarded-for']}`);
        
        return {
            statusCode: 401,
            headers,
            body: JSON.stringify({ error: 'Mot de passe incorrect' })
        };

    } catch (error) {
        console.error('Erreur auth:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Erreur serveur' })
        };
    }
};