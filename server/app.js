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

// Session setup
app.use(
  session({
    secret: 'maz-event-secret-key-2025-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false, // set to true in production if using HTTPS
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  })
);

// 🔒 List of protected HTML files (relative to public/)
const PROTECTED_HTML_FILES = [
  '/admin-dashboard.html',
  '/manage-companies.html',
  '/raffle-setup.html',
  '/raffle-wheel.html'
  // Add more if needed
];

// Custom static middleware: skip protected files
const publicPath = path.join(__dirname, '../public');
app.use((req, res, next) => {
  // If the requested path is a protected HTML file, skip static serving
  if (PROTECTED_HTML_FILES.includes(req.path)) {
    return next(); // let explicit routes handle it
  }
  // Otherwise, serve static files normally
  express.static(publicPath)(req, res, next);
});

// Auth middleware
function requireAdminAuth(req, res, next) {
  if (req.session && req.session.adminLoggedIn) {
    return next();
  }
  res.redirect('/admin');
}

// API Routes
app.use('/api/admin', require('./routes/admin'));
app.use('/api/guests', require('./routes/guests'));
app.use('/api/companies', require('./routes/companies'));

// === PUBLIC ROUTES ===
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});


app.get('/admin/', (req, res) => {
  res.redirect('/admin-login.html');
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/admin-login.html'));
});

// === PROTECTED ADMIN PAGES ===
app.get('/admin-dashboard.html', requireAdminAuth, (req, res) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.sendFile(path.join(__dirname, '../public/admin-dashboard.html'));
});

app.get('/manage-companies.html', requireAdminAuth, (req, res) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.sendFile(path.join(__dirname, '../public/manage-companies.html'));
});

app.get('/raffle-setup.html', requireAdminAuth, (req, res) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.sendFile(path.join(__dirname, '../public/raffle-setup.html'));
});

app.get('/raffle-wheel.html', requireAdminAuth, (req, res) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.sendFile(path.join(__dirname, '../public/raffle-wheel.html'));
});

// === LOGOUT ENDPOINT ===
app.post('/api/admin/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Could not log out' });
    }
    res.clearCookie('connect.sid');
    res.json({ message: 'Logged out successfully' });
  });
});

// Fallback 404
app.use((req, res) => {
  res.status(404).send('Page not found');
});

app.listen(PORT, () => {
  console.log(`MAZ Event App running on http://localhost:${PORT}`);
  console.log(`Admin running on http://localhost:${PORT}/admin`);
});
