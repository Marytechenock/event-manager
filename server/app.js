const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');
const session = require('express-session');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Session setup (required for login persistence)
app.use(
  session({
    secret: 'maz-event-secret-key-2025-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true, // ✅ prevents XSS access to cookie
      secure: false,  // set to true if using HTTPS in production
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  })
);

// Serve static files (CSS, JS, images, public HTML)
app.use(express.static(path.join(__dirname, '../public')));

// Auth middleware: protect admin pages
function requireAdminAuth(req, res, next) {
  if (req.session && req.session.adminLoggedIn) {
    return next();
  }
  // Redirect unauthenticated users to login
  res.redirect('/admin');
}

// API Routes
app.use('/api/admin', require('./routes/admin'));
app.use('/api/guests', require('./routes/guests'));
app.use('/api/companies', require('./routes/companies'));

// === PUBLIC ROUTES (no auth required) ===
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/admin-login.html'));
});

// === PROTECTED ADMIN PAGES (require auth) ===
app.get('/admin-dashboard.html', requireAdminAuth, (req, res) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.sendFile(path.join(__dirname, '../public/admin-dashboard.html'));
});

app.get('/manage-companies.html', requireAdminAuth, (req, res) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.sendFile(path.join(__dirname, '../public/manage-companies.html'));
});

// === LOGOUT ENDPOINT (destroys session) ===
app.post('/api/admin/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Could not log out' });
    }
    res.clearCookie('connect.sid'); // clear session cookie
    res.json({ message: 'Logged out successfully' });
  });
});

// Handle 404 for other routes
app.use((req, res) => {
  res.status(404).send('Page not found');
});

app.listen(PORT, () => {
  console.log(`MAZ Event App running on http://localhost:${PORT}`);
});