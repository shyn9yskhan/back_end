const express = require('express');
const { Pool } = require('pg');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const app = express();
const port = 3000;

const pool = new Pool({ user: 'postgres', host: 'localhost', database: 'mydatabase', password: 'sql001', port: 5432, });
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(express.static('public'));

app.get('/', (req, res) => { res.sendFile(__dirname + '/public/home/home.html'); });
app.get('/auth/login', (req, res) => { res.sendFile(__dirname + '/public/login/login.html'); });
app.get('/user/dashboard', (req, res) => { res.sendFile(__dirname + '/public/user/dashboard/dashboard.html'); });
app.get('/admin/dashboard', (req, res) => { res.sendFile(__dirname + '/public/admin/dashboard/dashboard.html'); });
app.get('/moderator/dashboard', (req, res) => { res.sendFile(__dirname + '/public/moderator/dashboard/dashboard.html'); });
app.get('/auth/register', (req, res) => { res.sendFile(__dirname + '/public/register/register.html'); });
app.post('/auth/register', async (req, res) => { const { username, email, password } = req.body;

const hashedPassword = await bcrypt.hash(password, 10);
const query = 'INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING *';
const values = [username, email, hashedPassword];

try { const result = await pool.query(query, values);
    res.json(result.rows[0]); }
    catch (error) { console.error(error);
        res.status(500).send('Error registering user'); } });
        app.listen(port, () => { console.log(`Server is running on http://localhost:${port}`); });