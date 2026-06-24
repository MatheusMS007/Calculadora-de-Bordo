const db = require('./connection')

const sql = `
    INSERT INTO usuarios (username, senha, nome, perfil)
    VALUES (?, ?, ?, ?)`

    db.run(sql, ['admin', 'admin123', 'Administrador', 'admin'], (err) => {
        if(err) {
            console.log('Erro ao inserir usuário admin:', err)
        } else {
            console.log('Admin criado com sucesso!')
        }
    })