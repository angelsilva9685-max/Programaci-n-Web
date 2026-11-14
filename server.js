const express = require('express');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcrypt');
const mysql = require('mysql2');

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
            res.redirect('/torneos.html');
        } else {
            res.send('<body style="background-color: #0b0c10; color: #fff; font-family: sans-serif; text-align: center; padding-top: 50px;"><h2 style="color: #ff4655;">Contraseña incorrecta</h2><a href="login.html" style="color: #ff4655; text-decoration: none; font-weight: bold;">Volver a intentar</a></body>');
        }
    } else {
        res.send('<body style="background-color: #0b0c10; color: #fff; font-family: sans-serif; text-align: center; padding-top: 50px;"><h2 style="color: #ff4655;">Usuario no encontrado</h2><a href="login.html" style="color: #ff4655; text-decoration: none; font-weight: bold;">Volver a intentar</a></body>');
    }
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