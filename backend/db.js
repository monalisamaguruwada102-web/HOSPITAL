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
            console.error('Schema error:', err.message);
            // Don't exit — tables might partially exist
        }
        console.log('Schema executed.');

        // STEP 2: Run migrations for older databases that already exist
        db.serialize(() => {
            db.run("ALTER TABLE Users ADD COLUMN approval_status TEXT DEFAULT 'Approved'", (err) => {
                if (err) {
                    if (!err.message.includes('duplicate column')) {
                        console.log("Migration (approval_status):", err.message);
                    }
                } else {
                    console.log("Added approval_status column.");
                }
            });

            db.run("ALTER TABLE Users ADD COLUMN created_at DATETIME DEFAULT NULL", (err) => {
                if (err) {
                    if (!err.message.includes('duplicate column')) {
                        console.log("Migration (created_at):", err.message);
                    }
                } else {
                    console.log("Added created_at column.");
                }
            });

            // STEP 3: Ensure admin exists
            db.run(`INSERT OR IGNORE INTO Users (name, role, username, password, branch_id, approval_status) 
                    VALUES ('Brenda Admin', 'Admin', 'Brenda@IHMS', 'brenda#$#$', 1, 'Approved')`, (e) => {
                if (e) console.error("Brenda seed:", e.message);
                else console.log("Admin user verified.");
            });

            // STEP 4: Clean up test users
            db.run(`DELETE FROM Users WHERE name LIKE '%test%' OR name LIKE '%Test%' OR username LIKE '%test%'`, (e) => {
                if (!e) console.log("Test users cleaned.");
            });

            console.log('Database initialization complete.');
        });
    });
});

module.exports = db;
