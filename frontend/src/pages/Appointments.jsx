import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

function Appointments() {
    const { user } = useAuth();
    const [appointments, setAppointments] = useState([]);
    const [patients, setPatients] = useState([]);
    const [doctors, setDoctors] = useState([]);
    const [inventory, setInventory] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    // Form data for creating appointments
    const [formData, setFormData] = useState({
        patient_id: '',
        doctor_id: '',
        appointment_date: '',
        notes: ''
    });

    // Prescribing State
    const [prescribingFor, setPrescribingFor] = useState(null);
    const [prescriptionData, setPrescriptionData] = useState({ drug_id: '', dosage: '' });

    const getAuthHeaders = () => {
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        };
    };

    const fetchData = async () => {
        try {
            const url = user?.role === 'Doctor' 
                ? `/api/appointments?doctor_id=${user.id}`
                : '/api/appointments';

            const [appRes, patRes, docRes, invRes] = await Promise.all([
                fetch(url, { headers: getAuthHeaders() }),
                fetch('/api/patients', { headers: getAuthHeaders() }),
                fetch('/api/users/doctors', { headers: getAuthHeaders() }),
                fetch('/api/pharmacy', { headers: getAuthHeaders() })
            ]);
            
            const appData = await appRes.json();
            const patData = await patRes.json();
            const docData = await docRes.json();
            const invData = await invRes.json();
            
            if (Array.isArray(appData)) setAppointments(appData);
            if (Array.isArray(patData)) setPatients(patData);
            if (Array.isArray(docData)) setDoctors(docData);
            if (Array.isArray(invData)) setInventory(invData);
            
            if (Array.isArray(docData) && docData.length > 0 && !formData.doctor_id) {
                setFormData(prev => ({ ...prev, doctor_id: docData[0].id }));
            }
        } catch (err) {
            console.error('Failed to fetch data', err);
        }
    };

    useEffect(() => {
        fetchData();
        // eslint-disable-next-line
    }, [user]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const res = await fetch('/api/appointments', {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(formData)
            });
            if (res.ok) {
                setFormData({ patient_id: '', doctor_id: doctors[0]?.id || '', appointment_date: '', notes: '' });
                fetchData();
            }
        } catch (err) {
            console.error('Failed to schedule appointment', err);
        } finally {
            setIsLoading(false);
        }
    };

    const updateStatus = async (id, status) => {
        try {
            const res = await fetch(`/api/appointments/${id}/status`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify({ status })
            });
            if (res.ok) {
                fetchData();
            }
        } catch (err) {
            console.error('Failed to update status', err);
        }
    };

    const approveAppointment = async (id, status) => {
        const notes = prompt(`Enter optional notes to attach to this appointment:`);
        try {
            const res = await fetch(`/api/appointments/${id}/approve`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify({ status, doctor_notes: notes || '' })
            });
            if (res.ok) {
                fetchData();
            }
        } catch (err) {
            console.error('Failed to approve appointment', err);
        }
    };

    const submitPrescription = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const payload = {
                patient_id: prescribingFor.patient_id,
                appointment_id: prescribingFor.id,
                drug_id: prescriptionData.drug_id,
                dosage: prescriptionData.dosage
            };
            const res = await fetch('/api/prescriptions', {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                alert('Prescription sent to Pharmacy.');
                setPrescribingFor(null);
                setPrescriptionData({ drug_id: '', dosage: '' });
            }
        } catch (err) {
            console.error('Failed to prescribe', err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '500' }}>
                    {user?.role === 'Doctor' ? 'My Appointments Queue' : 'Outpatient Queue Management'}
                </h3>
                {['Receptionist', 'Admin'].includes(user?.role) && (
                    <button className="btn btn-primary" onClick={() => document.getElementById('appointment_form').scrollIntoView()}>
                        <i>➕</i> Schedule Appointment
                    </button>
                )}
            </div>

            {prescribingFor && (
                <div className="glass-panel animate-fade-in" style={{ padding: '24px', marginBottom: '24px', background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <h4 style={{ marginBottom: '16px', color: 'var(--accent-success)' }}>
                            Prescribe Medication for {prescribingFor.first_name} {prescribingFor.last_name}
                        </h4>
                        <button className="btn btn-secondary" onClick={() => setPrescribingFor(null)}>Cancel</button>
                    </div>
                    <form onSubmit={submitPrescription} style={{ display: 'flex', gap: '16px', alignItems: 'flex-end' }}>
                        <div className="form-group" style={{ marginBottom: 0, flex: 2 }}>
                            <label>Drug</label>
                            <select className="form-control" required value={prescriptionData.drug_id} onChange={e => setPrescriptionData({ ...prescriptionData, drug_id: e.target.value })}>
                                <option value="">Select Drug from Inventory...</option>
                                {inventory.map(drug => (
                                    <option key={drug.id} value={drug.id} disabled={drug.quantity <= 0}>
                                        {drug.drug_name} {drug.quantity <= 0 ? '(Out of Stock)' : `(${drug.quantity} in stock)`}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group" style={{ marginBottom: 0, flex: 2 }}>
                            <label>Dosage Instructions</label>
                            <input type="text" className="form-control" required value={prescriptionData.dosage} onChange={e => setPrescriptionData({ ...prescriptionData, dosage: e.target.value })} placeholder="e.g. 1 pill morning and night for 5 days" />
                        </div>
                        <button type="submit" className="btn btn-success" style={{ background: 'var(--accent-success)', padding: '12px 24px', height: 'fit-content' }} disabled={isLoading}>
                            {isLoading ? 'Sending...' : 'Send to Pharmacy'}
                        </button>
                    </form>
                </div>
            )}

            <div className="dashboard-grid">
                {['Receptionist', 'Admin'].includes(user?.role) && (
                    <form id="appointment_form" className="glass-panel" style={{ padding: '24px' }} onSubmit={handleSubmit}>
                        <h4 style={{ marginBottom: '16px', color: 'var(--text-secondary)' }}>Schedule New</h4>
                        <div className="form-group">
                            <label>Patient</label>
                            <select className="form-control" required value={formData.patient_id} onChange={e => setFormData({ ...formData, patient_id: e.target.value })}>
                                <option value="">Select Patient...</option>
                                {patients.map(p => (
                                    <option key={p.id} value={p.id}>{p.first_name} {p.last_name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Doctor</label>
                            <select className="form-control" required value={formData.doctor_id} onChange={e => setFormData({ ...formData, doctor_id: e.target.value })}>
                                {doctors.map(d => (
                                    <option key={d.id} value={d.id}>{d.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Date & Time</label>
                            <input type="datetime-local" className="form-control" required value={formData.appointment_date} onChange={e => setFormData({ ...formData, appointment_date: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label>Reason / Notes</label>
                            <input type="text" className="form-control" value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} placeholder="Brief description" />
                        </div>
                        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>
                            ℹ️ SMS Notification will be sent to the patient's registered mobile number.
                        </p>
                        <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={isLoading}>
                            {isLoading ? 'Scheduling...' : 'Confirm Appointment'}
                        </button>
                    </form>
                )}

                <div className="glass-panel" style={{ padding: '24px', gridColumn: user?.role === 'Doctor' ? '1 / -1' : 'span 2' }}>
                    <h4 style={{ marginBottom: '16px', color: 'var(--text-secondary)' }}>Today's Queue</h4>
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Time</th>
                                    <th>Patient</th>
                                    {user?.role !== 'Doctor' && <th>Doctor</th>}
                                    <th>Queue #</th>
                                    <th>Notes</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {appointments.map(app => (
                                    <tr key={app.id}>
                                        <td>{new Date(app.appointment_date).toLocaleString()}</td>
                                        <td>{app.first_name} {app.last_name}</td>
                                        {user?.role !== 'Doctor' && <td>{app.doctor_name || 'Assigned Doctor'}</td>}
                                        <td><h2>{app.queue_number}</h2></td>
                                        <td>{app.notes || '-'}</td>
                                        <td>
                                            <span className={`badge ${app.status === 'Completed' || app.status === 'Approved' ? 'badge-success' : app.status === 'Waiting' ? 'badge-warning' : app.status === 'Rejected' ? 'badge-danger' : 'badge-info'}`}>
                                                {app.status}
                                            </span>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                                {['Receptionist', 'Admin'].includes(user?.role) ? (
                                                    <>
                                                        {(app.status === 'Scheduled' || app.status === 'Pending') && (
                                                            <button className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '12px' }} onClick={() => updateStatus(app.id, 'Waiting')}>
                                                                Mark Arrived
                                                            </button>
                                                        )}
                                                        {app.status === 'Waiting' && (
                                                            <button className="btn btn-success" style={{ padding: '4px 8px', fontSize: '12px', background: 'var(--accent-success)' }} onClick={() => updateStatus(app.id, 'Completed')}>
                                                                Complete
                                                            </button>
                                                        )}
                                                    </>
                                                ) : (
                                                    <>
                                                        {(app.status === 'Scheduled' || app.status === 'Pending' || app.status === 'Waiting') && (
                                                            <>
                                                                <button className="btn btn-success" style={{ padding: '4px 8px', fontSize: '12px', background: 'var(--accent-success)' }} onClick={() => approveAppointment(app.id, 'Approved')}>
                                                                    Approve
                                                                </button>
                                                                <button className="btn" style={{ padding: '4px 8px', fontSize: '12px', background: '#ef4444', color: 'white' }} onClick={() => approveAppointment(app.id, 'Rejected')}>
                                                                    Reject
                                                                </button>
                                                            </>
                                                        )}
                                                        {(app.status === 'Approved' || app.status === 'Completed') && (
                                                            <button className="btn btn-primary" style={{ padding: '4px 8px', fontSize: '12px', background: 'var(--accent-primary)' }} onClick={() => setPrescribingFor(app)}>
                                                                💊 Prescribe
                                                            </button>
                                                        )}
                                                        {app.status === 'Approved' && (
                                                            <button className="btn btn-success" style={{ padding: '4px 8px', fontSize: '12px', background: 'var(--accent-success)' }} onClick={() => updateStatus(app.id, 'Completed')}>
                                                                Mark Done
                                                            </button>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {appointments.length === 0 && (
                                    <tr>
                                        <td colSpan={user?.role === 'Doctor' ? 6 : 7} style={{ textAlign: 'center', padding: '40px' }}>No appointments scheduled yet.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Appointments;
