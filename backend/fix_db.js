const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.resolve(__dirname, 'database.sqlite');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database', err.message);
        process.exit(1);
    }
});

const alters = [
    "ALTER TABLE Users ADD COLUMN branch_id INTEGER DEFAULT 1",
    "ALTER TABLE Patients ADD COLUMN branch_id INTEGER DEFAULT 1",
    "ALTER TABLE Appointments ADD COLUMN branch_id INTEGER DEFAULT 1",
    "ALTER TABLE LabTests ADD COLUMN branch_id INTEGER DEFAULT 1",
    "ALTER TABLE PharmacyInventory ADD COLUMN branch_id INTEGER DEFAULT 1"
];

const newTables = `
CREATE TABLE IF NOT EXISTS Branches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    location TEXT NOT NULL,
    contact TEXT
);

CREATE TABLE IF NOT EXISTS DrugBatches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    drug_id INTEGER,
    batch_number TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    expiry_date DATE NOT NULL,
    received_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(drug_id) REFERENCES PharmacyInventory(id)
);

CREATE TABLE IF NOT EXISTS AuditLogs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    username TEXT,
    action TEXT NOT NULL,
    target_table TEXT,
    record_id INTEGER,
    details TEXT,
    ip_address TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

INSERT OR IGNORE INTO Branches (id, name, location, contact) VALUES (1, 'Main Hospital', 'Downtown Center', '555-0100');
INSERT OR IGNORE INTO Branches (id, name, location, contact) VALUES (2, 'North Clinic', 'Uptown North', '555-0102');
`;

// Alter existing tables ignoring "duplicate column" errors
alters.forEach(sql => {
    db.run(sql, (err) => {
        if (err && !err.message.includes('duplicate column')) {
            console.error(`Alter error for ${sql}:`, err.message);
        } else {
             console.log(`Success: ${sql}`);
        }
    });
});

// Run new tables
db.exec(newTables, (err) => {
    if (err) console.error(err);
    else {
        console.log("New tables added successfully.");
        // Migrate inventory
        db.all('SELECT id, quantity FROM PharmacyInventory WHERE quantity > 0', [], (err, rows) => {
            if (!err && rows) {
                rows.forEach(drug => {
                    db.run(
                        `INSERT INTO DrugBatches (drug_id, batch_number, quantity, expiry_date) 
                         SELECT ?, 'LEGACY', ?, date('now', '+1 year') 
                         WHERE NOT EXISTS (SELECT 1 FROM DrugBatches WHERE drug_id = ?)`,
                        [drug.id, drug.quantity, drug.id]
                    );
                });
                console.log('Migrated legacy pharmacy stock to DrugBatches.');
            }
        });
    }
});

setTimeout(() => process.exit(), 1000);
