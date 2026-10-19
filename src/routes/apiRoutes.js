const crypto = require('crypto')
const express = require('express')
const router = express.Router()
const userModel = require('../models/userModel')
const ganhoModel = require('../models/ganhoModel')
const apiTokenModel = require('../models/apiTokenModel')
const pushTokenModel = require('../models/pushTokenModel')
const { sendPushNotificationsInBatches } = require('../services/pushNotificationService')
const { requireApiAuth, hashToken } = require('../middleware/apiAuth')
const { hashPassword, verifyPassword, isLegacyPassword } = require('../utils/password')

const TOKEN_LIFETIME_MS = 30 * 24 * 60 * 60 * 1000

// Cria uma conta de usuário com senha protegida por hash.
router.post('/auth/register', async (req, res) => {
    const { nome, username, senha } = req.body
    const nomeNormalizado = typeof nome === 'string' ? nome.trim() : ''
    const usernameNormalizado = typeof username === 'string' ? username.trim() : ''

    if (!nomeNormalizado || nomeNormalizado.length > 100 ||
        !/^[a-zA-Z0-9._-]{3,30}$/.test(usernameNormalizado) ||
        typeof senha !== 'string' || senha.length < 8 || senha.length > 128) {
        return res.status(400).json({ erro: 'Informe nome, username válido (3 a 30 caracteres) e senha de 8 a 128 caracteres.' })
    }

    userModel.findByUsername(usernameNormalizado, async (findErr, existingUser) => {
        if (findErr) {
            console.error('Erro ao verificar username no cadastro:', findErr)
            return res.status(500).json({ erro: 'Não foi possível criar a conta.' })
        }
        if (existingUser) {
            return res.status(409).json({ erro: 'Este username já está em uso.' })
        }

        try {
            const hashedPassword = await hashPassword(senha)
            userModel.create({
                nome: nomeNormalizado,
                username: usernameNormalizado,
                senha: hashedPassword,
                perfil: 'usuario'
            }, (createErr, id) => {
                if (createErr) {
                    if (createErr.code === 'SQLITE_CONSTRAINT' || createErr.code === 'SQLITE_CONSTRAINT_UNIQUE') {
                        return res.status(409).json({ erro: 'Este username já está em uso.' })
                    }
                    console.error('Erro ao criar conta pela API:', createErr)
                    return res.status(500).json({ erro: 'Não foi possível criar a conta.' })
                }
                return res.status(201).json({ mensagem: 'Conta criada com sucesso.', usuario: { id, nome: nomeNormalizado, username: usernameNormalizado } })
            })
        } catch (hashErr) {
            console.error('Erro ao proteger a senha do novo usuário:', hashErr)
            return res.status(500).json({ erro: 'Não foi possível criar a conta.' })
        }
    })
})

// Valida as credenciais e emite um token Bearer válido por 30 dias.
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

        if (!usuario) {
            return res.status(401).json({ erro: 'Usuário ou senha inválidos.' })
        }

        verifyPassword(senha, usuario.senha).then((passwordIsValid) => {
            if (!passwordIsValid) {
                return res.status(401).json({ erro: 'Usuário ou senha inválidos.' })
            }

            const createSession = () => {
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
            }

            if (!isLegacyPassword(usuario.senha)) return createSession()

            hashPassword(senha)
                .then((newHash) => userModel.updatePassword(usuario.id, newHash, (updateErr) => {
                    if (updateErr) console.error('Não foi possível atualizar o hash da senha legada:', updateErr)
                    createSession()
                }))
                .catch((hashErr) => {
                    console.error('Não foi possível proteger a senha legada:', hashErr)
                    createSession()
                })
        }).catch((verifyErr) => {
            console.error('Erro ao verificar senha da API:', verifyErr)
            res.status(500).json({ erro: 'Não foi possível entrar.' })
        })
    })
})

// Invalida o token da sessão atual.
router.post('/auth/logout', requireApiAuth, (req, res) => {
    apiTokenModel.delete(req.apiTokenHash, (err) => {
        if (err) {
            console.error('Erro ao encerrar sessão da API:', err)
            return res.status(500).json({ erro: 'Não foi possível encerrar a sessão.' })
        }
        res.status(204).end()
    })
})

// Associa o aparelho autenticado ao serviço de notificações push.
router.post('/notifications/device', requireApiAuth, (req, res) => {
    const { token, platform, deviceName } = req.body
    if (typeof token !== 'string' || !/^(Expo|Exponent)PushToken\[[A-Za-z0-9_-]+\]$/.test(token) ||
        !['android', 'ios'].includes(platform) ||
        (deviceName !== undefined && (typeof deviceName !== 'string' || deviceName.length > 100))) {
        return res.status(400).json({ erro: 'Dados de registro de notificação inválidos.' })
    }

    pushTokenModel.upsert(req.apiUsuario.id, token, platform, deviceName, (err) => {
        if (err) {
            console.error('Erro ao registrar dispositivo para push:', err)
            return res.status(500).json({ erro: 'Não foi possível ativar as notificações.' })
        }
        res.status(201).json({ mensagem: 'Dispositivo registrado para notificações.' })
    })
})

// Remove o aparelho autenticado dos destinatários de notificações push.
router.delete('/notifications/device', requireApiAuth, (req, res) => {
    const { token } = req.body
    if (typeof token !== 'string' || !/^(Expo|Exponent)PushToken\[[A-Za-z0-9_-]+\]$/.test(token)) {
        return res.status(400).json({ erro: 'Token de notificação inválido.' })
    }

    pushTokenModel.deleteForUser(req.apiUsuario.id, token, (err) => {
        if (err) {
            console.error('Erro ao remover dispositivo de push:', err)
            return res.status(500).json({ erro: 'Não foi possível desativar as notificações.' })
        }
        res.status(204).end()
    })
})

// Envia uma notificação de teste aos aparelhos do usuário autenticado.
router.post('/notifications/test', requireApiAuth, (req, res) => {
    pushTokenModel.findByUser(req.apiUsuario.id, async (err, devices) => {
        if (err) {
            console.error('Erro ao buscar dispositivos de push:', err)
            return res.status(500).json({ erro: 'Não foi possível enviar a notificação.' })
        }
        if (!devices.length) return res.status(404).json({ erro: 'Ative as notificações neste aparelho primeiro.' })

        try {
            const tickets = await sendPushNotificationsInBatches(devices.map(({ token }) => ({
                to: token,
                title: 'Calculadora de Bordo',
                body: 'As notificações push estão funcionando neste aparelho.',
                sound: 'default',
                channelId: 'default',
            })))
            const failures = tickets.filter((ticket) => ticket?.status === 'error')
            if (failures.length) {
                console.error('Expo Push Service rejeitou notificações de teste:', failures)
                return res.status(502).json({ erro: 'O serviço de notificações não aceitou o envio. Confira as credenciais do projeto.' })
            }
            res.json({ mensagem: 'Notificação de teste enviada.' })
        } catch (sendErr) {
            console.error('Erro ao enviar notificação de teste:', sendErr)
            res.status(502).json({ erro: 'Não foi possível conectar ao serviço de notificações.' })
        }
    })
})

// Envia um aviso push a todos os aparelhos registrados; somente para administradores.
router.post('/notifications/admin', requireApiAuth, (req, res) => {
    if (req.apiUsuario.perfil !== 'admin') {
        return res.status(403).json({ erro: 'Somente administradores podem enviar avisos.' })
    }

    const title = typeof req.body.title === 'string' ? req.body.title.trim() : ''
    const body = typeof req.body.body === 'string' ? req.body.body.trim() : ''
    if (!title || title.length > 80 || !body || body.length > 500) {
        return res.status(400).json({ erro: 'Informe título (até 80 caracteres) e mensagem (até 500 caracteres).' })
    }

    pushTokenModel.findAll(async (err, devices) => {
        if (err) {
            console.error('Erro ao buscar dispositivos inscritos para aviso:', err)
            return res.status(500).json({ erro: 'Não foi possível buscar os destinatários.' })
        }
        if (!devices.length) return res.status(404).json({ erro: 'Nenhum aparelho ativou as notificações push.' })

        try {
            const messages = devices.map(({ token }) => ({
                to: token,
                title,
                body,
                sound: 'default',
                channelId: 'default',
            }))
            const tickets = await sendPushNotificationsInBatches(messages)
            const invalidTokens = tickets.flatMap((ticket, index) =>
                ticket?.details?.error === 'DeviceNotRegistered' ? [devices[index]?.token] : [])
            await Promise.all(invalidTokens.filter(Boolean).map((pushToken) => new Promise((resolve) => {
                pushTokenModel.deleteByToken(pushToken, resolve)
            })))
            const failures = tickets.filter((ticket) => ticket?.status === 'error')
            if (failures.length === tickets.length) {
                return res.status(502).json({ erro: 'O serviço de notificações rejeitou o envio. Confira as credenciais push.' })
            }
            res.json({ mensagem: `Aviso enviado para ${tickets.length - failures.length} aparelho(s).`, enviados: tickets.length - failures.length })
        } catch (sendErr) {
            console.error('Erro ao enviar aviso administrativo:', sendErr)
            res.status(502).json({ erro: 'Não foi possível conectar ao serviço de notificações.' })
        }
    })
})

// Retorna os dados da conta autenticada.
router.get('/auth/me', requireApiAuth, (req, res) => {
    res.json({ usuario: req.apiUsuario })
})

// Atualiza o nome do usuário autenticado.
router.patch('/auth/profile', requireApiAuth, (req, res) => {
    const nome = typeof req.body.nome === 'string' ? req.body.nome.trim() : ''
    if (!nome || nome.length > 100) {
        return res.status(400).json({ erro: 'Informe um nome com até 100 caracteres.' })
    }

    userModel.updateName(req.apiUsuario.id, nome, (err) => {
        if (err) {
            console.error('Erro ao atualizar nome do usuário:', err)
            return res.status(500).json({ erro: 'Não foi possível atualizar o nome.' })
        }
        req.apiUsuario.nome = nome
        res.json({ mensagem: 'Nome atualizado.', usuario: req.apiUsuario })
    })
})

// Confere a senha atual e salva a nova senha protegida por hash.
router.patch('/auth/password', requireApiAuth, (req, res) => {
    const { senhaAtual, novaSenha } = req.body
    if (typeof senhaAtual !== 'string' || !senhaAtual || typeof novaSenha !== 'string' ||
        novaSenha.length < 8 || novaSenha.length > 128) {
        return res.status(400).json({ erro: 'Informe a senha atual e uma nova senha de 8 a 128 caracteres.' })
    }

    userModel.findByUsername(req.apiUsuario.username, async (findErr, usuario) => {
        if (findErr || !usuario) {
            console.error('Erro ao buscar usuário para alterar senha:', findErr)
            return res.status(500).json({ erro: 'Não foi possível alterar a senha.' })
        }

        try {
            if (!await verifyPassword(senhaAtual, usuario.senha)) {
                return res.status(401).json({ erro: 'A senha atual está incorreta.' })
            }
            const novaSenhaHash = await hashPassword(novaSenha)
            userModel.updatePassword(usuario.id, novaSenhaHash, (updateErr) => {
                if (updateErr) {
                    console.error('Erro ao salvar nova senha:', updateErr)
                    return res.status(500).json({ erro: 'Não foi possível alterar a senha.' })
                }
                res.json({ mensagem: 'Senha atualizada.' })
            })
        } catch (error) {
            console.error('Erro ao proteger nova senha:', error)
            res.status(500).json({ erro: 'Não foi possível alterar a senha.' })
        }
    })
})

// Retorna os dados do usuário e o resumo dos ganhos.
router.get('/dashboard', requireApiAuth, (req, res) => {
    ganhoModel.getResumoByUser(req.apiUsuario.id, (err, resumo) => {
        if (err) {
            console.error('Erro ao carregar dashboard da API:', err)
            return res.status(500).json({ erro: 'Não foi possível carregar o resumo.' })
        }
        res.json({ usuario: req.apiUsuario, resumo })
    })
})

// Lista os ganhos pertencentes ao usuário autenticado.
router.get('/ganhos', requireApiAuth, (req, res) => {
    ganhoModel.findByUser(req.apiUsuario.id, (err, ganhos) => {
        if (err) {
            console.error('Erro ao listar ganhos pela API:', err)
            return res.status(500).json({ erro: 'Não foi possível buscar os ganhos.' })
        }
        res.json({ ganhos })
    })
})

// Valida e registra um ganho para o usuário autenticado.
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
