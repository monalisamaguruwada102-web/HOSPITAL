const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const dbPath = process.env.DB_PATH || path.resolve(__dirname, 'ihms.db');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database: ' + err.message);
    } else {
        console.log('Connected to SQLite database.');
        
        // Initialize Schema if it doesn't exist
        const schemaPath = path.resolve(__dirname, 'schema.sql');
        if (fs.existsSync(schemaPath)) {
            const schema = fs.readFileSync(schemaPath, 'utf8');
            db.exec(schema, (err) => {
                if (err) {
                    console.error('Error executing schema file: ' + err.message);
                } else {
                    console.log('Database schema validated/initialized.');
                    
                    // Run Migrations (Add missing columns to existing tables)
                    db.serialize(() => {
                        // 1. Ensure 'approval_status' exists in Users
                        db.all("PRAGMA table_info(Users)", (err, columns) => {
                            if (err) return console.error("Migration error:", err.message);
                            const hasApprovalStatus = columns.some(c => c.name === 'approval_status');
                            if (!hasApprovalStatus) {
                                console.log("Migrating: Adding 'approval_status' column to Users table.");
                                db.run("ALTER TABLE Users ADD COLUMN approval_status TEXT DEFAULT 'Approved'");
                            }
                        });

                        // 2. Ensure Admin Brenda exists
                        db.run(`INSERT OR IGNORE INTO Users (name, role, username, password, branch_id, approval_status) 
                                VALUES ('Brenda Admin', 'Admin', 'Brenda@IHMS', 'brenda#$#$', 1, 'Approved')`);
                    });
                }
            });
        }
    }
});

module.exports = db;
