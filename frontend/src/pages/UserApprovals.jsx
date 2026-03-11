import { useState, useEffect } from 'react';

function UserApprovals() {
    const [pendingUsers, setPendingUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('');

    const getAuthHeaders = () => {
        const token = localStorage.getItem('token');
        return {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };
    };

    const fetchPendingUsers = async () => {
        try {
            const res = await fetch('/api/admin/pending-staff-requests', { headers: getAuthHeaders() });
            const data = await res.json();
            setPendingUsers(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Failed to fetch pending users', err);
        }
    };

    useEffect(() => {
        fetchPendingUsers();
    }, []);

    const handleApproval = async (id, status) => {
        setIsLoading(true);
        setMessage('');
        try {
            const res = await fetch(`/api/admin/approve-user/${id}`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify({ status })
            });
            const data = await res.json();
            if (res.ok) {
                setMessage(`User ${status.toLowerCase()} successfully!`);
                fetchPendingUsers();
            } else {
                setMessage(data.error || 'Operation failed');
            }
        } catch (err) {
            setMessage('Network error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '500' }}>Staff Access Approvals</h3>
            </div>

            {message && (
                <div style={{ padding: '12px', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid var(--accent-primary)', borderRadius: '8px', color: 'var(--accent-primary)', marginBottom: '20px' }}>
                    {message}
                </div>
            )}

            <div className="glass-panel" style={{ padding: '24px' }}>
                <p style={{ color: 'var(--text-muted)', marginBottom: '20px' }}>The following staff members have registered and are waiting for system access permissions.</p>
                
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Username</th>
                                <th>Requested Role</th>
                                <th>Branch ID</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {pendingUsers.map(user => (
                                <tr key={user.id}>
                                    <td style={{ fontWeight: '500' }}>{user.name}</td>
                                    <td>{user.username}</td>
                                    <td>
                                        <span className="badge badge-info">{user.role}</span>
                                    </td>
                                    <td>{user.branch_id}</td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button 
                                                className="btn btn-primary" 
                                                style={{ padding: '6px 12px', fontSize: '12px', background: 'var(--accent-success)' }}
                                                onClick={() => handleApproval(user.id, 'Approved')}
                                                disabled={isLoading}
                                            >
                                                Approve
                                            </button>
                                            <button 
                                                className="btn btn-secondary" 
                                                style={{ padding: '6px 12px', fontSize: '12px', color: '#ef4444' }}
                                                onClick={() => handleApproval(user.id, 'Rejected')}
                                                disabled={isLoading}
                                            >
                                                Reject
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {pendingUsers.length === 0 && (
                                <tr>
                                    <td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                                        No pending approval requests.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

export default UserApprovals;
