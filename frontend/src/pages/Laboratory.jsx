import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

function Laboratory() {
    const { user } = useAuth();
    const [labTests, setLabTests] = useState([]);
    const [patients, setPatients] = useState([]);
    const [diseases, setDiseases] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [filter, setFilter] = useState('Pending');
    const [showDiseaseForm, setShowDiseaseForm] = useState(false);

    const [formData, setFormData] = useState({
        patient_id: '',
        test_name: '',
        priority: 'Routine',
        notes: ''
    });

    const [diseaseForm, setDiseaseForm] = useState({
        disease_name: '',
        patient_id: '',
        severity: 'Moderate',
        notes: ''
    });

    const getAuthHeaders = () => {
        const token = localStorage.getItem('token');
        return {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };
    };

    const fetchLabTests = async () => {
        try {
            let url = '/api/lab';
            const params = new URLSearchParams();
            if (user?.role === 'Doctor') params.append('doctor_id', user.id);
            if (filter !== 'All') params.append('status', filter);
            if (params.toString()) url += `?${params.toString()}`;

            const res = await fetch(url, { headers: getAuthHeaders() });
            const data = await res.json();
            setLabTests(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Failed to fetch lab tests', err);
        }
    };

    const fetchPatients = async () => {
        try {
            const res = await fetch('/api/patients', { headers: getAuthHeaders() });
            const data = await res.json();
            setPatients(Array.isArray(data) ? data : []);
        } catch(err) {}
    };

    const fetchDiseases = async () => {
        try {
            const res = await fetch('/api/diseases', { headers: getAuthHeaders() });
            const data = await res.json();
            setDiseases(Array.isArray(data) ? data : []);
        } catch(err) {}
    };

    useEffect(() => {
        fetchLabTests();
        fetchPatients();
        fetchDiseases();
        // eslint-disable-next-line
    }, [user, filter]);

    const handleOrderTest = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const res = await fetch('/api/lab', {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({ ...formData, doctor_id: user.id })
            });
            if (res.ok) {
                setFormData({ patient_id: '', test_name: '', priority: 'Routine', notes: '' });
                fetchLabTests();
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const uploadResult = async (id) => {
        const resultText = prompt('Enter Lab Test Results:');
        if (!resultText) return;
        try {
            const res = await fetch(`/api/lab/${id}/result`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify({ results: resultText })
            });
            if (res.ok) {
                fetchLabTests();
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleLogDisease = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const res = await fetch('/api/diseases', {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(diseaseForm)
            });
            if (res.ok) {
                setDiseaseForm({ disease_name: '', patient_id: '', severity: 'Moderate', notes: '' });
                setShowDiseaseForm(false);
                fetchDiseases();
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '500' }}>Laboratory Management & Results</h3>
                {['Lab Technician', 'Admin'].includes(user?.role) && (
                    <button className="btn btn-primary" onClick={() => setShowDiseaseForm(!showDiseaseForm)}>
                        🦠 {showDiseaseForm ? 'Cancel' : 'Log New Disease'}
                    </button>
                )}
            </div>

            {/* Disease Logging Form for Lab Tech */}
            {showDiseaseForm && (
                <form className="glass-panel animate-fade-in" style={{ padding: '24px', marginBottom: '24px', background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.2)' }} onSubmit={handleLogDisease}>
                    <h4 style={{ marginBottom: '16px', color: 'var(--accent-danger)' }}>🦠 Log Newly Identified Disease</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label>Disease Name</label>
                            <input type="text" className="form-control" required value={diseaseForm.disease_name} onChange={e => setDiseaseForm({ ...diseaseForm, disease_name: e.target.value })} placeholder="e.g. Typhoid, Cholera, Novel Strain" />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label>Patient (Optional)</label>
                            <select className="form-control" value={diseaseForm.patient_id} onChange={e => setDiseaseForm({ ...diseaseForm, patient_id: e.target.value })}>
                                <option value="">General Observation</option>
                                {patients.map(p => (
                                    <option key={p.id} value={p.id}>{p.first_name} {p.last_name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label>Severity</label>
                            <select className="form-control" value={diseaseForm.severity} onChange={e => setDiseaseForm({ ...diseaseForm, severity: e.target.value })}>
                                <option value="Low">Low</option>
                                <option value="Moderate">Moderate</option>
                                <option value="High">High</option>
                                <option value="Critical">Critical</option>
                            </select>
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label>Notes</label>
                            <input type="text" className="form-control" value={diseaseForm.notes} onChange={e => setDiseaseForm({ ...diseaseForm, notes: e.target.value })} placeholder="Symptoms, observations..." />
                        </div>
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ marginTop: '16px', background: 'var(--accent-danger)' }} disabled={isLoading}>
                        {isLoading ? 'Logging...' : 'Submit Disease Report'}
                    </button>
                </form>
            )}

            <div className="dashboard-grid">
                {user?.role === 'Doctor' && (
                    <form className="glass-panel" style={{ padding: '24px' }} onSubmit={handleOrderTest}>
                        <h4 style={{ marginBottom: '16px', color: 'var(--text-secondary)' }}>Order New Test</h4>
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
                            <label>Test Name</label>
                            <input type="text" className="form-control" required value={formData.test_name} onChange={e => setFormData({ ...formData, test_name: e.target.value })} placeholder="e.g. Complete Blood Count" />
                        </div>
                        <div className="form-group">
                            <label>Priority</label>
                            <select className="form-control" value={formData.priority} onChange={e => setFormData({ ...formData, priority: e.target.value })}>
                                <option value="Routine">Routine</option>
                                <option value="Urgent">Urgent</option>
                                <option value="STAT">STAT</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Clinical Notes</label>
                            <textarea className="form-control" value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} rows="2"></textarea>
                        </div>
                        <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={isLoading}>
                            {isLoading ? 'Ordering...' : 'Order Test'}
                        </button>
                    </form>
                )}

                <div className="glass-panel" style={{ padding: '24px', gridColumn: user?.role === 'Doctor' ? 'span 1' : 'span 2' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button className={`btn ${filter === 'Pending' ? 'btn-primary' : 'btn-secondary'}`} style={{ padding: '6px 16px', fontSize: '14px' }} onClick={() => setFilter('Pending')}>Pending</button>
                            <button className={`btn ${filter === 'Completed' ? 'btn-primary' : 'btn-secondary'}`} style={{ padding: '6px 16px', fontSize: '14px' }} onClick={() => setFilter('Completed')}>Completed</button>
                            <button className={`btn ${filter === 'All' ? 'btn-primary' : 'btn-secondary'}`} style={{ padding: '6px 16px', fontSize: '14px' }} onClick={() => setFilter('All')}>All</button>
                        </div>
                    </div>
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Patient</th>
                                    <th>Test</th>
                                    <th>Priority</th>
                                    <th>Status</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {labTests.map(test => (
                                    <tr key={test.id}>
                                        <td>{test.first_name} {test.last_name}</td>
                                        <td>
                                            <div>{test.test_name}</div>
                                            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>By: {test.doctor_name}</div>
                                        </td>
                                        <td>
                                            <span className={`badge ${test.priority === 'STAT' || test.priority === 'Urgent' ? 'badge-danger' : 'badge-info'}`}>
                                                {test.priority}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`badge ${test.status === 'Completed' ? 'badge-success' : 'badge-warning'}`}>
                                                {test.status}
                                            </span>
                                        </td>
                                        <td>
                                            {test.status === 'Pending' ? (
                                                <button className="btn btn-primary" style={{ padding: '4px 8px', fontSize: '12px', background: 'var(--accent-secondary)' }} onClick={() => uploadResult(test.id)}>
                                                    Upload Result
                                                </button>
                                            ) : (
                                                <div style={{ fontSize: '12px', color: 'var(--text-primary)' }}>
                                                    {test.results}
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {labTests.length === 0 && (
                                    <tr>
                                        <td colSpan="5" style={{ textAlign: 'center', padding: '40px' }}>No tests found.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Disease Registry Panel */}
                <div className="glass-panel" style={{ padding: '24px', gridColumn: '1 / -1' }}>
                    <h4 style={{ marginBottom: '16px', color: 'var(--accent-danger)' }}>🦠 Disease Registry — Recently Identified</h4>
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Disease</th>
                                    <th>Patient</th>
                                    <th>Severity</th>
                                    <th>Identified By</th>
                                    <th>Date</th>
                                    <th>Notes</th>
                                </tr>
                            </thead>
                            <tbody>
                                {diseases.map(d => (
                                    <tr key={d.id}>
                                        <td style={{ fontWeight: '600' }}>{d.disease_name}</td>
                                        <td>{d.first_name ? `${d.first_name} ${d.last_name}` : 'General'}</td>
                                        <td>
                                            <span className={`badge ${d.severity === 'Critical' ? 'badge-danger' : d.severity === 'High' ? 'badge-warning' : 'badge-info'}`}>
                                                {d.severity}
                                            </span>
                                        </td>
                                        <td>{d.identified_by_name}</td>
                                        <td>{d.identified_at ? new Date(d.identified_at).toLocaleDateString() : '-'}</td>
                                        <td style={{ fontSize: '12px' }}>{d.notes || '-'}</td>
                                    </tr>
                                ))}
                                {diseases.length === 0 && (
                                    <tr>
                                        <td colSpan="6" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>No diseases logged yet.</td>
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

export default Laboratory;
