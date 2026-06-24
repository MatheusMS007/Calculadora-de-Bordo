const express = require('express')
const router = express.Router()

const ganhoController = require('../controllers/ganhoController')

// exibir de novo ganho
router.get('/ganhos/novo', ganhoController.showForm)

//salvar ganho
router.post('/ganhos', ganhoController.store)

// lista ganhos
router.get('/ganhos', ganhoController.list)

module.exports = router