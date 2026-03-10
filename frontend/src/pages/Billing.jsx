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

    const getAuthHeaders = () => {
        const token = localStorage.getItem('token');
        return {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };
    };

    const fetchData = async () => {
        try {
            const [billRes, patRes] = await Promise.all([
                fetch('/api/billing', { headers: getAuthHeaders() }),
                fetch('/api/patients', { headers: getAuthHeaders() })
            ]);
            const billData = await billRes.json();
            const patData = await patRes.json();
            setBills(Array.isArray(billData) ? billData : []);
            setPatients(Array.isArray(patData) ? patData : []);
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
                headers: getAuthHeaders(),
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
                headers: getAuthHeaders(),
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

    const printReceipt = (bill) => {
        const printWindow = window.open('', '_blank');
        const html = `
            <html>
                <head>
                    <title>Invoice - ${bill.id}</title>
                    <style>
                        body { font-family: sans-serif; padding: 40px; }
                        .header { text-align: center; margin-bottom: 40px; }
                        .details { margin-bottom: 20px; }
                        .table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                        .table th, .table td { border-bottom: 1px solid #ddd; padding: 12px; text-align: left; }
                        .footer { margin-top: 50px; text-align: center; font-size: 12px; color: #666; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <h2>IHMS PREMIUM</h2>
                        <p>Hospital Management System - Official Receipt</p>
                    </div>
                    <div class="details">
                        <p><strong>Invoice ID:</strong> INV-${String(bill.id).padStart(5, '0')}</p>
                        <p><strong>Date:</strong> ${new Date(bill.created_at + 'Z').toLocaleString()}</p>
                        <p><strong>Patient:</strong> ${bill.first_name} ${bill.last_name}</p>
                    </div>
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Description</th>
                                <th>Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>${bill.description || 'Medical Service'}</td>
                                <td>$${bill.amount?.toFixed(2)}</td>
                            </tr>
                        </tbody>
                        <tfoot>
                            <tr>
                                <th style="text-align: right;">Total Paid:</th>
                                <th>$${bill.amount?.toFixed(2)}</th>
                            </tr>
                        </tfoot>
                    </table>
                    <div class="footer">
                        <p>Thank you for choosing IHMS. This is a computer-generated receipt.</p>
                        <p>Printed by: ${user.name} (${user.role})</p>
                    </div>
                    <script>window.print(); setTimeout(() => window.close(), 500);</script>
                </body>
            </html>
        `;
        printWindow.document.write(html);
        printWindow.document.close();
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '500' }}>Billing & Payments</h3>
                {['Receptionist', 'Admin'].includes(user?.role) && (
                    <button className="btn btn-primary" style={{ background: 'var(--accent-success)' }} onClick={() => setShowForm(!showForm)}>
                        <i>💵</i> {showForm ? 'Cancel Payment' : 'Record New Payment'}
                    </button>
                )}
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
                                            ['Receptionist', 'Admin'].includes(user?.role) ? (
                                                <button className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '12px' }} onClick={() => printReceipt(bill)}>Print Receipt</button>
                                            ) : (
                                                <span className="badge badge-info">Receipt Processed</span>
                                            )
                                        ) : (
                                            ['Receptionist', 'Admin'].includes(user?.role) ? (
                                                <button className="btn btn-primary" style={{ padding: '4px 8px', fontSize: '12px' }} onClick={() => updateStatus(bill.id, 'Paid')}>Process Payment</button>
                                            ) : (
                                                <span className="badge badge-warning">Awaiting Payment</span>
                                            )
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
