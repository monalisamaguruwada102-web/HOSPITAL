import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

function Patients() {
    const { user } = useAuth();
    const [patients, setPatients] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        first_name: '', last_name: '', dob: '', gender: 'Male', contact_number: '', address: '', medical_history: ''
    });

    // EHR & Vitals State
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [ehrTimeline, setEhrTimeline] = useState([]);
    const [showVitalsForm, setShowVitalsForm] = useState(false);
    const [vitalsData, setVitalsData] = useState({
        blood_pressure: '', heart_rate: '', temperature: '', weight: ''
    });

    const getAuthHeaders = () => {
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('ihms_token')}`
        };
    };

    const fetchPatients = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/patients', { headers: getAuthHeaders() });
            const data = await res.json();
            if (Array.isArray(data)) setPatients(data);
        } catch (err) {
            console.error('Failed to fetch patients:', err);
        }
    };

    useEffect(() => {
        fetchPatients();
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleVitalsChange = (e) => {
        setVitalsData({ ...vitalsData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const res = await fetch('http://localhost:5000/api/patients', {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(formData)
            });
            if (res.ok) {
                setShowForm(false);
                setFormData({ first_name: '', last_name: '', dob: '', gender: 'Male', contact_number: '', address: '', medical_history: '' });
                fetchPatients();
            }
        } catch (err) {
            console.error('Failed to create patient:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const viewHistory = async (patient) => {
        setSelectedPatient(patient);
        setShowVitalsForm(false);
        try {
            const res = await fetch(`http://localhost:5000/api/patients/${patient.id}/ehr`, { headers: getAuthHeaders() });
            const data = await res.json();
            if (Array.isArray(data)) setEhrTimeline(data);
        } catch (err) {
            console.error('Failed to fetch EHR', err);
        }
    };

    const submitVitals = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const res = await fetch(`http://localhost:5000/api/patients/${selectedPatient.id}/vitals`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(vitalsData)
            });
            if (res.ok) {
                setShowVitalsForm(false);
                setVitalsData({ blood_pressure: '', heart_rate: '', temperature: '', weight: '' });
                viewHistory(selectedPatient); // Refresh timeline
            }
        } catch (err) {
            console.error('Failed to save vitals', err);
        } finally {
            setIsLoading(false);
        }
    };

    if (selectedPatient) {
        return (
            <div>
                <button className="btn btn-secondary" style={{ marginBottom: '20px' }} onClick={() => setSelectedPatient(null)}>
                    ⬅ Back to Patient List
                </button>

                <div className="glass-panel" style={{ padding: '24px', marginBottom: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <h2 style={{ margin: 0 }}>{selectedPatient.first_name} {selectedPatient.last_name}</h2>
                            <p style={{ color: 'var(--text-secondary)', margin: '8px 0' }}>
                                #{selectedPatient.id} • {selectedPatient.gender} • DOB: {selectedPatient.dob}
                            </p>
                            <p style={{ fontSize: '14px' }}><strong>Contact:</strong> {selectedPatient.contact_number}</p>
                            <p style={{ fontSize: '14px', marginTop: '8px' }}><strong>Medical History:</strong> {selectedPatient.medical_history || 'None recorded'}</p>
                        </div>
                        {['Nurse', 'Doctor', 'Admin'].includes(user?.role) && (
                            <button className="btn btn-primary" onClick={() => setShowVitalsForm(!showVitalsForm)}>
                                🩺 Record Vitals (Triage)
                            </button>
                        )}
                    </div>
                </div>

                {showVitalsForm && (
                    <div className="glass-panel animate-fade-in" style={{ padding: '24px', marginBottom: '24px', background: 'rgba(59, 130, 246, 0.05)', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                        <h4 style={{ marginBottom: '16px', color: 'var(--accent-primary)' }}>Nurse Triage - Record Vitals</h4>
                        <form onSubmit={submitVitals} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '16px' }}>
                            <div className="form-group">
                                <label>Blood Pressure (mmHg)</label>
                                <input type="text" name="blood_pressure" className="form-control" placeholder="120/80" value={vitalsData.blood_pressure} onChange={handleVitalsChange} required />
                            </div>
                            <div className="form-group">
                                <label>Heart Rate (bpm)</label>
                                <input type="number" name="heart_rate" className="form-control" placeholder="75" value={vitalsData.heart_rate} onChange={handleVitalsChange} required />
                            </div>
                            <div className="form-group">
                                <label>Temperature (°C)</label>
                                <input type="number" step="0.1" name="temperature" className="form-control" placeholder="36.5" value={vitalsData.temperature} onChange={handleVitalsChange} required />
                            </div>
                            <div className="form-group">
                                <label>Weight (kg)</label>
                                <input type="number" step="0.1" name="weight" className="form-control" placeholder="70" value={vitalsData.weight} onChange={handleVitalsChange} required />
                            </div>
                            <div style={{ gridColumn: 'span 4', textAlign: 'right' }}>
                                <button type="submit" className="btn btn-primary" disabled={isLoading}>{isLoading ? 'Saving...' : 'Save Vitals'}</button>
                            </div>
                        </form>
                    </div>
                )}

                <h3 style={{ marginBottom: '16px', fontSize: '18px' }}>Electronic Health Record (EHR) Timeline</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {ehrTimeline.map((item, index) => (
                        <div key={index} className="glass-panel" style={{ padding: '20px', borderLeft: `4px solid ${
                            item.type === 'Appointment' ? 'var(--accent-primary)' :
                            item.type === 'LabTest' ? 'var(--accent-warning)' :
                            item.type === 'Prescription' ? 'var(--accent-success)' :
                            '#8b5cf6' // Vitals
                        }`}}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                                <strong style={{ fontSize: '16px' }}>{item.type}</strong>
                                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                    {new Date(item.appointment_date || item.requested_at || item.recorded_at || item.prescribed_at).toLocaleString()}
                                </span>
                            </div>
                            
                            {item.type === 'Vitals' && (
                                <div style={{ fontSize: '14px' }}>
                                    <p>Recorded by: {item.nurse_name}</p>
                                    <div style={{ display: 'flex', gap: '16px', marginTop: '8px' }}>
                                        <span><strong>BP:</strong> {item.blood_pressure}</span>
                                        <span><strong>HR:</strong> {item.heart_rate} bpm</span>
                                        <span><strong>Temp:</strong> {item.temperature}°C</span>
                                        <span><strong>Weight:</strong> {item.weight} kg</span>
                                    </div>
                                </div>
                            )}

                            {item.type === 'Appointment' && (
                                <div style={{ fontSize: '14px' }}>
                                    <p><strong>Status:</strong> <span className={`badge ${item.status === 'Completed' ? 'badge-success' : 'badge-info'}`}>{item.status}</span></p>
                                    {item.notes && <p><strong>Reason:</strong> {item.notes}</p>}
                                    {item.doctor_notes && <p><strong>Doctor's Notes:</strong> {item.doctor_notes}</p>}
                                </div>
                            )}

                            {item.type === 'LabTest' && (
                                <div style={{ fontSize: '14px' }}>
                                    <p><strong>Test:</strong> {item.test_name}</p>
                                    <p><strong>Priority:</strong> {item.priority}</p>
                                    <p><strong>Status:</strong> {item.status}</p>
                                    {item.results && <p><strong>Results:</strong> {item.results}</p>}
                                </div>
                            )}

                            {item.type === 'Prescription' && (
                                <div style={{ fontSize: '14px' }}>
                                    <p><strong>Drug:</strong> {item.drug_name}</p>
                                    <p><strong>Dosage:</strong> {item.dosage}</p>
                                    <p><strong>Status:</strong> <span className={`badge ${item.status === 'Dispensed' ? 'badge-success' : 'badge-warning'}`}>{item.status}</span></p>
                                </div>
                            )}
                        </div>
                    ))}
                    {ehrTimeline.length === 0 && (
                        <p style={{ color: 'var(--text-muted)' }}>No medical history recorded for this patient.</p>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
                <div style={{ width: '300px' }}>
                    <input type="text" className="form-control" placeholder="Search patients by name or ID..." />
                </div>
                {['Receptionist', 'Admin'].includes(user?.role) && (
                    <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
                        <i>➕</i> {showForm ? 'Cancel Registration' : 'Register New Patient'}
                    </button>
                )}
            </div>

            {showForm && (
                <div className="glass-panel animate-fade-in" style={{ padding: '24px', marginBottom: '24px' }}>
                    <h3 style={{ marginBottom: '20px' }}>New Patient Registration</h3>
                    <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        <div className="form-group">
                            <label>First Name</label>
                            <input type="text" name="first_name" className="form-control" value={formData.first_name} onChange={handleChange} required />
                        </div>
                        <div className="form-group">
                            <label>Last Name</label>
                            <input type="text" name="last_name" className="form-control" value={formData.last_name} onChange={handleChange} required />
                        </div>
                        <div className="form-group">
                            <label>Date of Birth</label>
                            <input type="date" name="dob" className="form-control" value={formData.dob} onChange={handleChange} required />
                        </div>
                        <div className="form-group">
                            <label>Gender</label>
                            <select name="gender" className="form-control" value={formData.gender} onChange={handleChange}>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Contact Number</label>
                            <input type="text" name="contact_number" className="form-control" value={formData.contact_number} onChange={handleChange} required />
                        </div>
                        <div className="form-group">
                            <label>Address</label>
                            <input type="text" name="address" className="form-control" value={formData.address} onChange={handleChange} />
                        </div>
                        <div className="form-group" style={{ gridColumn: 'span 2' }}>
                            <label>Medical History Details</label>
                            <textarea name="medical_history" className="form-control" rows="3" value={formData.medical_history} onChange={handleChange}></textarea>
                        </div>
                        <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                            <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                            <button type="submit" className="btn btn-primary" disabled={isLoading}>{isLoading ? 'Saving...' : 'Save Patient Record'}</button>
                        </div>
                    </form>
                </div>
            )}

            <div className="glass-panel">
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Name</th>
                                <th>Gender</th>
                                <th>Contact</th>
                                <th>Registered Date</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {Array.isArray(patients) && patients.map(p => (
                                <tr key={p.id}>
                                    <td>#{p.id}</td>
                                    <td style={{ fontWeight: '500', color: '#fff' }}>{p.first_name} {p.last_name}</td>
                                    <td>{p.gender}</td>
                                    <td>{p.contact_number}</td>
                                    <td>{p.created_at}</td>
                                    <td>
                                        <button className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '12px' }} onClick={() => viewHistory(p)}>View EHR Timeline</button>
                                    </td>
                                </tr>
                            ))}
                            {patients.length === 0 && (
                                <tr>
                                    <td colSpan="6" style={{ textAlign: 'center', padding: '40px' }}>No patients found in system</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

export default Patients;
