const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');
const session = require('express-session');

const app = express();
const PORT = process.env.PORT || 3030;

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
      secure: false,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  })
);

// ✅ PAGE FLOW GUARD - Linear flow with refresh support
function enforcePageFlow(req, res, next) {
  const path = req.path;
  const session = req.session;
  const referer = req.get('Referer');

  // Allow index always
  if (path === '/' || path === '/index.html') {
    // Optional: Clear registration state when returning to home
    if (session) {
      delete session.onRegistrationPage;
      // Keep registrationCompleted if needed, or clear it:
      // delete session.registrationCompleted;
    }
    return next();
  }

  // Registration page: must come from index
  if (path === '/register.html') {
    const allowedReferers = [
      'http://localhost:3000/',
      'http://localhost:3000/index.html',
      'http://localhost:3001/',
      'http://localhost:3001/index.html',
      'http://localhost:3030/',
      'http://localhost:3030/index.html'
      // Add production domains when deployed:
      // 'https://yourevent.com/',
      // 'https://yourevent.com/index.html'
    ];

    if (!allowedReferers.some(ref => referer?.startsWith(ref))) {
      return res.redirect('/'); // Block direct access
    }

    if (session) {
      session.onRegistrationPage = true;
    }
    return next();
  }

  // Success page: must have completed registration
  if (path === '/success.html') {
    if (!session || !session.registrationCompleted) {
      return res.redirect('/'); // Block invalid access
    }
    // ✅ DO NOT delete registrationCompleted → allows refresh!
    return next();
  }

  // For all other pages (e.g., admin), optionally clean up
  if (session) {
    delete session.onRegistrationPage;
    // Do NOT auto-delete registrationCompleted here
  }

  next();
}

// Apply page flow guard
app.use(enforcePageFlow);

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

// Admin auth middleware
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
