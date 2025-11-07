// const sqlite3 = require('sqlite3').verbose();
// const path = require('path');
// const bcrypt = require('bcryptjs');

// // Use in-memory database for testing
// const db = new sqlite3.Database(':memory:');

// // Initialize database
// db.serialize(() => {
//     // Admins table
//     db.run(`CREATE TABLE admins (
//         id INTEGER PRIMARY KEY AUTOINCREMENT,
//         username TEXT UNIQUE NOT NULL,
//         password_hash TEXT NOT NULL,
//         created_at DATETIME DEFAULT CURRENT_TIMESTAMP
//     )`);

//     // Companies table
//     db.run(`CREATE TABLE companies (
//         id INTEGER PRIMARY KEY AUTOINCREMENT,
//         name TEXT UNIQUE NOT NULL,
//         table_number TEXT NOT NULL,
//         total_chairs INTEGER NOT NULL,
//         chairs_occupied INTEGER DEFAULT 0,
//         created_at DATETIME DEFAULT CURRENT_TIMESTAMP
//     )`);

//     // Guests table
//     db.run(`CREATE TABLE guests (
//         id INTEGER PRIMARY KEY AUTOINCREMENT,
//         name TEXT NOT NULL,
//         surname TEXT NOT NULL,
//         email TEXT UNIQUE NOT NULL,
//         phone TEXT NOT NULL,
//         company_id INTEGER,
//         position TEXT NOT NULL,
//         table_number TEXT,
//         registered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
//         FOREIGN KEY (company_id) REFERENCES companies (id)
//     )`);

//     // Create default admin
//     const defaultPassword = bcrypt.hashSync('admin123', 10);
//     db.run(`INSERT INTO admins (username, password_hash) VALUES (?, ?)`,
//         ['admin', defaultPassword], function(err) {
//         if (err) {
//             console.log('Error creating default admin:', err);
//         } else {
//             console.log('Default admin created successfully');
//         }
//     });

//     // Add sample companies for testing
//     db.run(`INSERT INTO companies (name, table_number, total_chairs) VALUES
//         ('ABC Corporation', 'T1', 10),
//         ('XYZ Ltd', 'T2', 8),
//         ('Innovate Africa', 'T3', 12)
//     `);
// });

// module.exports = db;


const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, 'event.db');
const db = new sqlite3.Database(dbPath);

// Initialize database
db.serialize(() => {
    // Admins table
    db.run(`CREATE TABLE IF NOT EXISTS admins (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Companies table
    db.run(`CREATE TABLE IF NOT EXISTS companies (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        table_number TEXT UNIQUE NOT NULL,
        total_chairs INTEGER NOT NULL,
        chairs_occupied INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Guests table
    db.run(`CREATE TABLE IF NOT EXISTS guests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        surname TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        phone TEXT NOT NULL,
        company_id INTEGER,
        position TEXT NOT NULL,
        table_number TEXT,
        registered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (company_id) REFERENCES companies (id)
    )`);

    // Create default admin (username: admin, password: admin123)
    const defaultPassword = bcrypt.hashSync('admin123', 10);
    db.run(`INSERT OR IGNORE INTO admins (username, password_hash) VALUES (?, ?)`,
        ['admin', defaultPassword], function(err) {
        if (err) {
            console.log('Error creating default admin:', err);
        } else {
            console.log('Default admin created successfully');
        }
    });
});

module.exports = db;
