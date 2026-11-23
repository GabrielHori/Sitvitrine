/**
 * Les avis publics sont désormais recueillis sur la fiche Google Horizon IT.
 * Les anciennes données restent conservées dans l'administration.
 */

const {
    successResponse,
    errorResponse,
    optionsResponse
} = require('./utils/shared');

exports.handler = async (event) => {
    if (event.httpMethod === 'OPTIONS') {
        return optionsResponse();
    }

    if (event.httpMethod === 'GET') {
        return successResponse([]);
    }

    if (event.httpMethod === 'POST') {
        return errorResponse(
            'Les avis sont désormais recueillis sur la fiche Google Horizon IT.',
            410
        );
    }

    return errorResponse('Méthode non autorisée', 405);
};
