import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

function SystemLogs() {
    const { user } = useAuth();
    const [logs, setLogs] = useState([]);

    useEffect(() => {
        if (user?.role !== 'Admin') return;
        const fetchLogs = async () => {
            try {
                const res = await fetch('/api/audit-logs', {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                });
                const data = await res.json();
                setLogs(Array.isArray(data) ? data : []);
            } catch (err) {
                console.error('Failed to fetch logs', err);
            }
        };
        fetchLogs();
    }, [user]);

    if (user?.role !== 'Admin') {
        return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--accent-danger)' }}>Access Denied. Administrator clearance required to view HIPAA system logs.</div>;
    }

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '500' }}>HIPAA Compliance & System Audit Trail</h3>
                <button className="btn btn-secondary">Export to PDF</button>
            </div>
            
            <div className="glass-panel" style={{ padding: '24px' }}>
                <p style={{ color: 'var(--text-muted)', marginBottom: '16px' }}>Note: The system automatically records all destructive or modifying actions (POST, PUT, DELETE) across all APIs in accordance with security protocols.</p>
                <div className="table-container" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                    <table>
                        <thead>
                            <tr>
                                <th>Timestamp</th>
                                <th>User</th>
                                <th>Action</th>
                                <th>Target Table</th>
                                <th>Record ID</th>
                                <th>IP Address</th>
                            </tr>
                        </thead>
                        <tbody>
                            {logs.map(log => (
                                <tr key={log.id}>
                                    <td style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{new Date(log.created_at).toLocaleString()}</td>
                                    <td style={{ fontWeight: '500' }}>{log.username} (ID: {log.user_id})</td>
                                    <td>
                                        <span className={`badge ${log.action === 'POST' ? 'badge-success' : log.action === 'PUT' ? 'badge-warning' : 'badge-danger'}`}>
                                            {log.action}
                                        </span>
                                    </td>
                                    <td>{log.target_table}</td>
                                    <td>{log.record_id || '-'}</td>
                                    <td style={{ fontSize: '13px', fontFamily: 'monospace' }}>{log.ip_address}</td>
                                </tr>
                            ))}
                            {logs.length === 0 && (
                                <tr>
                                    <td colSpan="6" style={{ textAlign: 'center', padding: '40px' }}>No audit logs found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

export default SystemLogs;
