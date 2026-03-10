const db = require('./db');
const fs = require('fs');

const runMigrations = () => {
    // 1. Re-run schema to add new tables (Branches, DrugBatches, AuditLogs)
    const schemaSql = fs.readFileSync('./schema.sql', 'utf8');
    db.exec(schemaSql, (err) => {
        if (err) {
            console.error('Schema initialization error:', err.message);
        } else {
            console.log('Database schema Phase 2 tables initialized.');
            
            // 2. Add branch_id columns manually for existing SQLite DBs via ALTER
            const alters = [
                "ALTER TABLE Users ADD COLUMN branch_id INTEGER DEFAULT 1",
                "ALTER TABLE Patients ADD COLUMN branch_id INTEGER DEFAULT 1",
                "ALTER TABLE Appointments ADD COLUMN branch_id INTEGER DEFAULT 1",
                "ALTER TABLE LabTests ADD COLUMN branch_id INTEGER DEFAULT 1",
                "ALTER TABLE PharmacyInventory ADD COLUMN branch_id INTEGER DEFAULT 1"
            ];

            alters.forEach(sql => {
                db.run(sql, (err) => {
                    if (err && !err.message.includes('duplicate column')) {
                        console.error(`Alter error for ${sql}:`, err.message);
                    } else if (!err) {
                        console.log(`Successfully added branch_id via: ${sql}`);
                    }
                });
            });

            // 3. Migrate existing pharmacy inventory quantities into legacy drug batches so expiry flow works natively
            setTimeout(() => {
                db.all('SELECT id, quantity FROM PharmacyInventory WHERE quantity > 0', [], (err, rows) => {
                    if (!err && rows) {
                        rows.forEach(drug => {
                            db.run(
                                `INSERT INTO DrugBatches (drug_id, batch_number, quantity, expiry_date) 
                                 SELECT ?, 'LEGACY-BATCH', ?, date('now', '+1 year') 
                                 WHERE NOT EXISTS (SELECT 1 FROM DrugBatches WHERE drug_id = ?)`,
                                [drug.id, drug.quantity, drug.id],
                                (batchErr) => {
                                    if (batchErr) console.error(batchErr);
                                }
                            );
                        });
                        console.log('Migrated legacy pharmacy stock to DrugBatches.');
                    }
                });
            }, 1000);
        }
    });
};

runMigrations();

setTimeout(() => {
    console.log('Done.');
    process.exit(0);
}, 2000);
