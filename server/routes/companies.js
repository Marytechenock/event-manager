const express = require('express');
const db = require('../database');
const router = express.Router();

// Get all companies
router.get('/', (req, res) => {
    db.all('SELECT * FROM companies ORDER BY name', (err, companies) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(companies);
    });
});

// Add new company
router.post('/', (req, res) => {
    const { name, table_number, total_chairs } = req.body;

    db.run(
        'INSERT INTO companies (name, table_number, total_chairs) VALUES (?, ?, ?)',
        [name, table_number, parseInt(total_chairs)],
        function(err) {
            if (err) {
                return res.status(500).json({ error: 'Failed to add company' });
            }
            res.json({ message: 'Company added successfully', id: this.lastID });
        }
    );
});

// Update company
router.put('/:id', (req, res) => {
    const { name, table_number, total_chairs } = req.body;
    const companyId = req.params.id;

    db.run(
        'UPDATE companies SET name = ?, table_number = ?, total_chairs = ? WHERE id = ?',
        [name, table_number, parseInt(total_chairs), companyId],
        function(err) {
            if (err) {
                return res.status(500).json({ error: 'Failed to update company' });
            }
            res.json({ message: 'Company updated successfully' });
        }
    );
});

// Delete company
router.delete('/:id', (req, res) => {
    const companyId = req.params.id;

    // Check if company has guests
    db.get('SELECT COUNT(*) as guest_count FROM guests WHERE company_id = ?', [companyId], (err, result) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }

        if (result.guest_count > 0) {
            return res.status(400).json({ error: 'Cannot delete company with registered guests' });
        }

        db.run('DELETE FROM companies WHERE id = ?', [companyId], function(err) {
            if (err) {
                return res.status(500).json({ error: 'Failed to delete company' });
            }
            res.json({ message: 'Company deleted successfully' });
        });
    });
});

module.exports = router;