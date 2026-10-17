const db = require('../database/connection')

const pushTokenModel = {
    upsert(usuarioId, token, platform, deviceName, callback) {
        db.run(
            `INSERT INTO expo_push_tokens (usuario_id, token, platform, device_name)
             VALUES (?, ?, ?, ?)
             ON CONFLICT(token) DO UPDATE SET
                usuario_id = excluded.usuario_id,
                platform = excluded.platform,
                device_name = excluded.device_name,
                updated_at = CURRENT_TIMESTAMP`,
            [usuarioId, token, platform, deviceName || null],
            callback
        )
    },

    findByUser(usuarioId, callback) {
        db.all('SELECT token FROM expo_push_tokens WHERE usuario_id = ?', [usuarioId], callback)
    },

    findAll(callback) {
        db.all('SELECT usuario_id, token FROM expo_push_tokens', callback)
    },

    deleteForUser(usuarioId, token, callback) {
        db.run('DELETE FROM expo_push_tokens WHERE usuario_id = ? AND token = ?', [usuarioId, token], callback)
    },

    deleteByToken(token, callback) {
        db.run('DELETE FROM expo_push_tokens WHERE token = ?', [token], callback)
    },
}

module.exports = pushTokenModel
