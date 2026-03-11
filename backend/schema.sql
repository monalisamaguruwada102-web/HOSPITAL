CREATE TABLE IF NOT EXISTS Users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    branch_id INTEGER DEFAULT 1,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    approval_status TEXT DEFAULT 'Pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS Patients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    branch_id INTEGER DEFAULT 1,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    dob DATE,
    gender TEXT,
    contact_number TEXT,
    address TEXT,
    medical_history TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS Appointments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    branch_id INTEGER DEFAULT 1,
    patient_id INTEGER,
    doctor_id INTEGER,
    appointment_date DATETIME,
    status TEXT DEFAULT 'Scheduled',
    queue_number INTEGER,
    notes TEXT,
    doctor_notes TEXT,
    FOREIGN KEY(patient_id) REFERENCES Patients(id),
    FOREIGN KEY(doctor_id) REFERENCES Users(id)
);

CREATE TABLE IF NOT EXISTS LabTests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    branch_id INTEGER DEFAULT 1,
    patient_id INTEGER,
    doctor_id INTEGER,
    test_name TEXT,
    priority TEXT DEFAULT 'Routine',
    notes TEXT,
    results TEXT,
    status TEXT DEFAULT 'Pending',
    requested_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(patient_id) REFERENCES Patients(id),
    FOREIGN KEY(doctor_id) REFERENCES Users(id)
);

CREATE TABLE IF NOT EXISTS PharmacyInventory (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    branch_id INTEGER DEFAULT 1,
    drug_name TEXT NOT NULL,
    quantity INTEGER DEFAULT 0,
    low_stock_threshold INTEGER DEFAULT 10
);

CREATE TABLE IF NOT EXISTS IssuedMedication (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id INTEGER,
    drug_id INTEGER,
    quantity INTEGER,
    issued_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    status TEXT DEFAULT 'Pending',
    FOREIGN KEY(patient_id) REFERENCES Patients(id),
    FOREIGN KEY(drug_id) REFERENCES PharmacyInventory(id)
);

CREATE TABLE IF NOT EXISTS Billing (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id INTEGER,
    amount REAL,
    status TEXT DEFAULT 'Unpaid',
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(patient_id) REFERENCES Patients(id)
);

CREATE TABLE IF NOT EXISTS Vitals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id INTEGER,
    nurse_id INTEGER,
    blood_pressure TEXT,
    heart_rate INTEGER,
    temperature REAL,
    weight REAL,
    recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(patient_id) REFERENCES Patients(id),
    FOREIGN KEY(nurse_id) REFERENCES Users(id)
);

CREATE TABLE IF NOT EXISTS Prescriptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id INTEGER,
    doctor_id INTEGER,
    appointment_id INTEGER,
    drug_id INTEGER,
    dosage TEXT NOT NULL,
    status TEXT DEFAULT 'Pending Dispense',
    prescribed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(patient_id) REFERENCES Patients(id),
    FOREIGN KEY(doctor_id) REFERENCES Users(id),
    FOREIGN KEY(appointment_id) REFERENCES Appointments(id),
    FOREIGN KEY(drug_id) REFERENCES PharmacyInventory(id)
);

-- Phase 2 New Tables
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

-- Seed Initial Admin User (password: admin123)
-- In a real scenario, use hashed passwords.
INSERT OR IGNORE INTO Branches (id, name, location, contact) VALUES (1, 'Main Hospital', 'Downtown Center', '555-0100');
INSERT OR IGNORE INTO Branches (id, name, location, contact) VALUES (2, 'North Clinic', 'Uptown North', '555-0102');
INSERT OR IGNORE INTO Users (name, role, username, password, branch_id, approval_status) VALUES ('System Admin', 'Admin', 'admin', 'admin123', 1, 'Approved');
INSERT OR IGNORE INTO Users (name, role, username, password, branch_id, approval_status) VALUES ('Brenda Admin', 'Admin', 'Brenda@IHMS', 'brenda#$#$', 1, 'Approved');
