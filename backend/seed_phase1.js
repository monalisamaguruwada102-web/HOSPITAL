const db = require('./db');
const fs = require('fs');

const seedUsers = () => {
    const users = [
        { name: 'Nurse Joy', role: 'Nurse', username: 'nurse.joy', password: 'nurse123' },
        { name: 'Pharm. Dan', role: 'Pharmacist', username: 'pharm.dan', password: 'pharm123' },
        { name: 'Tech. Sarah', role: 'Lab Technician', username: 'tech.sarah', password: 'tech123' }
    ];

    users.forEach(u => {
        db.run(
            "INSERT INTO Users (name, role, username, password) SELECT ?, ?, ?, ? WHERE NOT EXISTS (SELECT 1 FROM Users WHERE username = ?)",
            [u.name, u.role, u.username, u.password, u.username],
            function(err) {
                if(err) console.error(err);
                else console.log(`Seeded ${u.username}`);
            }
        );
    });
};

const runMigrations = () => {
    // We already added them to schema.sql, we can just re-run schema.sql to pick up new tables
    const schemaSql = fs.readFileSync('./schema.sql', 'utf8');
    db.exec(schemaSql, (err) => {
        if (err) {
            console.error('Migration error:', err.message);
        } else {
            console.log('Database schema migration applied successfully.');
        }
    });
};

runMigrations();
setTimeout(() => {
    seedUsers();
}, 500);

setTimeout(() => {
    console.log('Done.');
    process.exit(0);
}, 1500);
