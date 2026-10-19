const express = require('express')
const path = require('path')
const session = require('express-session')
const ganhoRoutes = require('./routes/ganhoRoutes')
const apiRoutes = require('./routes/apiRoutes')

require('./database/connection') // serve para criar conexão com banco de dados

// serve para criar conexão com banco de dados
const authRoutes = require('./routes/authRoutes')

const app = express()
const isProduction = process.env.NODE_ENV === 'production'
const sessionSecret = process.env.SESSION_SECRET || (isProduction ? '' : 'local-development-session-secret')

if (isProduction && sessionSecret.length < 32) {
    throw new Error('Configure SESSION_SECRET com pelo menos 32 caracteres no ambiente de producao.')
}

if (isProduction) {
    // O Render termina HTTPS no proxy e encaminha a requisicao ao Node por HTTP.
    app.set('trust proxy', 1)
}

// configura o express para usar o EJS
app.use(express.urlencoded({ extended: true}))
app.use(express.json())

// Rotas
app.use(session({
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        sameSite: 'lax',
        secure: isProduction
    }
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
app.use('/api', apiRoutes)

// rota inicial
app.get('/', (req, res) => {
    res.redirect('/login')
})

// Render fornece PORT e exige que o servidor aceite conexoes externas.
const port = Number(process.env.PORT) || 3000
app.listen(port, '0.0.0.0', () => {
    console.log(`Servidor rodando na porta ${port}`)
})
