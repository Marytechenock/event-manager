const express = require('express');
const db = require('../database');
const router = express.Router();

// 🔐 Admin authentication middleware
function requireAdminAuth(req, res, next) {
    if (req.session && req.session.adminLoggedIn) {
        return next();
    }
    res.status(401).json({ error: 'Unauthorized: Admin login required' });
}

// 🎯 GET /api/raffle/participants
// Returns all registered guests with valid lucky numbers
router.get('/participants', requireAdminAuth, async (req, res) => {
    try {
        const result = await db.query(`
            SELECT 
                g.lucky_number,
                g.name,
                g.surname,
                g.email,
                g.table_number,
                c.name AS company_name
            FROM guests g
            LEFT JOIN companies c ON g.company_id = c.id
            WHERE g.lucky_number IS NOT NULL
            ORDER BY g.registered_at DESC
        `);
        
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching raffle participants:', error);
        res.status(500).json({ error: 'Failed to load participants' });
    }
});

// 🎁 POST /api/raffle/draw (optional, but useful for future)
// You can skip this if you're doing the draw entirely in the frontend
router.post('/draw', requireAdminAuth, async (req, res) => {
    try {
        const result = await db.query(`
            SELECT 
                g.lucky_number,
                g.name,
                g.surname,
                g.email,
                g.table_number,
                c.name AS company_name
            FROM guests g
            LEFT JOIN companies c ON g.company_id = c.id
            WHERE g.lucky_number IS NOT NULL
        `);

        if (result.rows.length === 0) {
            return res.status(400).json({ error: 'No eligible participants' });
        }

        // Pick random winner
        const winner = result.rows[Math.floor(Math.random() * result.rows.length)];
        res.json({ winner });
    } catch (error) {
        console.error('Error drawing winner:', error);
        res.status(500).json({ error: 'Failed to draw winner' });
    }
});

module.exports = router;