const express = require('express');
const session = require('express-session');
const { Pool } = require('pg');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const app = express();
const port = 3000;

app.use(session({
    secret: '1$3v3r-S33Cr3tK3y!#4MyApp',
    resave: false,
    saveUninitialized: false
  }));
  
  const pool = new Pool({ user: 'postgres', host: 'localhost', database: 'mydatabase', password: 'sql001', port: 5432, });
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(bodyParser.json());

// Middleware to check if the user is authenticated
//const isAuthenticated = (req, res, next) => {
//    if (req.session && req.session.user) {
//      next();
//    } else {
//      res.redirect('/auth/login');
//    }
//  };
  

// Middleware to check the user's role
//  const checkUserRole = (role) => {
//    return (req, res, next) => {
//      if (req.session.user && req.session.user.role === role) {
//        next();
//      } else {
//        res.status(403).send('Forbidden');
//      }
//    };
//  };

app.use(express.static('public'));

app.get('/user/dashboard', (req, res) => {
    res.sendFile(__dirname + '/public/user/dashboard/dashboard.html');
  });
  
app.get('/admin/dashboard', (req, res) => {
  res.sendFile(__dirname + '/public/admin/dashboard/dashboard.html');
});
  
app.get('/moderator/dashboard', (req, res) => {
  res.sendFile(__dirname + '/public/moderator/dashboard/dashboard.html');
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
            let redirectPath = '/user/dashboard';
            if (user.role === 'admin') {
                redirectPath = '/admin/dashboard';
            } else if (user.role === 'moderator') {
                redirectPath = '/moderator/dashboard';
            }
            res.redirect(redirectPath);}
            
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
    const hashedPassword = await bcrypt.hash(password, 10);
    const query = 'INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING *';
    const values = [username, email, hashedPassword];
    try {
        const result = await pool.query(query, values);
        res.json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).send('Error registering user');
    }
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});