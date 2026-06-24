const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Cria uma conexão com o banco de dados SQLite
const db = new sqlite3.Database(
    path.resolve(__dirname, 'database.sqlite'),
    (err) => {
        if (err) {
            console.error('Erro ao conectar ao banco:', err.message);
        } else {
            console.log('Banco SQLite conectado com sucesso!');
        }
    }
);

// Cria as tabelas do banco de dados, se não existirem
db.serialize(() => {

    // Cria a tabela de usuários
    db.run(`
        CREATE TABLE IF NOT EXISTS usuarios (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            senha TEXT NOT NULL,
            nome TEXT NOT NULL,
            perfil TEXT DEFAULT 'usuario',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // Cria a tabela de ganhos
    db.run(`
        CREATE TABLE IF NOT EXISTS ganhos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            usuario_id INTEGER NOT NULL,
            data TEXT NOT NULL,
            plataforma TEXT NOT NULL,
            valor REAL NOT NULL,
            horas REAL,
            km REAL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(usuario_id) REFERENCES usuarios(id)
        )
    `);

    // Cria a tabela de gastos fixos
    db.run(`
        CREATE TABLE IF NOT EXISTS gastos_fixos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            usuario_id INTEGER NOT NULL,
            categoria TEXT NOT NULL,
            descricao TEXT,
            valor_mensal REAL NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(usuario_id) REFERENCES usuarios(id)
        )
    `);

    // Cria a tabela de gastos variáveis
    db.run(`
        CREATE TABLE IF NOT EXISTS gastos_variaveis (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            usuario_id INTEGER NOT NULL,
            data TEXT NOT NULL,
            categoria TEXT NOT NULL,
            valor REAL NOT NULL,
            descricao TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(usuario_id) REFERENCES usuarios(id)
        )
    `);

    // tabela de metas
    db.run(`
        CREATE TABLE IF NOT EXISTS metas (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            usuario_id INTEGER NOT NULL,
            meta_mensal REAL NOT NULL,
            dias_trabalhados_mes INTEGER NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(usuario_id) REFERENCES usuarios(id)
        )
    `);

});

// conexão com banco de dados
module.exports = db;