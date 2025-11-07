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

    // Validate input
    if (!name?.trim() || !table_number?.trim() || !total_chairs) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    const cleanName = name.trim();
    const cleanTable = table_number.trim();

    db.run(
        'INSERT INTO companies (name, table_number, total_chairs) VALUES (?, ?, ?)',
        [cleanName, cleanTable, parseInt(total_chairs)],
        function(err) {
            if (err) {
                // Handle duplicate company name (case-insensitive)
                if (err.message.includes('companies_name_unique') || 
                    err.message.includes('UNIQUE constraint failed') && 
                    (err.message.includes('name') || err.message.includes('LOWER(name)'))) {
                    return res.status(409).json({ error: 'Company name already exists' });
                }
                // Handle duplicate table number (case-insensitive)
                if (err.message.includes('companies_table_number_unique') || 
                    err.message.includes('UNIQUE constraint failed') && 
                    (err.message.includes('table_number') || err.message.includes('UPPER(table_number)'))) {
                    return res.status(409).json({ error: 'Table number already exists' });
                }
                return res.status(500).json({ error: 'Failed to add company' });
            }
            res.status(201).json({ message: 'Company added successfully', id: this.lastID });
        }
    );
});

// Update company
router.put('/:id', (req, res) => {
    const { name, table_number, total_chairs } = req.body;
    const companyId = req.params.id;

    // Validate input
    if (!name?.trim() || !table_number?.trim() || !total_chairs) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    const cleanName = name.trim();
    const cleanTable = table_number.trim();

    db.run(
        'UPDATE companies SET name = ?, table_number = ?, total_chairs = ? WHERE id = ?',
        [cleanName, cleanTable, parseInt(total_chairs), companyId],
        function(err) {
            if (err) {
                // Handle duplicate company name
                if (err.message.includes('companies_name_unique') || 
                    err.message.includes('UNIQUE constraint failed') && 
                    (err.message.includes('name') || err.message.includes('LOWER(name)'))) {
                    return res.status(409).json({ error: 'Company name already exists' });
                }
                // Handle duplicate table number
                if (err.message.includes('companies_table_number_unique') || 
                    err.message.includes('UNIQUE constraint failed') && 
                    (err.message.includes('table_number') || err.message.includes('UPPER(table_number)'))) {
                    return res.status(409).json({ error: 'Table number already exists' });
                }
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