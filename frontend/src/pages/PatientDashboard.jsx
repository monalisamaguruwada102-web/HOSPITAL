import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function PatientDashboard() {
    const { user } = useAuth();
    const [appointments, setAppointments] = useState([]);
    const [doctors, setDoctors] = useState([]);
    const [form, setForm] = useState({ doctor_id: '', appointment_date: '', notes: '' });
    const [isLoading, setIsLoading] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');

    const getHeaders = () => ({
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
    });

    const fetchData = async () => {
        try {
            const [apptRes, docRes] = await Promise.all([
                fetch('/api/appointments', { headers: getHeaders() }),
                fetch('/api/users/doctors', { headers: getHeaders() })
            ]);
            const appts = apptRes.ok ? await apptRes.json() : [];
            const docs = docRes.ok ? await docRes.json() : [];
            setAppointments(Array.isArray(appts) ? appts : []);
            setDoctors(Array.isArray(docs) ? docs : []);
        } catch (e) { console.error(e); }
    };

    useEffect(() => { fetchData(); }, []);

    const handleBook = async (e) => {
        e.preventDefault();
        setIsLoading(true); setSuccess(''); setError('');
        try {
            const res = await fetch('/api/appointments', {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(form)
            });
            const data = await res.json();
            if (!res.ok) { setError(data.error || 'Booking failed'); return; }
            setSuccess(`✅ Appointment booked! Your queue number is #${data.queue_number}`);
            setForm({ doctor_id: '', appointment_date: '', notes: '' });
            fetchData();
        } catch (e) { setError('Server error'); }
        finally { setIsLoading(false); }
    };

    const statusColor = (s) => s === 'Approved' ? '#10b981' : s === 'Rejected' ? '#ef4444' : '#f59e0b';

    return (
        <div style={{ padding: '24px', maxWidth: '900px', margin: '0 auto' }}>
            <div style={{ marginBottom: '28px' }}>
                <h2 style={{ fontSize: '28px', fontWeight: '600', marginBottom: '6px' }}>
                    👋 Welcome, {user?.name}
                </h2>
                <p style={{ color: 'var(--text-secondary)' }}>Your personal health portal — Book appointments and view your history.</p>
            </div>

            {/* Book Appointment Card */}
            <div className="glass-panel" style={{ padding: '28px', marginBottom: '28px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px', color: 'var(--accent-primary)' }}>
                    📅 Book an Appointment
                </h3>

                {success && <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid #10b981', borderRadius: '8px', padding: '12px', marginBottom: '16px', color: '#10b981' }}>{success}</div>}
                {error && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid #ef4444', borderRadius: '8px', padding: '12px', marginBottom: '16px', color: '#ef4444' }}>{error}</div>}

                <form onSubmit={handleBook} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label>Select Doctor</label>
                        <select className="form-control" value={form.doctor_id} onChange={e => setForm({ ...form, doctor_id: e.target.value })} required>
                            <option value="">-- Choose a Doctor --</option>
                            {doctors.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                        </select>
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label>Preferred Date & Time</label>
                        <input type="datetime-local" className="form-control" value={form.appointment_date}
                            onChange={e => setForm({ ...form, appointment_date: e.target.value })} required />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0, gridColumn: '1 / -1' }}>
                        <label>Notes / Symptoms (Optional)</label>
                        <textarea className="form-control" rows="2" value={form.notes}
                            onChange={e => setForm({ ...form, notes: e.target.value })}
                            placeholder="Describe your symptoms or reason for visit..." />
                    </div>
                    <div style={{ gridColumn: '1 / -1' }}>
                        <button type="submit" className="btn btn-primary" disabled={isLoading} style={{ padding: '12px 32px' }}>
                            {isLoading ? 'Booking...' : '📅 Confirm Appointment'}
                        </button>
                    </div>
                </form>
            </div>

            {/* Appointments History */}
            <div className="glass-panel" style={{ padding: '28px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px' }}>📋 My Appointments</h3>
                {appointments.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px' }}>No appointments found yet.</p>
                ) : (
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Doctor</th>
                                    <th>Date & Time</th>
                                    <th>Queue #</th>
                                    <th>Status</th>
                                    <th>Doctor Notes</th>
                                </tr>
                            </thead>
                            <tbody>
                                {appointments.map(a => (
                                    <tr key={a.id}>
                                        <td style={{ fontWeight: '500' }}>Dr. {a.doctor_name || 'TBD'}</td>
                                        <td>{a.appointment_date ? new Date(a.appointment_date).toLocaleString() : '-'}</td>
                                        <td><span className="badge badge-info">#{a.queue_number}</span></td>
                                        <td>
                                            <span style={{ color: statusColor(a.status), fontWeight: '600' }}>
                                                {a.status}
                                            </span>
                                        </td>
                                        <td style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{a.doctor_notes || '-'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

export default PatientDashboard;
