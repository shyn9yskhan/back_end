const express = require("express");
const session = require("express-session");
const MongoDBSession = require("connect-mongodb-session")(session);
const mongoose = require("mongoose");
const app = express();

const mongoURI = "mongodb://localhost:27017/sessions";

mongoose.connect(mongoURI)
.then((res) => {
  console.log("MongoDB connected");
});

const store = new MongoDBSession({
  uri: mongoURI,
  collection: "mySessions",
});

app.use(
  session({
    secret: 'goiuytvjir413c',
    resave: false,
    saveUninitialized: false,
    store: store,
  })
);

const isAuth = (req, res, next) => {
  if(req.session.isAuth) {
    next();
  } else {
    res.redirect('/auth/login');
  }
}

const isModeratorOrAdmin = (req, res, next) => {
  if(req.session.role === "moderator" || req.session.role === "admin") {
    next();
  } else {
    res.status(403).send("Forbidden");
  }
}

const isAdmin = (req, res, next) => {
  if(req.session.role === "admin") {
    next();
  } else {
    res.status(403).send("Forbidden");
  }
}

const { Pool } = require('pg');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const port = 3000;
  
  const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'mydatabase',
    password: 'sql001',
    port: 5432,
  });
  pool.on('connect', () => {
    console.log('PostgreSQL connected');
  });

  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(bodyParser.json());

app.use(express.static('public'));

app.get('/user/dashboard', isAuth, (req, res) => {
    res.sendFile(__dirname + '/public/user/dashboard.html');
  });

//map
app.get('/user/map', isAuth, (req, res) => {
  res.sendFile(__dirname + '/public/user/map.html');
});
//map
  
app.get('/admin/dashboard', isAuth, isAdmin, (req, res) => {
  res.sendFile(__dirname + '/public/admin/dashboard.html');
});
  
app.get('/moderator/dashboard', isAuth, isModeratorOrAdmin, (req, res) => {
  res.sendFile(__dirname + '/public/moderator/dashboard.html');
});

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/home/home.html');
});

app.get('/auth/login', (req, res) => {
  res.sendFile(__dirname + '/public/login/login.html');
});
  
app.get('/auth/register', (req, res) => {
  res.sendFile(__dirname + '/public/register/register.html');
});

app.post('/auth/login', async (req, res) => {
    const { username, password } = req.body;
    const query = 'SELECT * FROM users WHERE username = $1';
    const roleQuery = 'SELECT role FROM users WHERE username = $1';
    const values = [username];

    try {
        const result = await pool.query(query, values);

        if (result.rows.length === 0) {
            res.status(401).send('Invalid username or password');
            return;
          }
          const user = result.rows[0];
          const isPasswordValid = await bcrypt.compare(password, user.password);
          
          if (isPasswordValid) {

            const roleResult = await pool.query(roleQuery, values);
            if (roleResult.rows.length === 0) {
              res.status(500).send('Error retrieving user role');
              return;
            }
            const userRole = roleResult.rows[0].role;

            let redirectPath = '/user/dashboard';
            if (user.role === 'admin') {
                redirectPath = '/admin/dashboard';
            } else if (user.role === 'moderator') {
                redirectPath = '/moderator/dashboard';
            }

            req.session.role = userRole;
            req.session.isAuth = true;
            res.redirect(redirectPath);
          }
          else {res.status(401).send('Invalid username or password');}
            
    } catch (error) {
        console.error(error);
        res.status(500).send('Error during login');
    }
});

app.post('/logout', (req, res) => {
    if (req.session) {
        req.session.destroy(err => {
            if (err) {
                console.error('Error during logout:', err);
                res.status(500).send('Internal Server Error');
            } else {
                res.status(200).send('Logout successful');
            }
        });
    } else {
        res.status(400).send('No active session');
    }
});

app.post('/auth/register', async (req, res) => {
    const { username, email, password } = req.body;
    const role = "user";
    const hashedPassword = await bcrypt.hash(password, 10);
    const query = 'INSERT INTO users (username, email, password, role) VALUES ($1, $2, $3, $4) RETURNING *';
    const values = [username, email, hashedPassword, role];
    try {
        const result = await pool.query(query, values);
        //redirect to login page
        res.redirect('/auth/login');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error registering user');
    }
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});