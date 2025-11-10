const express = require('express');
const db = require('../database');
const router = express.Router();

// Register new guest
router.post('/register', async (req, res) => {
    const { name, surname, email, phone, company_id, position } = req.body;
    const client = await db.getClient();

    try {
        await client.query('BEGIN');

        // First check if company has available chairs
        const companyQuery = `
            SELECT *, (total_chairs - chairs_occupied) as available_chairs, table_number
            FROM companies
            WHERE id = $1
            FOR UPDATE
        `;
        const companyResult = await client.query(companyQuery, [company_id]);
        
        if (companyResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: 'Company not found' });
        }

        const company = companyResult.rows[0];

        if (company.available_chairs <= 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: 'No available chairs for this company' });
        }

        // Check if email already registered
        const existingGuest = await client.query(
            'SELECT id FROM guests WHERE email = $1', 
            [email]
        );

        if (existingGuest.rows.length > 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: 'Email already registered' });
        }

        // Register guest
        const guestResult = await client.query(
            `INSERT INTO guests (name, surname, email, phone, company_id, position, table_number)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING id`,
            [name, surname, email, phone, company_id, position, company.table_number]
        );

        // Update chairs occupied
        await client.query(
            `UPDATE companies
             SET chairs_occupied = chairs_occupied + 1
             WHERE id = $1`,
            [company_id]
        );

        await client.query('COMMIT');
        
        res.json({
            message: 'Registration successful',
            tableNumber: company.table_number,
            guestId: guestResult.rows[0].id
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error in guest registration:', error);
        res.status(500).json({ error: 'An error occurred during registration' });
    } finally {
        client.release();
    }
});

// Get all guests
router.get('/', async (req, res) => {
    try {
        const result = await db.query(`
            SELECT g.*, c.name as company_name
            FROM guests g
            LEFT JOIN companies c ON g.company_id = c.id
            ORDER BY g.registered_at DESC
        `);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching guests:', error);
        res.status(500).json({ error: 'Failed to fetch guests' });
    }
});

module.exports = router;
