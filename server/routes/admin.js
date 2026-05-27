const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../database');
const router = express.Router();
const guestOrganisationSelect = `
    COALESCE(NULLIF(TRIM(g.organisation_name), ''), c.name) AS company_name
`;

// 🔐 Admin authentication middleware
function requireAdminAuth(req, res, next) {
    if (req.session && req.session.adminLoggedIn) {
        return next();
    }
    res.status(401).json({ error: 'Unauthorized: Admin login required' });
}

// 🚪 Admin login
router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        // Fetch admin by username
        const result = await db.query('SELECT * FROM admins WHERE username = $1', [username]);
        
        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const admin = result.rows[0];
        const isPasswordValid = await bcrypt.compare(password, admin.password_hash);
        
        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // ✅ CREATE SESSION
        req.session.adminLoggedIn = true;
        req.session.adminId = admin.id;

        res.json({ 
            message: 'Login successful', 
            user: { 
                id: admin.id, 
                username: admin.username 
            } 
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'An error occurred during login' });
    }
});

// 🚪 Admin logout
router.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ error: 'Could not log out' });
        }
        res.json({ message: 'Logged out successfully' });
    });
});

// 📊 Protected: Get dashboard metrics
router.get('/metrics', requireAdminAuth, async (req, res) => {
    try {
        const metrics = {};
        
        // Total attendees
        const attendeesResult = await db.query('SELECT COUNT(*) as total FROM guests');
        metrics.totalAttendees = parseInt(attendeesResult.rows[0].total);

        // Companies with chair info
        const companiesResult = await db.query(`
            SELECT c.*,
                   (c.total_chairs - c.chairs_occupied) as available_chairs
            FROM companies c
        `);
        metrics.companies = companiesResult.rows;

        // All guests with company names — sorted by registration time
        const guestsResult = await db.query(`
            SELECT g.*, ${guestOrganisationSelect}
            FROM guests g
            LEFT JOIN companies c ON g.company_id = c.id
            ORDER BY g.registered_at DESC  -- ✅ SAFE: registered_at EXISTS
        `);
        metrics.guests = guestsResult.rows;
        
        res.json(metrics);
    } catch (error) {
        console.error('Error fetching metrics:', error);
        res.status(500).json({ error: 'Failed to fetch dashboard metrics' });
    }
});

module.exports = router;
