const username = process.env.ADMIN_USERNAME?.trim()
const nome = process.env.ADMIN_NAME?.trim() || 'Administrador'
const senha = process.env.ADMIN_PASSWORD

if (!username || !/^[a-zA-Z0-9._-]{3,30}$/.test(username) ||
    typeof senha !== 'string' || senha.length < 12 || senha.length > 128 ||
    !nome || nome.length > 100) {
    console.error('Configure ADMIN_USERNAME (3 a 30 caracteres), ADMIN_NAME opcional e ADMIN_PASSWORD (12 a 128 caracteres).')
    process.exitCode = 1
} else {
    const { hashPassword } = require('../utils/password')

    hashPassword(senha).then((senhaHash) => {
        const db = require('./connection')
        db.get('SELECT id FROM usuarios WHERE username = ?', [username], (findErr, usuario) => {
            if (findErr) {
                console.error('Erro ao verificar a conta administradora:', findErr.message)
                process.exitCode = 1
                return db.close()
            }

            const sql = usuario
                ? 'UPDATE usuarios SET nome = ?, senha = ?, perfil = ? WHERE id = ?'
                : 'INSERT INTO usuarios (nome, username, senha, perfil) VALUES (?, ?, ?, ?)'
            const params = usuario
                ? [nome, senhaHash, 'admin', usuario.id]
                : [nome, username, senhaHash, 'admin']

            db.run(sql, params, (saveErr) => {
                if (saveErr) {
                    console.error('Erro ao salvar a conta administradora:', saveErr.message)
                    process.exitCode = 1
                } else {
                    console.log(`Conta administradora ${usuario ? 'atualizada' : 'criada'} para ${username}.`)
                }
                db.close()
            })
        })
    }).catch((hashErr) => {
        console.error('Erro ao proteger a senha da conta administradora:', hashErr.message)
        process.exitCode = 1
    })
}
