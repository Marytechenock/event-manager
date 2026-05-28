const express = require('express');
const db = require('../database');
const router = express.Router();
const { sendRegistrationEmail } = require('../services/emailService');
const guestOrganisationSelect = `
    COALESCE(NULLIF(TRIM(g.organisation_name), ''), c.name) AS company_name
`;

function requireAdminAuth(req, res, next) {
    if (req.session && req.session.adminLoggedIn) {
        return next();
    }
    res.status(401).json({ error: 'Unauthorized: Admin login required' });
}

// Get total chairs across all companies
async function getTotalChairs(client) {
  const result = await client.query(
    'SELECT COALESCE(SUM(total_chairs), 0) as total FROM companies'
  );
  return parseInt(result.rows[0].total) || 0;
}

// Get all used lucky numbers
async function getUsedLuckyNumbers(client) {
  const result = await client.query(
    'SELECT lucky_number FROM guests WHERE lucky_number IS NOT NULL'
  );
  return new Set(result.rows.map(row => row.lucky_number));
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

// Register new guest
router.post('/register', async (req, res) => {
    const { name, surname, email, phone, company_id, organisation_name, position } = req.body;
    const client = await db.getClient();

    try {
        await client.query('BEGIN');

        const cleanName = name?.trim();
        const cleanSurname = surname?.trim();
        const cleanEmail = email?.trim();
        const cleanPhone = phone?.trim();
        const cleanOrganisationName = organisation_name?.trim();
        const cleanPosition = position?.trim();

        if (!cleanName || !cleanSurname || !cleanEmail || !cleanPhone || !cleanPosition) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: 'All required fields must be provided' });
        }

        let assignedCompany = null;
        let tableNumber = null;
        let resolvedOrganisationName = cleanOrganisationName;

        if (company_id) {
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

            assignedCompany = companyResult.rows[0];

            if (assignedCompany.available_chairs <= 0) {
                await client.query('ROLLBACK');
                return res.status(400).json({ error: 'No available chairs for this company' });
            }

            tableNumber = assignedCompany.table_number;
            if (!resolvedOrganisationName) {
                resolvedOrganisationName = assignedCompany.name;
            }
        }

        if (!resolvedOrganisationName) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: 'Organisation name is required' });
        }

        // Check if email already registered
        const existingGuest = await client.query(
            'SELECT id FROM guests WHERE email = $1',
            [cleanEmail]
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
            `INSERT INTO guests (name, surname, email, phone, company_id, organisation_name, position, table_number, lucky_number)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
             RETURNING id, lucky_number`,
            [
                cleanName,
                cleanSurname,
                cleanEmail,
                cleanPhone,
                assignedCompany?.id || null,
                resolvedOrganisationName,
                cleanPosition,
                tableNumber,
                luckyNumber
            ]
        );

        if (assignedCompany) {
            await client.query(
                `UPDATE companies
                 SET chairs_occupied = chairs_occupied + 1
                 WHERE id = $1`,
                [assignedCompany.id]
            );
        }

        await client.query('COMMIT');

        // Prepare guest data for email (include lucky number)
        const guestData = {
            name: cleanName,
            surname: cleanSurname,
            email: cleanEmail,
            phone: cleanPhone,
            company_name: resolvedOrganisationName,
            position: cleanPosition,
            table_number: tableNumber,
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
            tableNumber,
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
});

// Get all guests
router.get('/', requireAdminAuth, async (req, res) => {
    try {
        const result = await db.query(`
            SELECT g.*, ${guestOrganisationSelect}
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
