const crypto = require('crypto')
const express = require('express')
const router = express.Router()
const userModel = require('../models/userModel')
const ganhoModel = require('../models/ganhoModel')
const apiTokenModel = require('../models/apiTokenModel')
const { requireApiAuth, hashToken } = require('../middleware/apiAuth')

const TOKEN_LIFETIME_MS = 30 * 24 * 60 * 60 * 1000

router.post('/auth/login', (req, res) => {
    const { username, senha } = req.body
    if (typeof username !== 'string' || typeof senha !== 'string' || !username.trim() || !senha) {
        return res.status(400).json({ erro: 'Informe usuário e senha.' })
    }

    userModel.findByUsername(username.trim(), (err, usuario) => {
        if (err) {
            console.error('Erro ao buscar usuário para a API:', err)
            return res.status(500).json({ erro: 'Não foi possível entrar.' })
        }

        if (!usuario || senha !== usuario.senha) {
            return res.status(401).json({ erro: 'Usuário ou senha inválidos.' })
        }

        const token = crypto.randomBytes(32).toString('hex')
        const expiresAt = new Date(Date.now() + TOKEN_LIFETIME_MS).toISOString()

        apiTokenModel.create(usuario.id, hashToken(token), expiresAt, (createErr) => {
            if (createErr) {
                console.error('Erro ao criar token da API:', createErr)
                return res.status(500).json({ erro: 'Não foi possível criar a sessão.' })
            }

            res.json({
                token,
                tipo: 'Bearer',
                expiraEm: expiresAt,
                usuario: { id: usuario.id, username: usuario.username, perfil: usuario.perfil }
            })
        })
    })
})

router.post('/auth/logout', requireApiAuth, (req, res) => {
    apiTokenModel.delete(req.apiTokenHash, (err) => {
        if (err) {
            console.error('Erro ao encerrar sessão da API:', err)
            return res.status(500).json({ erro: 'Não foi possível encerrar a sessão.' })
        }
        res.status(204).end()
    })
})

router.get('/dashboard', requireApiAuth, (req, res) => {
    ganhoModel.getResumoByUser(req.apiUsuario.id, (err, resumo) => {
        if (err) {
            console.error('Erro ao carregar dashboard da API:', err)
            return res.status(500).json({ erro: 'Não foi possível carregar o resumo.' })
        }
        res.json({ usuario: req.apiUsuario, resumo })
    })
})

router.get('/ganhos', requireApiAuth, (req, res) => {
    ganhoModel.findByUser(req.apiUsuario.id, (err, ganhos) => {
        if (err) {
            console.error('Erro ao listar ganhos pela API:', err)
            return res.status(500).json({ erro: 'Não foi possível buscar os ganhos.' })
        }
        res.json({ ganhos })
    })
})

router.post('/ganhos', requireApiAuth, (req, res) => {
    const { data, plataforma, valor, horas, km } = req.body
    const valorNumerico = Number(valor)
    const horasNumericas = horas === undefined || horas === '' ? null : Number(horas)
    const kmNumericos = km === undefined || km === '' ? null : Number(km)

    if (typeof data !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(data) ||
        typeof plataforma !== 'string' || !plataforma.trim() ||
        !Number.isFinite(valorNumerico) || valorNumerico <= 0 ||
        (horasNumericas !== null && (!Number.isFinite(horasNumericas) || horasNumericas < 0)) ||
        (kmNumericos !== null && (!Number.isFinite(kmNumericos) || kmNumericos < 0))) {
        return res.status(400).json({ erro: 'Confira data, plataforma, valor, horas e quilômetros.' })
    }

    ganhoModel.create({
        usuario_id: req.apiUsuario.id,
        data,
        plataforma: plataforma.trim(),
        valor: valorNumerico,
        horas: horasNumericas,
        km: kmNumericos
    }, function (err) {
        if (err) {
            console.error('Erro ao salvar ganho pela API:', err)
            return res.status(500).json({ erro: 'Não foi possível salvar o ganho.' })
        }
        res.status(201).json({ id: this.lastID, mensagem: 'Ganho registrado.' })
    })
})

module.exports = router
