const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const dbPath = process.env.DB_PATH || path.resolve(__dirname, 'ihms.db');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database: ' + err.message);
    } else {
        console.log('Connected to SQLite database.');
        
        // Initialize Schema - Run Migrations FIRST if table exists
        const schemaPath = path.resolve(__dirname, 'schema.sql');
        if (fs.existsSync(schemaPath)) {
            const schema = fs.readFileSync(schemaPath, 'utf8');
            
            // Check for missing columns in Users FIRST
            db.all("PRAGMA table_info(Users)", (err, columns) => {
                if (err) return console.error("Could not check table info:", err.message);

                db.serialize(() => {
                    if (columns && columns.length > 0) {
                        const colNames = columns.map(c => c.name.toLowerCase());
                        const hasApprovalStatus = colNames.includes('approval_status');
                        const hasCreatedAt = colNames.includes('created_at');

                        if (!hasApprovalStatus) {
                            console.log("Migrating: Adding 'approval_status' to Users.");
                            db.run("ALTER TABLE Users ADD COLUMN approval_status TEXT DEFAULT 'Approved'", (e) => {
                                if (e) console.error("Failed to add approval_status:", e.message);
                            });
                        }
                        if (!hasCreatedAt) {
                            console.log("Migrating: Adding 'created_at' to Users.");
                            db.run("ALTER TABLE Users ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP", (e) => {
                                if (e) console.error("Failed to add created_at:", e.message);
                            });
                        }
                    }

                    // Now execute the full schema (Creates tables if missing, runs seeds)
                    // This is safely queued after any ALTER statements above
                    db.exec(schema, (err) => {
                        if (err) {
                            console.error('Error executing schema file: ' + err.message);
                        } else {
                            console.log('Database schema validated/initialized.');
                            // Final safety check for Brenda
                            db.run(`INSERT OR IGNORE INTO Users (name, role, username, password, branch_id, approval_status, created_at) 
                                    VALUES ('Brenda Admin', 'Admin', 'Brenda@IHMS', 'brenda#$#$', 1, 'Approved', CURRENT_TIMESTAMP)`, (e) => {
                                if (e) console.error("Failed to seed Brenda Admin:", e.message);
                            });
                        }
                    });
                });
            });
        }
    }
});

module.exports = db;
