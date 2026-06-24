const db = require('../database/connection')

const ganhoModel = {
    create(dados, callback) {

        const sql = `
            INSERT INTO ganhos
            (
                usuario_id,
                data,
                plataforma,
                valor,
                horas,
                km
            )
            VALUES (?, ?, ?, ?, ?, ?)
        `

        db.run(
            sql,
            [
                dados.usuario_id,
                dados.data,
                dados.plataforma,
                dados.valor,
                dados.horas,
                dados.km
            ],
            callback
        )
    },

    findByUser(usuarioId, callback) {

        const sql = `
            SELECT *
            FROM ganhos
            WHERE usuario_id = ?
            ORDER BY data DESC
        `

        db.all(sql, [usuarioId], callback)
    }

}

module.exports = ganhoModel