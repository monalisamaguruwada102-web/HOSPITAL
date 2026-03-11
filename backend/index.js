const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const path = require('path');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = 'ihms_super_secret_key_2026'; // In production, move to .env

app.use(cors());
app.use(express.json());

// ─── Auth Middleware & Security Rules ──────────────────────────────────────────
// Sync: Forced redeploy to resolve Render hoisting cache.
// ─── Middleware ───────────────────────────────────────────────────────────────
const authenticate = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Access denied. No token provided.' });
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        res.status(403).json({ error: 'Invalid token.' });
    }
};

const requireRole = (roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Access denied. Insufficient permissions.' });
        }
        next();
    };
};

// ─── Auth API ─────────────────────────────────────────────────────────────────
app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body;
    db.get('SELECT id, name, role, username, branch_id, approval_status FROM Users WHERE username = ? AND password = ?', [username, password], (err, user) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!user) return res.status(401).json({ error: 'Invalid credentials' });
        
        if (user.approval_status !== 'Approved') {
            return res.status(403).json({ error: 'Your account is pending administrator approval. Please contact your branch administrator.' });
        }

        const token = jwt.sign({ id: user.id, role: user.role, name: user.name, branch_id: user.branch_id }, JWT_SECRET, { expiresIn: '8h' });
        res.json({ token, user });
    });
});

app.post('/api/auth/register', (req, res) => {
    const { name, role, username, password, branch_id } = req.body;
    if (!name || !role || !username || !password) {
        return res.status(400).json({ error: 'All fields are required' });
    }
    
    db.run(
        `INSERT INTO Users (name, role, username, password, branch_id, approval_status) VALUES (?, ?, ?, ?, ?, 'Pending')`,
        [name, role, username, password, branch_id || 1],
        function (err) {
            if (err) {
                if (err.message.includes('UNIQUE constraint failed')) {
                    return res.status(400).json({ error: 'Username already exists' });
                }
                return res.status(500).json({ error: err.message });
            }
            res.json({ success: true, id: this.lastID, message: 'Registration submitted. Please wait for administrator approval before logging in.' });
        }
    );
});

// User Approval Management (Admin Only)
app.get('/api/admin/pending-users', authenticate, requireRole(['Admin']), (req, res) => {
    db.all("SELECT id, name, role, username, created_at, branch_id FROM Users WHERE approval_status = 'Pending'", (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.put('/api/admin/approve-user/:id', authenticate, requireRole(['Admin']), (req, res) => {
    const { status } = req.body; // 'Approved' or 'Rejected'
    if (!['Approved', 'Rejected'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
    }
    db.run("UPDATE Users SET approval_status = ? WHERE id = ?", [status, req.params.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, message: `User ${status.toLowerCase()} successfully` });
    });
});



// ─── Auth API ─────────────────────────────────────────────────────────────────
// Global Audit Logging Middleware
const auditLogger = (req, res, next) => {
    // Only log POST, PUT, DELETE
    if (['POST', 'PUT', 'DELETE'].includes(req.method) && req.user) {
        const originalSend = res.send;
        res.send = function (data) {
            res.send = originalSend;
            if (res.statusCode >= 200 && res.statusCode < 300) {
                const targetTable = req.path.split('/')[2] || 'System';
                let recordId = req.params.id || null;
                if (!recordId && data) {
                    try {
                        const parsed = JSON.parse(data);
                        recordId = parsed.id || null;
                    } catch (e) {}
                }
                const action = req.method;
                const details = JSON.stringify(req.body);
                const ip = req.ip || req.connection.remoteAddress;

                db.run(
                    `INSERT INTO AuditLogs (user_id, username, action, target_table, record_id, details, ip_address) 
                     VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    [req.user.id, req.user.name, action, targetTable, recordId, details, ip],
                    (err) => { if (err) console.error("Audit log error:", err.message); }
                );
            }
            return res.send(...arguments);
        };
    }
    next();
};

app.use('/api', (req, res, next) => {
    if (req.path === '/auth/login') return next();
    authenticate(req, res, next);
}, auditLogger);

// ─── Admin Audit API ──────────────────────────────────────────────────────────
app.get('/api/audit-logs', requireRole(['Admin']), (req, res) => {
    db.all('SELECT * FROM AuditLogs ORDER BY created_at DESC LIMIT 500', [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// ─── Patient EHR API ──────────────────────────────────────────────────────────
app.get('/api/patients/:id/ehr', (req, res) => {
    const patientId = req.params.id;
    Promise.all([
        new Promise((resolve, reject) => db.all('SELECT *, "Appointment" as type FROM Appointments WHERE patient_id = ? ORDER BY appointment_date DESC', [patientId], (e, r) => e ? reject(e) : resolve(r))),
        new Promise((resolve, reject) => db.all('SELECT *, "LabTest" as type FROM LabTests WHERE patient_id = ? ORDER BY requested_at DESC', [patientId], (e, r) => e ? reject(e) : resolve(r))),
        new Promise((resolve, reject) => db.all('SELECT v.*, u.name as nurse_name, "Vital" as type FROM Vitals v LEFT JOIN Users u ON v.nurse_id = u.id WHERE v.patient_id = ? ORDER BY v.recorded_at DESC', [patientId], (e, r) => e ? reject(e) : resolve(r))),
        new Promise((resolve, reject) => db.all('SELECT p.*, d.drug_name, "Prescription" as type FROM Prescriptions p LEFT JOIN PharmacyInventory d ON p.drug_id = d.id WHERE p.patient_id = ? ORDER BY p.prescribed_at DESC', [patientId], (e, r) => e ? reject(e) : resolve(r)))
    ]).then(([appointments, labs, vitals, prescriptions]) => {
        const timeline = [...appointments, ...labs, ...vitals, ...prescriptions].sort((a, b) => {
            const dateA = new Date(a.appointment_date || a.requested_at || a.recorded_at || a.prescribed_at);
            const dateB = new Date(b.appointment_date || b.requested_at || b.recorded_at || b.prescribed_at);
            return dateB - dateA;
        });
        res.json(timeline);
    }).catch(err => {
        res.status(500).json({ error: err.message });
    });
});

// ─── Vitals API ───────────────────────────────────────────────────────────────
app.get('/api/patients/:id/vitals', (req, res) => {
    db.all('SELECT v.*, u.name as nurse_name FROM Vitals v LEFT JOIN Users u ON v.nurse_id = u.id WHERE v.patient_id = ? ORDER BY v.recorded_at DESC', [req.params.id], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/patients/:id/vitals', requireRole(['Nurse', 'Admin', 'Doctor']), (req, res) => {
    const { blood_pressure, heart_rate, temperature, weight } = req.body;
    db.run(
        `INSERT INTO Vitals (patient_id, nurse_id, blood_pressure, heart_rate, temperature, weight) VALUES (?, ?, ?, ?, ?, ?)`,
        [req.params.id, req.user.id, blood_pressure, heart_rate, temperature, weight],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id: this.lastID, success: true });
        }
    );
});

// ─── Users/Doctors API ────────────────────────────────────────────────────────
app.get('/api/users/doctors', (req, res) => {
    db.all("SELECT id, name, username FROM Users WHERE role = 'Doctor' ORDER BY name ASC", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.get('/api/users', (req, res) => {
    db.all("SELECT id, name, role, username FROM Users ORDER BY name ASC", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// ─── Patients API ─────────────────────────────────────────────────────────────
app.get('/api/patients', (req, res) => {
    // Admins see all, others see branch specific
    const query = req.user.role === 'Admin' ? 'SELECT * FROM Patients ORDER BY id DESC' : 'SELECT * FROM Patients WHERE branch_id = ? ORDER BY id DESC';
    const params = req.user.role === 'Admin' ? [] : [req.user.branch_id];
    
    db.all(query, params, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/patients', (req, res) => {
    const { first_name, last_name, dob, gender, contact_number, address, medical_history } = req.body;
    db.run(
        `INSERT INTO Patients (first_name, last_name, dob, gender, contact_number, address, medical_history, branch_id) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [first_name, last_name, dob, gender, contact_number, address, medical_history, req.user.branch_id || 1],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id: this.lastID });
        }
    );
});

// ─── Appointments API ─────────────────────────────────────────────────────────
app.get('/api/appointments', (req, res) => {
    const { doctor_id } = req.query;
    let query = `
        SELECT a.*, p.first_name, p.last_name, u.name as doctor_name 
        FROM Appointments a 
        LEFT JOIN Patients p ON a.patient_id = p.id 
        LEFT JOIN Users u ON a.doctor_id = u.id
        WHERE 1=1 `;
    const params = [];
    
    if (req.user.role !== 'Admin') {
        query += ' AND a.branch_id = ?';
        params.push(req.user.branch_id);
    }
    
    if (doctor_id) {
        query += ' AND a.doctor_id = ?';
        params.push(doctor_id);
    }
    query += ' ORDER BY a.appointment_date ASC';
    
    db.all(query, params, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/appointments', requireRole(['Admin', 'Receptionist']), (req, res) => {
    const { patient_id, doctor_id, appointment_date, notes } = req.body;
    db.get('SELECT COUNT(*) as count FROM Appointments WHERE date(appointment_date) = date(?)', [appointment_date], (err, row) => {
        const queue_number = (row ? row.count : 0) + 1;
        db.run(
            `INSERT INTO Appointments (patient_id, doctor_id, appointment_date, queue_number, status, notes, branch_id) 
             VALUES (?, ?, ?, ?, 'Pending', ?, ?)`,
            [patient_id, doctor_id, appointment_date, queue_number, notes || '', req.user.branch_id || 1],
            function (err) {
                if (err) return res.status(500).json({ error: err.message });
                res.json({ id: this.lastID, queue_number });
            }
        );
    });
});

app.put('/api/appointments/:id/status', requireRole(['Admin', 'Receptionist', 'Doctor']), (req, res) => {
    const { status } = req.body;
    db.run('UPDATE Appointments SET status = ? WHERE id = ?', [status, req.params.id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

// Doctor approves/rejects appointment
app.put('/api/appointments/:id/approve', requireRole(['Doctor', 'Admin']), (req, res) => {
    const { status, doctor_notes } = req.body; // status: 'Approved' or 'Rejected'
    db.run(
        'UPDATE Appointments SET status = ?, doctor_notes = ? WHERE id = ?',
        [status, doctor_notes || '', req.params.id],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true });
        }
    );
});

// ─── Lab API ──────────────────────────────────────────────────────────────────
app.get('/api/lab', (req, res) => {
    const { doctor_id, status } = req.query;
    let query = `SELECT l.*, p.first_name, p.last_name, u.name as doctor_name 
                 FROM LabTests l 
                 LEFT JOIN Patients p ON l.patient_id = p.id 
                 LEFT JOIN Users u ON l.doctor_id = u.id
                 WHERE 1=1 `;
    const params = [];
    
    if (req.user.role !== 'Admin') {
        query += ' AND l.branch_id = ?';
        params.push(req.user.branch_id);
    }
    
    if (doctor_id) { query += ' AND l.doctor_id = ?'; params.push(doctor_id); }
    if (status) { query += ' AND l.status = ?'; params.push(status); }
    
    query += ' ORDER BY l.requested_at DESC';
    db.all(query, params, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Doctor orders a new lab test for a patient
app.post('/api/lab', requireRole(['Doctor', 'Admin']), (req, res) => {
    const { patient_id, doctor_id, test_name, priority, notes } = req.body;
    if (!patient_id || !doctor_id || !test_name) {
        return res.status(400).json({ error: 'patient_id, doctor_id, and test_name are required.' });
    }
    db.run(
        `INSERT INTO LabTests (patient_id, doctor_id, test_name, priority, notes, status, branch_id) 
         VALUES (?, ?, ?, ?, ?, 'Pending', ?)`,
        [patient_id, doctor_id, test_name, priority || 'Routine', notes || '', req.user.branch_id || 1],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id: this.lastID, success: true });
        }
    );
});

// Lab technician / doctor enters test results
app.put('/api/lab/:id/result', requireRole(['Lab Technician', 'Doctor', 'Admin']), (req, res) => {
    const { results } = req.body;
    db.run(
        "UPDATE LabTests SET results = ?, status = 'Completed' WHERE id = ?",
        [results, req.params.id],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true });
        }
    );
});

// Update lab test status
app.put('/api/lab/:id/status', requireRole(['Lab Technician', 'Doctor', 'Admin']), (req, res) => {
    const { status } = req.body;
    db.run('UPDATE LabTests SET status = ? WHERE id = ?', [status, req.params.id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

// ─── Prescriptions API ────────────────────────────────────────────────────────
app.get('/api/prescriptions', (req, res) => {
    const { status, patient_id } = req.query;
    let query = `
        SELECT p.*, pat.first_name, pat.last_name, doc.name as doctor_name, drug.drug_name 
        FROM Prescriptions p
        LEFT JOIN Patients pat ON p.patient_id = pat.id
        LEFT JOIN Users doc ON p.doctor_id = doc.id
        LEFT JOIN PharmacyInventory drug ON p.drug_id = drug.id
        WHERE 1=1
    `;
    const params = [];
    if (status) { query += ' AND p.status = ?'; params.push(status); }
    if (patient_id) { query += ' AND p.patient_id = ?'; params.push(patient_id); }
    query += ' ORDER BY p.prescribed_at DESC';
    
    db.all(query, params, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/prescriptions', requireRole(['Doctor', 'Admin']), (req, res) => {
    const { patient_id, appointment_id, drug_id, dosage } = req.body;
    db.run(
        `INSERT INTO Prescriptions (patient_id, doctor_id, appointment_id, drug_id, dosage) VALUES (?, ?, ?, ?, ?)`,
        [patient_id, req.user.id, appointment_id, drug_id, dosage],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id: this.lastID, success: true });
        }
    );
});

app.put('/api/prescriptions/:id/dispense', requireRole(['Pharmacist', 'Admin']), (req, res) => {
    // Advanced Dispensing Logic: FIFO Batch Deduction
    db.serialize(() => {
        db.get('SELECT drug_id, status FROM Prescriptions WHERE id = ?', [req.params.id], (err, rx) => {
            if (err) return res.status(500).json({ error: err.message });
            if (!rx || rx.status === 'Dispensed') return res.status(400).json({ error: 'Invalid or already dispensed prescription.' });
            
            // Assume dosage is 1 for this simple example (a real system would parse the dosage string or have a quantity field)
            const qtyToDispense = 1; 
            
            db.all('SELECT id, quantity, batch_number FROM DrugBatches WHERE drug_id = ? AND quantity > 0 ORDER BY expiry_date ASC', [rx.drug_id], (err, batches) => {
                if (err) return res.status(500).json({ error: err.message });
                
                const totalAvailable = batches.reduce((sum, b) => sum + b.quantity, 0);
                if (totalAvailable < qtyToDispense) {
                    return res.status(400).json({ error: 'Insufficient stock across all batches.' });
                }

                let remaining = qtyToDispense;
                const updates = [];

                for (let batch of batches) {
                    if (remaining <= 0) break;
                    if (batch.quantity >= remaining) {
                        updates.push({ id: batch.id, newQty: batch.quantity - remaining });
                        remaining = 0;
                    } else {
                        updates.push({ id: batch.id, newQty: 0 });
                        remaining -= batch.quantity;
                    }
                }

                db.run('BEGIN TRANSACTION', (err) => {
                    if (err) return res.status(500).json({ error: "Failed to start transaction" });
                    
                    let completed = 0;
                    let hasError = false;

                    const finalize = () => {
                        if (hasError) {
                            db.run('ROLLBACK');
                            return res.status(500).json({ error: 'Failed to process batches.' });
                        }
                        db.run("UPDATE Prescriptions SET status = 'Dispensed' WHERE id = ?", [req.params.id], function(err) {
                            if (err) {
                                db.run('ROLLBACK');
                                return res.status(500).json({ error: err.message });
                            }
                            db.run('COMMIT');
                            res.json({ success: true, message: 'Dispensed successfully using FIFO batching.' });
                        });
                    };

                    updates.forEach(u => {
                        db.run('UPDATE DrugBatches SET quantity = ? WHERE id = ?', [u.newQty, u.id], (err) => {
                            if (err) hasError = true;
                            completed++;
                            if (completed === updates.length) finalize();
                        });
                    });
                    
                    if (updates.length === 0) finalize(); // Failsafe
                });
            });
        });
    });
});

// ─── Pharmacy & Supply Chain API ──────────────────────────────────────────────
app.get('/api/pharmacy', (req, res) => {
    // Phase 2: Pharmacy Inventory now aggregates DrugBatches to determine total quantity
    const query = req.user.role === 'Admin' 
        ? `SELECT p.*, (SELECT SUM(quantity) FROM DrugBatches b WHERE b.drug_id = p.id) as total_quantity 
           FROM PharmacyInventory p ORDER BY p.drug_name ASC`
        : `SELECT p.*, (SELECT SUM(quantity) FROM DrugBatches b WHERE b.drug_id = p.id) as total_quantity 
           FROM PharmacyInventory p WHERE p.branch_id = ? ORDER BY p.drug_name ASC`;
    const params = req.user.role === 'Admin' ? [] : [req.user.branch_id];

    db.all(query, params, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/pharmacy', (req, res) => {
    // Only Admin or Pharmacist can define new drugs
    const { drug_name, low_stock_threshold } = req.body;
    db.run(
        `INSERT INTO PharmacyInventory (drug_name, low_stock_threshold, branch_id) VALUES (?, ?, ?)`,
        [drug_name, low_stock_threshold || 10, req.user.branch_id || 1],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id: this.lastID });
        }
    );
});

// Add a specific batch to a drug
app.post('/api/pharmacy/:id/batches', requireRole(['Pharmacist', 'Admin']), (req, res) => {
    const { batch_number, quantity, expiry_date } = req.body;
    db.run(
        `INSERT INTO DrugBatches (drug_id, batch_number, quantity, expiry_date) VALUES (?, ?, ?, ?)`,
        [req.params.id, batch_number, quantity, expiry_date],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id: this.lastID, success: true });
        }
    );
});

app.get('/api/pharmacy/:id/batches', (req, res) => {
    db.all('SELECT * FROM DrugBatches WHERE drug_id = ? AND quantity > 0 ORDER BY expiry_date ASC', [req.params.id], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// ─── Billing API ──────────────────────────────────────────────────────────────
app.get('/api/billing', (req, res) => {
    db.all(`SELECT b.*, p.first_name, p.last_name FROM Billing b LEFT JOIN Patients p ON b.patient_id = p.id ORDER BY b.created_at DESC`, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/billing', requireRole(['Receptionist', 'Admin']), (req, res) => {
    const { patient_id, description, amount, status } = req.body;
    db.run(
        `INSERT INTO Billing (patient_id, description, amount, status) VALUES (?, ?, ?, ?)`,
        [patient_id, description, amount, status || 'Pending'],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id: this.lastID, success: true });
        }
    );
});

app.put('/api/billing/:id/status', requireRole(['Receptionist', 'Admin']), (req, res) => {
    const { status } = req.body;
    db.run('UPDATE Billing SET status = ? WHERE id = ?', [status, req.params.id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

// ─── Serve Frontend in Production ─────────────────────────────────────────────
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '../frontend/dist')));
    
    // Middleware to serve index.html for any non-API routes (SPA support)
    app.use((req, res, next) => {
        if (!req.path.startsWith('/api')) {
            res.sendFile(path.resolve(__dirname, '../frontend/dist', 'index.html'));
        } else {
            next();
        }
    });
}

// ─── App Entry Point ──────────────────────────────────────────────────────────
app.listen(PORT, () => {
    console.log(`IHMS Server is running on port ${PORT}`);
});
