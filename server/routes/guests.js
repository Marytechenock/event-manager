const express = require('express');
const db = require('../database');
const router = express.Router();

// Register new guest
router.post('/register', (req, res) => {
    const { name, surname, email, phone, company_id, position } = req.body;

    // Start transaction
    db.serialize(() => {
        // First check if company has available chairs
        db.get(`
            SELECT *, (total_chairs - chairs_occupied) as available_chairs
            FROM companies
            WHERE id = ?
        `, [company_id], (err, company) => {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }

            if (!company) {
                return res.status(400).json({ error: 'Company not found' });
            }

            if (company.available_chairs <= 0) {
                return res.status(400).json({ error: 'No available chairs for this company' });
            }

            // Check if email already registered
            db.get('SELECT id FROM guests WHERE email = ?', [email], (err, existingGuest) => {
                if (err) {
                    return res.status(500).json({ error: 'Database error' });
                }

                if (existingGuest) {
                    return res.status(400).json({ error: 'Email already registered' });
                }

                // Register guest
                db.run(`
                    INSERT INTO guests (name, surname, email, phone, company_id, position, table_number)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                `, [name, surname, email, phone, company_id, position, company.table_number],
                function(err) {
                    if (err) {
                        return res.status(500).json({ error: 'Failed to register guest' });
                    }

                    // Update chairs occupied
                    db.run(`
                        UPDATE companies
                        SET chairs_occupied = chairs_occupied + 1
                        WHERE id = ?
                    `, [company_id], function(err) {
                        if (err) {
                            return res.status(500).json({ error: 'Failed to update company chairs' });
                        }

                        res.json({
                            message: 'Registration successful',
                            tableNumber: company.table_number,
                            guestId: this.lastID
                        });
                    });
                });
            });
        });
    });
});

// Get all guests
router.get('/', (req, res) => {
    db.all(`
        SELECT g.*, c.name as company_name
        FROM guests g
        LEFT JOIN companies c ON g.company_id = c.id
        ORDER BY g.registered_at DESC
    `, (err, guests) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(guests);
    });
});

module.exports = router;