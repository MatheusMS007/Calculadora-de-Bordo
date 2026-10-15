const db = require('../database/connection')

const apiTokenModel = {
    create(usuarioId, tokenHash, expiresAt, callback) {
        db.run(
            'INSERT INTO api_tokens (usuario_id, token_hash, expires_at) VALUES (?, ?, ?)',
            [usuarioId, tokenHash, expiresAt],
            callback
        )
    },

    findValid(tokenHash, callback) {
        db.get(
            `SELECT usuarios.id, usuarios.username, usuarios.perfil
             FROM api_tokens
             JOIN usuarios ON usuarios.id = api_tokens.usuario_id
             WHERE api_tokens.token_hash = ? AND api_tokens.expires_at > ?`,
            [tokenHash, new Date().toISOString()],
            callback
        )
    },

    delete(tokenHash, callback) {
        db.run('DELETE FROM api_tokens WHERE token_hash = ?', [tokenHash], callback)
    }
}

module.exports = apiTokenModel
