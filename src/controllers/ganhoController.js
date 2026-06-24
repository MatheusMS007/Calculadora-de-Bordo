const ganhoModel = require('../models/ganhoModel')

const ganhoController = {

    // Mostrar formulário de cadastro
    showForm(req, res) {

        if (!req.session.usuario) {
            return res.redirect('/login')
        }

        res.render('ganhos/novo')
    },

    // Salvar ganho
    store(req, res) {

        if (!req.session.usuario) {
            return res.redirect('/login')
        }

        const { data, plataforma, valor, horas, km } = req.body

        if (!data || !plataforma || !valor) {
            return res.render('ganhos/novo', {
                erro: 'Preencha os campos obrigatórios'
            })
        }

        const dados = {
            usuario_id: req.session.usuario.id,
            data,
            plataforma,
            valor,
            horas,
            km
        }

        ganhoModel.create(dados, (err) => {

            if (err) {
                console.log(err)

                return res.render('ganhos/novo', {
                    erro: 'Erro ao salvar ganho'
                })
            }

            res.redirect('/ganhos')
        })
    },

    // Listar ganhos
    list(req, res) {

        if (!req.session.usuario) {
            return res.redirect('/login')
        }

        ganhoModel.findByUser(
            req.session.usuario.id,
            (err, ganhos) => {

                if (err) {
                    console.log(err)

                    return res.send('Erro ao buscar ganhos')
                }

                res.render('ganhos/lista', {
                    ganhos
                })
            }
        )
    }

}

module.exports = ganhoController