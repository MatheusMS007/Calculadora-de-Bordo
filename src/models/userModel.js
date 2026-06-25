// serve para criar função de acesso ao banco de dados
const db = require('../database/connection')

// vai criar uma função para buscar usuário no banco de dados
const userModel = {
    findByUsername: (username, callback) => {
        const sql = 'SELECT * FROM usuarios WHERE username = ?'
        db.get(sql,[username], (err, row) => {
            callback(err, row)
        })
},

// serve para criar função de inserir usuário no banco de dados
 create: (user, callback) => {
        const sql =
            'INSERT INTO usuarios (username, senha, perfil) VALUES (?, ?, ?)'

        db.run(sql, [user.username, user.senha, user.perfil], function (err) {
            callback(err, this?.lastID)
        })
    }
}

module.exports = userModel // serve para exportar o modelo