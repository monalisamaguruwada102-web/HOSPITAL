import { useState, useEffect } from 'react';

function Dashboard() {
    const [stats, setStats] = useState({
        totalPatients: 0,
        pendingLabs: 0,
        lowStock: 0,
        todayIncome: 0
    });
    const [recentAppointments, setRecentAppointments] = useState([]);

    const getAuthHeaders = () => {
        const token = localStorage.getItem('token');
        return {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };
    };

    useEffect(() => {
        // Fetch real data to calculate stats and list recent appointments
        const fetchDashboardData = async () => {
            try {
                const [patRes, labRes, pharmRes, billRes, apptRes] = await Promise.all([
                    fetch('/api/patients', { headers: getAuthHeaders() }),
                    fetch('/api/lab', { headers: getAuthHeaders() }),
                    fetch('/api/pharmacy', { headers: getAuthHeaders() }),
                    fetch('/api/billing', { headers: getAuthHeaders() }),
                    fetch('/api/appointments', { headers: getAuthHeaders() })
                ]);

                const [pats, labs, pharmacy, bills, appointments] = await Promise.all([
                    patRes.json().catch(() => []),
                    labRes.json().catch(() => []),
                    pharmRes.json().catch(() => []),
                    billRes.json().catch(() => []),
                    apptRes.json().catch(() => [])
                ]);
                
                // Be extra defensive
                const safePats = Array.isArray(pats) ? pats : [];
                const safeLabs = Array.isArray(labs) ? labs : [];
                const safePharm = Array.isArray(pharmacy) ? pharmacy : [];
                const safeBills = Array.isArray(bills) ? bills : [];
                const safeAppts = Array.isArray(appointments) ? appointments : [];

                // Calculate basic stats
                const pendingLabsCount = safeLabs.filter(l => l.status !== 'Completed').length;
                const lowStockCount = safePharm.filter(p => p.quantity <= p.low_stock_threshold).length;
                const todayIncomeCount = safeBills.reduce((sum, b) => sum + (b.amount || 0), 0);

                setStats({
                    totalPatients: safePats.length,
                    pendingLabs: pendingLabsCount,
                    lowStock: lowStockCount,
                    todayIncome: todayIncomeCount
                });

                // Get top 5 most recent appointments
                const recent = safeAppts.slice(0, 5);
                setRecentAppointments(recent);

            } catch (err) {
                console.error("Failed to load dashboard data");
            }
        };

        fetchDashboardData();
    }, []);

    return (
        <div>
            <div className="dashboard-grid">
                <div className="stat-card glass-panel" style={{ borderLeft: '4px solid var(--accent-primary)' }}>
                    <div className="stat-info">
                        <h3>Total Patients</h3>
                        <p>{stats.totalPatients}</p>
                    </div>
                    <div className="stat-icon" style={{ background: 'rgba(59, 130, 246, 0.1)', color: 'var(--accent-primary)' }}>
                        👥
                    </div>
                </div>

                <div className="stat-card glass-panel" style={{ borderLeft: '4px solid var(--accent-warning)' }}>
                    <div className="stat-info">
                        <h3>Pending Lab Results</h3>
                        <p>{stats.pendingLabs}</p>
                    </div>
                    <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: 'var(--accent-warning)' }}>
                        🔬
                    </div>
                </div>

                <div className="stat-card glass-panel" style={{ borderLeft: '4px solid var(--accent-danger)' }}>
                    <div className="stat-info">
                        <h3>Low Stock Alerts</h3>
                        <p>{stats.lowStock}</p>
                    </div>
                    <div className="stat-icon" style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--accent-danger)' }}>
                        💊
                    </div>
                </div>

                <div className="stat-card glass-panel" style={{ borderLeft: '4px solid var(--accent-success)' }}>
                    <div className="stat-info">
                        <h3>Total Income</h3>
                        <p>${stats.todayIncome.toFixed(2)}</p>
                    </div>
                    <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--accent-success)' }}>
                        💳
                    </div>
                </div>
            </div>

            <div className="dashboard-grid" style={{ gridTemplateColumns: 'revert' }}>
                <div className="glass-panel" style={{ padding: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                        <h3>Recent Appointments</h3>
                        <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }}>View All</button>
                    </div>
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Patient Name</th>
                                    <th>Doctor</th>
                                    <th>Date/Time</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentAppointments.map(app => (
                                    <tr key={app.id}>
                                        <td>{app.first_name} {app.last_name}</td>
                                        <td>{app.doctor_name || 'Assigned Doctor'}</td>
                                        <td>{new Date(app.appointment_date).toLocaleString()}</td>
                                        <td>
                                            <span className={`badge ${app.status === 'Completed' ? 'badge-success' : app.status === 'Waiting' ? 'badge-warning' : 'badge-info'}`}>
                                                {app.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                                {recentAppointments.length === 0 && (
                                    <tr>
                                        <td colSpan="4" style={{ textAlign: 'center', padding: '20px' }}>No recent appointments found.</td>
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

export default Dashboard;
