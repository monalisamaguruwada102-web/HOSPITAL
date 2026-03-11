const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const dbPath = process.env.DB_PATH || path.resolve(__dirname, 'ihms.db');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database: ' + err.message);
    } else {
        console.log('Connected to SQLite database.');
        
        // Initialize Schema - Run Migrations FIRST
        const schemaPath = path.resolve(__dirname, 'schema.sql');
        if (fs.existsSync(schemaPath)) {
            const schema = fs.readFileSync(schemaPath, 'utf8');
            
            db.serialize(() => {
                // Aggressive Migrations: Just try to add columns and ignore "duplicate column" errors
                // NOTE: SQLite requires constant defaults in ALTER TABLE, so use NULL not CURRENT_TIMESTAMP
                db.run("ALTER TABLE Users ADD COLUMN approval_status TEXT DEFAULT 'Approved'", (err) => {
                    if (err && !err.message.includes('duplicate column name')) {
                        console.log("Migration Note (approval_status):", err.message);
                    }
                });

                db.run("ALTER TABLE Users ADD COLUMN created_at DATETIME DEFAULT NULL", (err) => {
                    if (err && !err.message.includes('duplicate column name')) {
                        console.log("Migration Note (created_at):", err.message);
                    }
                });

                // Now execute the full schema (Creates tables if missing, runs seeds)
                db.exec(schema, (err) => {
                    if (err) {
                        console.error('Error executing schema file: ' + err.message);
                    } else {
                        console.log('Database schema validated/initialized.');
                        // Ensure Brenda exists - DO NOT reference created_at (may not exist on old DBs)
                        db.run(`INSERT OR IGNORE INTO Users (name, role, username, password, branch_id, approval_status) 
                                VALUES ('Brenda Admin', 'Admin', 'Brenda@IHMS', 'brenda#$#$', 1, 'Approved')`, (e) => {
                            if (e) console.error("Brenda seed error:", e.message);
                            else console.log("Admin user verified.");
                        });
                    }
                });
            });
        }
    }
});

module.exports = db;
