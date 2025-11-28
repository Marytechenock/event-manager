const express = require('express');
const db = require('../database');
const router = express.Router();
const cache = require('../utils/cache');

// // Get all companies
// router.get('/', async (req, res) => {
//     try {
//         const result = await db.query('SELECT * FROM companies ORDER BY name');
//         res.json(result.rows);
//     } catch (error) {
//         console.error('Error fetching companies:', error);
//         res.status(500).json({ error: 'Failed to fetch companies' });
//     }
// });

// Get all companies (cached)
router.get('/', async (req, res) => {
    try {
        const cacheKey = 'companies:all';
        let companies = cache.get(cacheKey);

        if (!companies) {
            console.log('Cache miss - fetching companies from database');
            const result = await db.query('SELECT * FROM companies ORDER BY name');
            companies = result.rows;
            cache.set(cacheKey, companies);
        } else {
            console.log('Cache hit - serving companies from cache');
        }

        res.json(companies);
    } catch (error) {
        console.error('Error fetching companies:', error);
        res.status(500).json({ error: 'Failed to fetch companies' });
    }
});

// Add new company
router.post('/', async (req, res) => {
    const { name, table_number, total_chairs } = req.body;

    // Validate input
    if (!name?.trim() || !table_number?.trim() || !total_chairs) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    const cleanName = name.trim();
    const cleanTable = table_number.trim();
    const chairs = parseInt(total_chairs);

    try {
        const result = await db.query(
            'INSERT INTO companies (name, table_number, total_chairs) VALUES ($1, $2, $3) RETURNING id',
            [cleanName, cleanTable, chairs]
        );

        res.status(201).json({
            message: 'Company added successfully',
            id: result.rows[0].id
        });
    } catch (error) {
        console.error('Error adding company:', error);

        // Handle unique constraint violations
        if (error.code === '23505') {
            const detail = error.detail || '';
            if (detail.includes('name')) {
                return res.status(409).json({ error: 'Company name already exists' });
            }
            if (detail.includes('table_number')) {
                return res.status(409).json({ error: 'Table number already exists' });
            }
        }

        res.status(500).json({ error: 'Failed to add company' });
    }
    cache.delete('companies:all'); // Invalidate cache
});

// Update company
router.put('/:id', async (req, res) => {
    const { name, table_number, total_chairs } = req.body;
    const companyId = req.params.id;

    // Validate input
    if (!name?.trim() || !table_number?.trim() || !total_chairs) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    const cleanName = name.trim();
    const cleanTable = table_number.trim();
    const chairs = parseInt(total_chairs);

    try {
        const result = await db.query(
            'UPDATE companies SET name = $1, table_number = $2, total_chairs = $3 WHERE id = $4',
            [cleanName, cleanTable, chairs, companyId]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Company not found' });
        }

        res.json({ message: 'Company updated successfully' });
    } catch (error) {
        console.error('Error updating company:', error);

        // Handle unique constraint violations
        // if (error.code === '23505') {
        //     const detail = error.detail || '';
        //     if (detail.includes('name')) {
        //         return res.status(409).json({ error: 'Company name already exists' });
        //     }
        //     if (detail.includes('table_number')) {
        //         return res.status(409).json({ error: 'Table number already exists' });
        //     }
        // }

        res.status(500).json({ error: 'Failed to update company' });
    }
    cache.delete('companies:all'); // Invalidate cache
});

// Delete company
router.delete('/:id', async (req, res) => {
    const companyId = req.params.id;
    const client = await db.getClient();

    try {
        await client.query('BEGIN');

        // Check if company has guests
        const guestCount = await client.query(
            'SELECT COUNT(*) as count FROM guests WHERE company_id = $1',
            [companyId]
        );

        if (parseInt(guestCount.rows[0].count) > 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: 'Cannot delete company with registered guests' });
        }

        const result = await client.query(
            'DELETE FROM companies WHERE id = $1',
            [companyId]
        );

        if (result.rowCount === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Company not found' });
        }

        await client.query('COMMIT');
        res.json({ message: 'Company deleted successfully' });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error deleting company:', error);
        res.status(500).json({ error: 'Failed to delete company' });
    } finally {
        client.release();
    }
    cache.delete('companies:all'); // Invalidate cache
});

// Get single company (cached)
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const cacheKey = `company:${id}`;

        let company = cache.get(cacheKey);

        if (!company) {
            const result = await db.query('SELECT * FROM companies WHERE id = $1', [id]);
            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Company not found' });
            }
            company = result.rows[0];
            cache.set(cacheKey, company);
        }

        res.json(company);
    } catch (error) {
        console.error('Error fetching company:', error);
        res.status(500).json({ error: 'Failed to fetch company' });
    }
    cache.delete(cacheKey); // Invalidate cache
});

module.exports = router;
