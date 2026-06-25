const express = require('express')
const path = require('path')
const session = require('express-session')
const ganhoRoutes = require('./routes/ganhoRoutes')

require('./database/connection') // serve para criar conexão com banco de dados

// serve para criar conexão com banco de dados
const authRoutes = require('./routes/authRoutes')

const app = express()

// configura o express para usar o EJS
app.use(express.urlencoded({ extended: true}))
app.use(express.json())

// Rotas
app.use(session({
    secret: 'uber-control-secret',
    resave: false,
    saveUninitialized: false
}))

// configura o EJS
//app.engine('ejs', ejs.renderFile)
app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, 'views'))

// Arquivos estáticos
app.use(express.static(path.join(__dirname, '..', 'public')))

// rotas
app.use(authRoutes)
app.use(ganhoRoutes)

// rota inicial
app.get('/', (req, res) => {
    res.redirect('/login')
})

// subir o servidor
app.listen(3000, () => {
    console.log('Servidor rodando em localhost:3000')
})