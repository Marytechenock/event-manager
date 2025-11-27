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

// 🎁 POST /api/raffle/draw-and-save
router.post('/draw-and-save', requireAdminAuth, async (req, res) => {
    const { sponsorCompany } = req.body;

    if (!sponsorCompany) {
        return res.status(400).json({ error: 'Sponsor company is required' });
    }

    const client = await db.getClient();
    try {
        await client.query('BEGIN');

        // Get eligible participants (not already winners)
        const participantsResult = await client.query(`
            SELECT 
                g.id,
                g.lucky_number,
                g.name,
                g.surname,
                g.table_number,
                c.name AS company_name
            FROM guests g
            LEFT JOIN companies c ON g.company_id = c.id
            WHERE g.lucky_number IS NOT NULL
            AND g.id NOT IN (SELECT guest_id FROM raffle_winners)
        `);

        if (participantsResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: 'No eligible participants' });
        }

        // Pick random winner
        const winner = participantsResult.rows[
            Math.floor(Math.random() * participantsResult.rows.length)
        ];

        // Save winner to database
        const saveResult = await client.query(
            `INSERT INTO raffle_winners 
             (guest_id, lucky_number, name, surname, company_name, table_number, sponsor_company)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING *`,
            [
                winner.id,
                winner.lucky_number,
                winner.name,
                winner.surname,
                winner.company_name,
                winner.table_number,
                sponsorCompany
            ]
        );

        await client.query('COMMIT');
        res.json({ winner: saveResult.rows[0] });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Draw and save error:', error);
        res.status(500).json({ error: 'Failed to draw winner' });
    } finally {
        client.release();
    }
});

// 📊 GET /api/raffle/winners
router.get('/winners', requireAdminAuth, async (req, res) => {
    try {
        const result = await db.query(`
            SELECT * FROM raffle_winners
            ORDER BY drawn_at DESC
        `);
        res.json(result.rows);
    } catch (error) {
        console.error('Fetch winners error:', error);
        res.status(500).json({ error: 'Failed to fetch winners' });
    }
});

module.exports = router;