const crypto = require('crypto')
const apiTokenModel = require('../models/apiTokenModel')

function hashToken(token) {
    // Guarda no banco apenas o hash do token, não o valor original.
    return crypto.createHash('sha256').update(token).digest('hex')
}

// Exige um Bearer token válido e disponibiliza o usuário nas rotas protegidas.
function requireApiAuth(req, res, next) {
    const authorization = req.get('authorization') || ''
    const match = authorization.match(/^Bearer\s+(.+)$/i)

    if (!match) {
        return res.status(401).json({ erro: 'Token de autenticação obrigatório.' })
    }

    const token = match[1].trim()
    if (!token) {
        return res.status(401).json({ erro: 'Token de autenticação inválido.' })
    }

    apiTokenModel.findValid(hashToken(token), (err, usuario) => {
        if (err) {
            console.error('Erro ao validar token da API:', err)
            return res.status(500).json({ erro: 'Não foi possível validar a sessão.' })
        }

        if (!usuario) {
            return res.status(401).json({ erro: 'Token inválido ou expirado.' })
        }

        req.apiUsuario = usuario
        req.apiTokenHash = hashToken(token)
        next()
    })
}

module.exports = { requireApiAuth, hashToken }
