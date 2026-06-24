const express = require('express')// importa o express
const router = express.Router() // cria agrupado de rotas

// importa o controller
const authController =  require('../controllers/authController')

// rota mostra a tela de login
router.get('/', authController.showLogin)
// faz login
router.post('/login', authController.login)
// faz logout
router.get('/logout', authController.logout)
// rota mostra a tela de dashboard
router.get('/dashboard', authController.dashboard)

// exporta o router
module.exports = router