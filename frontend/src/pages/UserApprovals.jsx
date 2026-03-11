import { useState, useEffect } from 'react';

function UserApprovals() {
    const [pendingUsers, setPendingUsers] = useState([]);
    const [allUsers, setAllUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [activeTab, setActiveTab] = useState('pending');

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

    const fetchAllUsers = async () => {
        try {
            const res = await fetch('/api/admin/all-users', { headers: getAuthHeaders() });
            const data = await res.json();
            setAllUsers(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Failed to fetch all users', err);
        }
    };

    useEffect(() => {
        fetchPendingUsers();
        fetchAllUsers();
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
                fetchAllUsers();
            } else {
                setMessage(data.error || 'Operation failed');
            }
        } catch (err) {
            setMessage('Network error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    const roleColors = {
        'Admin': '#ef4444',
        'Doctor': '#3b82f6',
        'Nurse': '#10b981',
        'Receptionist': '#f59e0b',
        'Pharmacist': '#8b5cf6',
        'Lab Technician': '#06b6d4'
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '500' }}>User & Staff Management</h3>
            </div>

            {/* Tab Nav */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
                <button className={`btn ${activeTab === 'pending' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('pending')}>
                    ✅ Pending Approvals ({pendingUsers.length})
                </button>
                <button className={`btn ${activeTab === 'directory' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('directory')}>
                    👥 Staff Directory ({allUsers.length})
                </button>
            </div>

            {message && (
                <div style={{ padding: '12px', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid var(--accent-primary)', borderRadius: '8px', color: 'var(--accent-primary)', marginBottom: '20px' }}>
                    {message}
                </div>
            )}

            {/* Pending Approvals Tab */}
            {activeTab === 'pending' && (
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
            )}

            {/* Staff Directory Tab */}
            {activeTab === 'directory' && (
                <div className="glass-panel" style={{ padding: '24px' }}>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '20px' }}>All registered users in the hospital system and their assigned roles.</p>
                    
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Name</th>
                                    <th>Username</th>
                                    <th>Role</th>
                                    <th>Branch</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {allUsers.map(u => (
                                    <tr key={u.id}>
                                        <td style={{ color: 'var(--text-muted)' }}>#{u.id}</td>
                                        <td style={{ fontWeight: '500' }}>{u.name}</td>
                                        <td>{u.username}</td>
                                        <td>
                                            <span style={{
                                                padding: '4px 10px',
                                                borderRadius: '12px',
                                                fontSize: '12px',
                                                fontWeight: '600',
                                                background: `${roleColors[u.role] || '#666'}20`,
                                                color: roleColors[u.role] || '#666',
                                                border: `1px solid ${roleColors[u.role] || '#666'}40`
                                            }}>
                                                {u.role}
                                            </span>
                                        </td>
                                        <td>Branch {u.branch_id || 1}</td>
                                        <td>
                                            <span className={`badge ${u.approval_status === 'Approved' ? 'badge-success' : u.approval_status === 'Pending' ? 'badge-warning' : 'badge-danger'}`}>
                                                {u.approval_status || 'Approved'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                                {allUsers.length === 0 && (
                                    <tr>
                                        <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                                            No users found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}

export default UserApprovals;
