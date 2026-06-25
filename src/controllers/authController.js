const userModel = require('../models/userModel')
const ganhoModel = require('../models/ganhoModel')

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

            if(senha !== usuario.senha) {
                return res.render('auth/login', {
                    erro: 'Senha incorreta'
                })
            }

            req.session.usuario = {
                id: usuario.id,
                username: usuario.username,
                perfil: usuario.perfil
            }

            // serve para redirecionar para a página de dashboard
            res.redirect('/dashboard')
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