import { useState, useEffect } from 'react';

function Billing() {
    const [bills, setBills] = useState([]);
    const [patients, setPatients] = useState([]);
    const [showForm, setShowForm] = useState(false);

    const [formData, setFormData] = useState({
        patient_id: '',
        description: '',
        amount: '',
        status: 'Paid'
    });

    const fetchData = async () => {
        try {
            const [billRes, patRes] = await Promise.all([
                fetch('/api/billing'),
                fetch('/api/patients')
            ]);
            const billData = await billRes.json();
            const patData = await patRes.json();
            setBills(billData);
            setPatients(patData);
        } catch (err) {
            console.error('Failed to fetch data data', err);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/billing', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...formData, amount: parseFloat(formData.amount) })
            });
            if (res.ok) {
                setFormData({ patient_id: '', description: '', amount: '', status: 'Paid' });
                setShowForm(false);
                fetchData();
            }
        } catch (err) {
            console.error('Failed to record payment', err);
        }
    };

    const updateStatus = async (id, status) => {
        try {
            const res = await fetch(`/api/billing/${id}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status })
            });
            if (res.ok) {
                fetchData();
            }
        } catch (err) {
            console.error('Failed to process payment updates', err);
        }
    };

    // Calculate stats dynamically
    const totalRevenue = bills.filter(b => b.status === 'Paid').reduce((sum, b) => sum + (b.amount || 0), 0);
    const pendingFees = bills.filter(b => b.status === 'Pending').reduce((sum, b) => sum + (b.amount || 0), 0);

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '500' }}>Billing & Payments</h3>
                <button className="btn btn-primary" style={{ background: 'var(--accent-success)' }} onClick={() => setShowForm(!showForm)}>
                    <i>💵</i> {showForm ? 'Cancel Payment' : 'Record New Payment'}
                </button>
            </div>

            <div className="dashboard-grid">
                <div className="stat-card glass-panel" style={{ borderLeft: '4px solid var(--accent-success)' }}>
                    <div className="stat-info">
                        <h3>Total Revenue Collected</h3>
                        <p>${totalRevenue.toFixed(2)}</p>
                    </div>
                </div>
                <div className="stat-card glass-panel" style={{ borderLeft: '4px solid var(--accent-danger)' }}>
                    <div className="stat-info">
                        <h3>Pending Fees Outstanding</h3>
                        <p>${pendingFees.toFixed(2)}</p>
                    </div>
                </div>
            </div>

            {showForm && (
                <form className="glass-panel animate-fade-in" style={{ padding: '24px', marginBottom: '24px', display: 'grid', gridTemplateColumns: 'minmax(200px, 1fr) 2fr 1fr 1fr auto', gap: '16px', alignItems: 'flex-end' }} onSubmit={handleSubmit}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label>Patient</label>
                        <select className="form-control" required value={formData.patient_id} onChange={e => setFormData({ ...formData, patient_id: e.target.value })}>
                            <option value="">Select Patient...</option>
                            {patients.map(p => (
                                <option key={p.id} value={p.id}>{p.first_name} {p.last_name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label>Description (Service/Item)</label>
                        <input type="text" className="form-control" placeholder="e.g. Lab Test, Consultation" required value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label>Amount ($)</label>
                        <input type="number" step="0.01" className="form-control" required value={formData.amount} onChange={e => setFormData({ ...formData, amount: e.target.value })} />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label>Status</label>
                        <select className="form-control" value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}>
                            <option value="Paid">Paid</option>
                            <option value="Pending">Pending</option>
                        </select>
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ padding: '12px 24px', background: 'var(--accent-success)', height: 'fit-content' }}>
                        Submit
                    </button>
                </form>
            )}

            <div className="glass-panel" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <h4 style={{ color: 'var(--text-secondary)' }}>Invoice History</h4>
                    <input type="text" className="form-control" placeholder="Search by Invoice ID or Patient..." style={{ width: '300px', padding: '6px 12px' }} />
                </div>
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Invoice #</th>
                                <th>Patient</th>
                                <th>Description</th>
                                <th>Amount</th>
                                <th>Date</th>
                                <th>Status</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {bills.map(bill => (
                                <tr key={bill.id}>
                                    <td>INV-{String(bill.id).padStart(5, '0')}</td>
                                    <td>{bill.first_name} {bill.last_name}</td>
                                    <td>{bill.description || 'General Service'}</td>
                                    <td>${bill.amount?.toFixed(2) || '0.00'}</td>
                                    <td>{new Date(bill.created_at + 'Z').toLocaleString()}</td>
                                    <td>
                                        <span className={`badge ${bill.status === 'Paid' ? 'badge-success' : 'badge-warning'}`}>
                                            {bill.status}
                                        </span>
                                    </td>
                                    <td>
                                        {bill.status === 'Paid' ? (
                                            <button className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '12px' }}>Print Receipt</button>
                                        ) : (
                                            <button className="btn btn-primary" style={{ padding: '4px 8px', fontSize: '12px' }} onClick={() => updateStatus(bill.id, 'Paid')}>Process Payment</button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {bills.length === 0 && (
                                <tr>
                                    <td colSpan="7" style={{ textAlign: 'center', padding: '40px' }}>No billing records present.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

export default Billing;
