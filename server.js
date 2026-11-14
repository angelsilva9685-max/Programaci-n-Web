const express = require('express');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcrypt');
const mysql = require('mysql2');
const session = require('express-session');

const host = 'localhost';
const port = 8080;
const app = express();

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '123456789', 
    database: 'login'
});

db.connect((err) => {
    if (err) {
        console.error('Error connecting to the database:', err);
        return;
    } else {
        console.log('Connected to the database');
    }
});

app.use(session({
    secret: 'vsgame-secreto-dev',
    resave: false,
    saveUninitialized: false
}));
function requireSession(req, res, next) {
    if(!req.session.usuario) return res.redirect('/login.html');
    next();
}
function escapeHTML(texto){
    return String(texto)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
app.get('/torneos.html', requireSession, (req, res) => {
    fs.readFile(path.join(__dirname, 'torneos.html'), 'utf8', (err, html) => {
        if (err) {
            res.status(500).send('No se pudo cargar la página');
            return;
        }
        html = html.split('__NOMBRE__').join(escapeHTML(req.session.usuario));
        res.send(html);
    });
});

app.get('/logout', (req, res) => {
    req.session.destroy(() => res.redirect('/index.html'));
});

app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname));


app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'inicio.html'));
});


app.post('/login', (req, res) => {
    const user = req.body.usuario;
    const pass = req.body.contraseña;
    const sql = 'SELECT * FROM usuarios WHERE usuario = ?';

    db.query(sql, [user], (err, results) => {
        if (err){
            console.error('Error al consultar la base de datos:', err);
            res.send('Error al consultar la base de datos');
            return;
        } else if (results.length > 0) {
            const hashGuardado = results[0].contraseña;
            const coinciden = bcrypt.compareSync(pass, hashGuardado);
            if (coinciden) {
                req.session.usuario = user;
                res.redirect('/torneos.html');
            } else {
                res.send('Contraseña incorrecta');
            }
        } else {
            res.send('Usuario no encontrado');
        };
    });

});

app.post('/nuevo-registro', (req, res) => {
    console.log('¡Petición de registro recibida en el backend!');
    
    const user = req.body.usuario;
    const pass = req.body.contraseña;
    const hash = bcrypt.hashSync(pass, 10);
    const sql = 'INSERT INTO usuarios (usuario, contraseña) VALUES (?, ?)';
    
    db.query(sql, [user, hash], (err, result) => {
        if (err) {
            console.error('Error al registrar usuario:', err);
            res.send('Error al registrar. Es posible que el usuario ya exista');
        } else {
            res.redirect('/registro-exitoso.html');
        }
    });
});

app.listen(port, host, () => {
    console.log(`Server is running on http://${host}:${port}`);
});