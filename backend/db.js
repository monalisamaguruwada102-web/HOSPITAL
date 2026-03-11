const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const dbPath = process.env.DB_PATH || path.resolve(__dirname, 'ihms.db');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database: ' + err.message);
    } else {
        console.log('Connected to SQLite database at:', dbPath);
        
        const schemaPath = path.resolve(__dirname, 'schema.sql');
        if (fs.existsSync(schemaPath)) {
            const schema = fs.readFileSync(schemaPath, 'utf8');
            
            db.serialize(() => {
                // Step 1: Try to add missing columns (ignore errors for existing columns or missing table)
                db.run("ALTER TABLE Users ADD COLUMN approval_status TEXT DEFAULT 'Approved'", (err) => {
                    if (err && !err.message.includes('duplicate column')) {
                        console.log("Migration Note (approval_status):", err.message);
                    } else if (!err) {
                        console.log("Migration: Added approval_status column.");
                    }
                });

                db.run("ALTER TABLE Users ADD COLUMN created_at DATETIME DEFAULT NULL", (err) => {
                    if (err && !err.message.includes('duplicate column')) {
                        console.log("Migration Note (created_at):", err.message);
                    } else if (!err) {
                        console.log("Migration: Added created_at column.");
                    }
                });

                // Step 2: Execute full schema (creates tables if they don't exist, seeds data)
                db.exec(schema, (err) => {
                    if (err) {
                        console.error('Schema execution error:', err.message);
                        // Even if schema fails, try to continue - tables may already exist
                    } else {
                        console.log('Database schema validated/initialized.');
                    }

                    // Step 3: Ensure admin exists (safe - no created_at reference)
                    db.run(`INSERT OR IGNORE INTO Users (name, role, username, password, branch_id, approval_status) 
                            VALUES ('Brenda Admin', 'Admin', 'Brenda@IHMS', 'brenda#$#$', 1, 'Approved')`, (e) => {
                        if (e) console.error("Brenda seed:", e.message);
                        else console.log("Admin user verified.");
                    });

                    // Step 4: Clean up test staff
                    db.run(`DELETE FROM Users WHERE username LIKE '%test%' OR username LIKE '%Test%'`, (e) => {
                        if (e) console.log("Cleanup note:", e.message);
                        else console.log("Test users cleaned up.");
                    });
                });
            });
        }
    }
});

module.exports = db;
