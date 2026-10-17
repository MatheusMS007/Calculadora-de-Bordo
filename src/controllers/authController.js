const userModel = require('../models/userModel')
const ganhoModel = require('../models/ganhoModel')
const { hashPassword, verifyPassword, isLegacyPassword } = require('../utils/password')

// serve para criar funções de autenticação
const authController = {
    showLogin(req, res) {
        res.render('auth/login')
    },

    // serve para criar função de login
    login(req, res) {
        const {username, senha} = req.body
        if(!username || !senha) {
            return res.render('auth/login', {
                erro: 'Preencher os campos'
            })
        }

        // serve para buscar usuário no banco de dados
        userModel.findByUsername(username, (err, usuario) => {
            if(err) {
                console.log(err)
                return res.render('auth/login', {
                    erro: 'Erro na busca do usuário'
                })
            }

            if(!usuario) {
                return res.render('auth/login', {
                    erro: 'Usuário não encontrado'
                })
            }

            verifyPassword(senha, usuario.senha).then((passwordIsValid) => {
                if(!passwordIsValid) {
                    return res.render('auth/login', { erro: 'Senha incorreta' })
                }

                const continueLogin = () => {
                    req.session.usuario = {
                        id: usuario.id,
                        username: usuario.username,
                        perfil: usuario.perfil
                    }
                    res.redirect('/dashboard')
                }

                if(!isLegacyPassword(usuario.senha)) return continueLogin()

                hashPassword(senha)
                    .then((newHash) => userModel.updatePassword(usuario.id, newHash, (updateErr) => {
                        if(updateErr) console.error('Não foi possível atualizar o hash da senha legada:', updateErr)
                        continueLogin()
                    }))
                    .catch((hashErr) => {
                        console.error('Não foi possível proteger a senha legada:', hashErr)
                        continueLogin()
                    })
            }).catch((verifyErr) => {
                console.error('Erro ao verificar senha:', verifyErr)
                res.render('auth/login', { erro: 'Não foi possível validar a senha.' })
            })
        })
    },

    // serve para criar função de logout
    logout(req, res) {
        req.session.destroy(() => {
            res.redirect('/')
        })
    },


    // serve para criar função de dashboard
    dashboard(req, res) {
        if (!req.session.usuario) {
            return res.redirect('/login')
    }

            ganhoModel.getResumoByUser(
                req.session.usuario.id,
                (err, resumo) => {
                    if(err) {
                        console.log(err)
                        return res.send('Erro na busca do dashboard!')
                    }

                    res.render('dashboard', {
                        usuario: req.session.usuario,
                        resumo
                    })
                }
            )
    }
}

module.exports = authController
