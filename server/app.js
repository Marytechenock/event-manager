const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');
const session = require('express-session');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3030;
const SESSION_SECRET = process.env.SESSION_SECRET;

if (!SESSION_SECRET) {
  throw new Error('SESSION_SECRET is required');
}

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Session setup
app.use(
  session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  })
);

// 🔒 Protected admin HTML files
const PROTECTED_HTML_FILES = [
  '/admin-dashboard.html',
  '/manage-companies.html',
  '/raffle-setup.html',
  '/raffle-wheel.html'
];

// Static file middleware
const publicPath = path.join(__dirname, '../public');
app.use((req, res, next) => {
  if (PROTECTED_HTML_FILES.includes(req.path)) {
    return next(); // Let explicit routes handle admin pages
  }
  express.static(publicPath)(req, res, next);
});

// Admin page auth middleware
function requireAdminPageAuth(req, res, next) {
  if (req.session && req.session.adminLoggedIn) {
    return next();
  }
  res.redirect('/admin');
}

// Admin API auth middleware
function requireAdminApiAuth(req, res, next) {
  if (req.session && req.session.adminLoggedIn) {
    return next();
  }
  res.status(401).json({ error: 'Unauthorized: Admin login required' });
}

// API Routes
app.use('/api/admin', require('./routes/admin'));
app.use('/api/guests', require('./routes/guests'));
app.use('/api/companies', requireAdminApiAuth, require('./routes/companies'));
app.use('/api/raffle', require('./routes/raffle'));

// === PUBLIC ROUTES ===
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.get('/register.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/register.html'));
});

app.get('/success.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/success.html'));
});

// Admin login (public)
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/admin-login.html'));
});

app.get('/admin/', (req, res) => {
  res.redirect('/admin');
});

// === PROTECTED ADMIN PAGES ===
app.get('/admin-dashboard.html', requireAdminPageAuth, (req, res) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.sendFile(path.join(__dirname, '../public/admin-dashboard.html'));
});

app.get('/manage-companies.html', requireAdminPageAuth, (req, res) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.sendFile(path.join(__dirname, '../public/manage-companies.html'));
});

app.get('/raffle-setup.html', requireAdminPageAuth, (req, res) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.sendFile(path.join(__dirname, '../public/raffle-setup.html'));
});

app.get('/raffle-wheel.html', requireAdminPageAuth, (req, res) => {
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
  console.log(`MAZ Event App running on http://143.244.151.95:${PORT}`);
  console.log(`Admin running on http://143.244.151.95:${PORT}/admin`);
});
