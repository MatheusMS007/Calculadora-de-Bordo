const db = require('../database/connection')

const ganhoModel = {
    create(dados, callback) {

        // Query SQL para inserir um novo ganho no banco de dados
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

        // Executa a query de inserção no banco de dados
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

    // Buscar ganhos por usuário
    findByUser(usuarioId, callback) {

        const sql = `
            SELECT *
            FROM ganhos
            WHERE usuario_id = ?
            ORDER BY data DESC
        `
        db.all(sql, [usuarioId], callback)
    },

    // Buscar resumo de ganhos por usuário
    getResumoByUser(usuarioId, callback) {
        const sql = `
        SELECT
            COUNT(*) AS totalRegistros,
            COALESCE(SUM(valor), 0) AS totalGanhos
            FROM ganhos
            WHERE usuario_id = ?
            `

            db.get(sql, [usuarioId], callback)
    }
}

module.exports = ganhoModel