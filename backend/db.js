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
                db.serialize(() => {
                    if (!err && columns && columns.length > 0) {
                        const hasApprovalStatus = columns.some(c => c.name === 'approval_status');
                        const hasCreatedAt = columns.some(c => c.name === 'created_at');

                        if (!hasApprovalStatus) {
                            console.log("Migrating: Adding 'approval_status' to Users.");
                            db.run("ALTER TABLE Users ADD COLUMN approval_status TEXT DEFAULT 'Approved'");
                        }
                        if (!hasCreatedAt) {
                            console.log("Migrating: Adding 'created_at' to Users.");
                            db.run("ALTER TABLE Users ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP");
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
                            db.run(`INSERT OR IGNORE INTO Users (name, role, username, password, branch_id, approval_status) 
                                    VALUES ('Brenda Admin', 'Admin', 'Brenda@IHMS', 'brenda#$#$', 1, 'Approved')`);
                        }
                    });
                });
            });
        }
    }
});

module.exports = db;
