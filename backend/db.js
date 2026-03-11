const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const dbPath = process.env.DB_PATH || path.resolve(__dirname, 'ihms.db');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database: ' + err.message);
        process.exit(1);
    }
    console.log('Connected to SQLite database at:', dbPath);
    
    const schemaPath = path.resolve(__dirname, 'schema.sql');
    if (!fs.existsSync(schemaPath)) {
        console.error('FATAL: schema.sql not found at', schemaPath);
        process.exit(1);
    }

    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // STEP 1: Execute schema FIRST — create all tables
    db.exec(schema, (err) => {
        if (err) {
            console.error('Schema initialization error:', err.message);
        } else {
            console.log('Base schema initialized.');
        }

        // STEP 2: Execute serial migrations and seeds
        db.serialize(() => {
            // Ensure necessary columns exist for old databases
            db.run("ALTER TABLE Users ADD COLUMN approval_status TEXT DEFAULT 'Approved'", (err) => {
                if (err && !err.message.includes('duplicate column')) console.log("Migration (approval_status):", err.message);
            });

            db.run("ALTER TABLE Users ADD COLUMN created_at DATETIME DEFAULT NULL", (err) => {
                if (err && !err.message.includes('duplicate column')) console.log("Migration (created_at):", err.message);
            });

            // STEP 3: Robust Seeding - Use REPLACE to ensure latest password works
            const adminSeeds = [
                ['System Admin', 'Admin', 'admin', 'admin123', 1, 'Approved'],
                ['Brenda Admin', 'Admin', 'Brenda@IHMS', 'brenda#$#$', 1, 'Approved']
            ];

            adminSeeds.forEach(a => {
                db.run(
                    `INSERT OR REPLACE INTO Users (id, name, role, username, password, branch_id, approval_status) 
                     VALUES ((SELECT id FROM Users WHERE username = ?), ?, ?, ?, ?, ?, ?)`,
                    [a[2], a[0], a[1], a[2], a[3], a[4], a[5]],
                    (e) => {
                        if (e) console.error(`Seed error for ${a[2]}:`, e.message);
                    }
                );
            });

            // STEP 4: Clean up test users
            db.run(`DELETE FROM Users WHERE (name LIKE '%test%' OR name LIKE '%Test%' OR username LIKE '%test%') 
                    AND username NOT IN ('admin', 'Brenda@IHMS')`, (e) => {
                if (!e) console.log("Test users cleanup successful.");
            });

            db.get("SELECT COUNT(*) as count FROM Users", (e, row) => {
                console.log(`Database ready. Total users: ${row?.count || 0}`);
            });
        });
    });
});

module.exports = db;
