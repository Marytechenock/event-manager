const express = require('express');
const db = require('../database');
const router = express.Router();
const { sendRegistrationEmail } = require('../services/emailService');
const cache = require('../utils/cache');

// Get total chairs across all companies
async function getTotalChairs(client) {
  const result = await client.query(
    'SELECT COALESCE(SUM(total_chairs), 0) as total FROM companies'
  );
  return parseInt(result.rows[0].total) || 0;
}

// Get all used lucky numbers
// async function getUsedLuckyNumbers(client) {
//   const result = await client.query(
//     'SELECT lucky_number FROM guests WHERE lucky_number IS NOT NULL'
//   );
//   return new Set(result.rows.map(row => row.lucky_number));
// }

async function getUsedLuckyNumbers(client) {
    const cacheKey = 'usedLuckyNumbers';
    let usedNumbers = cache.get(cacheKey);

    if (!usedNumbers) {
        const result = await client.query(
            'SELECT lucky_number FROM guests WHERE lucky_number IS NOT NULL'
        );
        usedNumbers = new Set(result.rows.map(row => row.lucky_number));
        cache.set(cacheKey, usedNumbers, 30 * 1000); // Cache for 30 seconds
    }

    return usedNumbers;
}

// Generate unique lucky number (1 to total_chairs)
async function generateLuckyNumber(client) {
  const totalChairs = await getTotalChairs(client);
  if (totalChairs === 0) {
    return null;
  }

  const usedNumbers = await getUsedLuckyNumbers(client);
  const availableNumbers = [];

  for (let i = 1; i <= totalChairs; i++) {
    if (!usedNumbers.has(i)) {
      availableNumbers.push(i);
    }
  }

  if (availableNumbers.length === 0) {
    return null;
  }

  const randomIndex = Math.floor(Math.random() * availableNumbers.length);
  return availableNumbers[randomIndex];
}

async function getCompany(client, companyId) {
    const cacheKey = `company:${companyId}`;
    let company = cache.get(cacheKey);

    if (!company) {
        // const result = await client.query(
        //     'SELECT *, (total_chairs - chairs_occupied) as available_chairs, table_number FROM companies WHERE id = $1 FOR UPDATE',
        //     [companyId]
        // );

        const result = await client.query(
            'SELECT * FROM companies WHERE id = $1 FOR UPDATE',
            [companyId]
        );

        if (result.rows.length > 0) {
            company = result.rows[0];
            cache.set(cacheKey, company);
        }
    }

    return company;
}

// Register new guest
router.post('/register', async (req, res) => {
    const { name, surname, email, phone, company_id, position } = req.body;
    const client = await db.getClient();

    try {
        await client.query('BEGIN');

        // // First check if company has available chairs
        // const companyQuery = `
        //     SELECT *, (total_chairs - chairs_occupied) as available_chairs, table_number
        //     FROM companies
        //     WHERE id = $1
        //     FOR UPDATE
        // `;
        // const companyResult = await client.query(companyQuery, [company_id]);

        // if (companyResult.rows.length === 0) {
        //     await client.query('ROLLBACK');
        //     return res.status(400).json({ error: 'Company not found' });
        // }

        // const company = companyResult.rows[0];

        // if (company.available_chairs <= 0) {
        //     await client.query('ROLLBACK');
        //     return res.status(400).json({ error: 'No available chairs for this company' });
        // }

        const company = await getCompany(client, company_id);
        if (!company) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: 'Company not found' });
        }

        if (company.chairs_occupied >= company.total_chairs) {
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

        // Generate lucky number BEFORE registering guest
        const luckyNumber = await generateLuckyNumber(client);
        if (luckyNumber === null) {
            await client.query('ROLLBACK');
            return res.status(400).json({
              error: 'Registration closed: no more lucky numbers available'
            });
        }

        // Register guest WITH lucky number
        const guestResult = await client.query(
            `INSERT INTO guests (name, surname, email, phone, company_id, position, table_number, lucky_number)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             RETURNING id, lucky_number`,
            [name, surname, email, phone, company_id, position, company.table_number, luckyNumber]
        );

        // Update chairs occupied
        await client.query(
            `UPDATE companies
             SET chairs_occupied = chairs_occupied + 1
             WHERE id = $1`,
            [company_id]
        );

        await client.query('COMMIT');

        // ✅ SET SESSION FLAG FOR SUCCESS PAGE ACCESS
        req.session.registrationCompleted = true;

        // Prepare guest data for email (include lucky number)
        const guestData = {
            name,
            surname,
            email,
            phone,
            company_name: company.name,
            position,
            table_number: company.table_number,
            lucky_number: guestResult.rows[0].lucky_number
        };

        console.log('Guest data:', guestData);

        // Send confirmation email
        try {
            await sendRegistrationEmail(guestData);
        } catch (emailError) {
            console.error('Failed to send email:', emailError);
            // Don't fail the request if email fails
        }

        res.json({
            success: true,
            message: 'Registration successful',
            tableNumber: company.table_number,
            luckyNumber: guestResult.rows[0].lucky_number,
            guestId: guestResult.rows[0].id
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error in guest registration:', error);

        if (error.code === '23505' && error.constraint?.includes('lucky_number')) {
            return res.status(500).json({
              error: 'Lucky number conflict. Please try again.'
            });
        }

        res.status(500).json({ error: 'An error occurred during registration' });
    } finally {
        client.release();
    }
    cache.delete('usedLuckyNumbers'); // Invalidate used numbers cache
    cache.delete(`company:${company_id}`); // Invalidate company cache
    cache.delete('companies:all'); // Invalidate all companies list
    cache.delete('guests:all'); // Invalidate guests list
});

// Get all guests
// router.get('/', async (req, res) => {
//     try {
//         const result = await db.query(`
//             SELECT g.*, c.name as company_name
//             FROM guests g
//             LEFT JOIN companies c ON g.company_id = c.id
//             ORDER BY g.registered_at DESC
//         `);
//         res.json(result.rows);
//     } catch (error) {
//         console.error('Error fetching guests:', error);
//         res.status(500).json({ error: 'Failed to fetch guests' });
//     }
// });

// In server/routes/guests.js, update the GET / endpoint
router.get('/', async (req, res) => {
    try {
        const cacheKey = 'guests:all';
        let guests = cache.get(cacheKey);

        if (!guests) {
            const result = await db.query(`
                SELECT g.*, c.name as company_name
                FROM guests g
                LEFT JOIN companies c ON g.company_id = c.id
                ORDER BY g.registered_at DESC
            `);
            guests = result.rows;
            cache.set(cacheKey, guests, 30 * 1000); // Cache for 30 seconds
        }

        res.json(guests);
    } catch (error) {
        console.error('Error fetching guests:', error);
        res.status(500).json({ error: 'Failed to fetch guests' });
    }
});

module.exports = router;
