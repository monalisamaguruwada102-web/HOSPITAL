import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

function Pharmacy() {
    const { user } = useAuth();
    const [inventory, setInventory] = useState([]);
    const [prescriptions, setPrescriptions] = useState([]);
    const [showAddDrug, setShowAddDrug] = useState(false);
    
    const [formData, setFormData] = useState({ drug_name: '', low_stock_threshold: 10 });
    
    // Batch Management State
    const [managingDrug, setManagingDrug] = useState(null);
    const [batches, setBatches] = useState([]);
    const [batchForm, setBatchForm] = useState({ batch_number: '', quantity: '', expiry_date: '' });
    
    const [isLoading, setIsLoading] = useState(false);

    const getAuthHeaders = () => {
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('ihms_token')}`
        };
    };

    const fetchInventory = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/pharmacy', { headers: getAuthHeaders() });
            const data = await res.json();
            if (Array.isArray(data)) setInventory(data);
        } catch (err) {
            console.error('Failed to fetch pharmacy inventory', err);
        }
    };

    const fetchPrescriptions = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/prescriptions?status=Pending Dispense', { headers: getAuthHeaders() });
            const data = await res.json();
            if (Array.isArray(data)) setPrescriptions(data);
        } catch (err) {
            console.error('Failed to fetch prescriptions', err);
        }
    };

    const fetchBatches = async (drugId) => {
        try {
            const res = await fetch(`http://localhost:5000/api/pharmacy/${drugId}/batches`, { headers: getAuthHeaders() });
            const data = await res.json();
            if (Array.isArray(data)) setBatches(data);
        } catch (err) {
            console.error('Failed to fetch batches', err);
        }
    };

    useEffect(() => {
        fetchInventory();
        fetchPrescriptions();
        // eslint-disable-next-line
    }, []);

    const handleAddDrug = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch('http://localhost:5000/api/pharmacy', {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(formData)
            });
            if (res.ok) {
                setFormData({ drug_name: '', low_stock_threshold: 10 });
                setShowAddDrug(false);
                fetchInventory();
            }
        } catch (err) {
            console.error('Failed to add drug', err);
        }
    };

    const handleAddBatch = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch(`http://localhost:5000/api/pharmacy/${managingDrug.id}/batches`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(batchForm)
            });
            if (res.ok) {
                setBatchForm({ batch_number: '', quantity: '', expiry_date: '' });
                fetchBatches(managingDrug.id);
                fetchInventory(); // Update total amounts
            }
        } catch (err) {
            console.error('Failed to add batch', err);
        }
    };

    const handleDispense = async (rx) => {
        setIsLoading(true);
        try {
            const res = await fetch(`http://localhost:5000/api/prescriptions/${rx.id}/dispense`, {
                method: 'PUT',
                headers: getAuthHeaders()
            });
            
            const data = await res.json();
            if (!res.ok) {
                alert(data.error || 'Failed to dispense');
            } else {
                fetchPrescriptions();
                fetchInventory();
                if (managingDrug) fetchBatches(managingDrug.id);
            }
        } catch (err) {
            console.error('Failed to dispense', err);
        } finally {
            setIsLoading(false);
        }
    };

    const isExpiringSoon = (dateString) => {
        const expiry = new Date(dateString);
        const today = new Date();
        const diffTime = Math.abs(expiry - today);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
        return diffDays <= 60; // Flag if expiring within 60 days
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '500' }}>Pharmacy Inventory & Dispensing</h3>
                {['Pharmacist', 'Admin'].includes(user?.role) && (
                    <button className="btn btn-primary" onClick={() => setShowAddDrug(!showAddDrug)}>
                        <i>➕</i> {showAddDrug ? 'Cancel' : 'Define New Drug Concept'}
                    </button>
                )}
            </div>

            {showAddDrug && (
                <div className="glass-panel animate-fade-in" style={{ padding: '24px', marginBottom: '24px' }}>
                    <form style={{ display: 'flex', gap: '16px', alignItems: 'flex-end' }} onSubmit={handleAddDrug}>
                        <div className="form-group" style={{ marginBottom: 0, flex: 2 }}>
                            <label>Generic Drug Name</label>
                            <input type="text" className="form-control" placeholder="e.g. Amoxicillin 250mg" required value={formData.drug_name} onChange={e => setFormData({ ...formData, drug_name: e.target.value })} />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0, flex: 1 }}>
                            <label>Low Stock Warning Limit</label>
                            <input type="number" className="form-control" required value={formData.low_stock_threshold} onChange={e => setFormData({ ...formData, low_stock_threshold: parseInt(e.target.value) })} />
                        </div>
                        <button type="submit" className="btn btn-primary" style={{ padding: '12px 24px', height: 'fit-content' }}>Save Definition</button>
                    </form>
                </div>
            )}

            {managingDrug && (
                <div className="glass-panel animate-fade-in" style={{ padding: '24px', marginBottom: '24px', border: '1px solid var(--accent-primary)', background: 'rgba(59, 130, 246, 0.05)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <h4 style={{ marginBottom: '16px', color: 'var(--accent-primary)' }}>Batch Management: {managingDrug.drug_name}</h4>
                        <button className="btn btn-secondary" onClick={() => setManagingDrug(null)}>Close</button>
                    </div>
                    
                    <form style={{ display: 'flex', gap: '16px', alignItems: 'flex-end', marginBottom: '24px' }} onSubmit={handleAddBatch}>
                        <div className="form-group" style={{ marginBottom: 0, flex: 2 }}>
                            <label>Batch / Lot Number</label>
                            <input type="text" className="form-control" required value={batchForm.batch_number} onChange={e => setBatchForm({ ...batchForm, batch_number: e.target.value })} />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0, flex: 1 }}>
                            <label>Quantity Received</label>
                            <input type="number" className="form-control" required value={batchForm.quantity} onChange={e => setBatchForm({ ...batchForm, quantity: parseInt(e.target.value) })} />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0, flex: 1 }}>
                            <label>Expiry Date</label>
                            <input type="date" className="form-control" required value={batchForm.expiry_date} onChange={e => setBatchForm({ ...batchForm, expiry_date: e.target.value })} />
                        </div>
                        <button type="submit" className="btn btn-success" style={{ padding: '12px 24px', height: 'fit-content' }}>Receive Batch</button>
                    </form>

                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Batch #</th>
                                    <th>Quantity Available</th>
                                    <th>Expiry Date</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {batches.map(b => (
                                    <tr key={b.id}>
                                        <td>{b.batch_number}</td>
                                        <td>{b.quantity}</td>
                                        <td>{b.expiry_date}</td>
                                        <td>
                                            {isExpiringSoon(b.expiry_date) ? (
                                                <span className="badge badge-warning">Expiring Soon</span>
                                            ) : (
                                                <span className="badge badge-success">Good</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {batches.length === 0 && <tr><td colSpan="4" style={{textAlign: 'center'}}>No active batches.</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            <div className="dashboard-grid">
                <div className="glass-panel" style={{ padding: '24px' }}>
                    <h4 style={{ marginBottom: '16px', color: 'var(--text-secondary)' }}>Pending Prescriptions</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {prescriptions.map(rx => (
                            <div key={rx.id} style={{ padding: '16px', background: 'rgba(59, 130, 246, 0.05)', borderRadius: '12px', border: '1px solid var(--border-glass)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                    <span style={{ fontWeight: '600' }}>{rx.first_name} {rx.last_name}</span>
                                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>By {rx.doctor_name}</span>
                                </div>
                                <div style={{ marginBottom: '12px' }}>
                                    <span style={{ display: 'block', fontSize: '15px', color: 'var(--accent-primary)' }}>{rx.drug_name}</span>
                                    <span style={{ fontSize: '13px', color: 'var(--text-primary)' }}>Dosage: {rx.dosage}</span>
                                </div>
                                {['Pharmacist', 'Admin'].includes(user?.role) ? (
                                    <button 
                                        className="btn btn-success" 
                                        style={{ width: '100%', padding: '6px', fontSize: '14px', background: 'var(--accent-success)' }} 
                                        onClick={() => handleDispense(rx)}
                                        disabled={isLoading}
                                    >
                                        Mark Dispensed (FIFO)
                                    </button>
                                ) : (
                                    <span className="badge badge-warning" style={{ display: 'block', textAlign: 'center' }}>Pending Dispense</span>
                                )}
                                <p style={{fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center', marginTop: '6px', marginBottom: 0}}>
                                    Automatically deducts from earliest expiring batch
                                </p>
                            </div>
                        ))}
                        {prescriptions.length === 0 && (
                            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                                No pending prescriptions.
                            </div>
                        )}
                    </div>
                </div>

                <div className="glass-panel" style={{ padding: '24px', gridColumn: 'span 2' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                        <h4 style={{ color: 'var(--text-secondary)' }}>Current Inventory (Aggregated)</h4>
                    </div>
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Drug Name</th>
                                    <th>Total Stock</th>
                                    <th>Threshold</th>
                                    <th>Status</th>
                                    {['Pharmacist', 'Admin'].includes(user?.role) && <th>Actions</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {inventory.map(item => {
                                    const total = item.total_quantity || 0;
                                    return (
                                    <tr key={item.id}>
                                        <td style={{ fontWeight: '500' }}>{item.drug_name}</td>
                                        <td>
                                            <h2 style={{ color: total <= item.low_stock_threshold ? 'var(--accent-danger)' : '#fff', margin: 0 }}>
                                                {total}
                                            </h2>
                                        </td>
                                        <td>{item.low_stock_threshold}</td>
                                        <td>
                                            <span className={`badge ${total <= item.low_stock_threshold ? 'badge-danger' : 'badge-success'}`}>
                                                {total <= 0 ? 'Out of Stock' : total <= item.low_stock_threshold ? 'Low Stock Alert' : 'Sufficient'}
                                            </span>
                                        </td>
                                        {['Pharmacist', 'Admin'].includes(user?.role) && (
                                            <td>
                                                <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={() => { setManagingDrug(item); fetchBatches(item.id); }}>
                                                    Manage Batches
                                                </button>
                                            </td>
                                        )}
                                    </tr>
                                )})}
                                {inventory.length === 0 && (
                                    <tr>
                                        <td colSpan="5" style={{ textAlign: 'center', padding: '40px' }}>No inventory records found.</td>
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

export default Pharmacy;
