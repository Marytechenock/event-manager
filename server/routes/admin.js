const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../database');
const router = express.Router();

// Admin login
router.post('/login', (req, res) => {
    const { username, password } = req.body;

    db.get('SELECT * FROM admins WHERE username = ?', [username], (err, admin) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }

        if (!admin || !bcrypt.compareSync(password, admin.password_hash)) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        res.json({ message: 'Login successful', user: { id: admin.id, username: admin.username } });
    });
});

// Get dashboard metrics
router.get('/metrics', (req, res) => {
    const metrics = {};

    // Total attendees
    db.get('SELECT COUNT(*) as total FROM guests', (err, result) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        metrics.totalAttendees = result.total;

        // Companies with available chairs
        db.all(`
            SELECT c.*,
                   (c.total_chairs - c.chairs_occupied) as available_chairs
            FROM companies c
        `, (err, companies) => {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }
            metrics.companies = companies;

            // All guests
            db.all(`
                SELECT g.*, c.name as company_name
                FROM guests g
                LEFT JOIN companies c ON g.company_id = c.id
                ORDER BY g.registered_at DESC
            `, (err, guests) => {
                if (err) {
                    return res.status(500).json({ error: 'Database error' });
                }
                metrics.guests = guests;
                res.json(metrics);
            });
        });
    });
});

module.exports = router;