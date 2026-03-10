import { useState, useEffect } from 'react';

function Dashboard() {
    const [stats, setStats] = useState({
        totalPatients: 0,
        pendingLabs: 0,
        lowStock: 0,
        todayIncome: 0
    });
    const [recentAppointments, setRecentAppointments] = useState([]);

    useEffect(() => {
        // Fetch real data to calculate stats and list recent appointments
        const fetchDashboardData = async () => {
            try {
                const [patRes, labRes, pharmRes, billRes, apptRes] = await Promise.all([
                    fetch('/api/patients'),
                    fetch('/api/lab'),
                    fetch('/api/pharmacy'),
                    fetch('/api/billing'),
                    fetch('/api/appointments')
                ]);

                const patients = await patRes.json();
                const labs = await labRes.json();
                const pharmacy = await pharmRes.json();
                const bills = await billRes.json();
                const appointments = await apptRes.json();

                // Calculate basic stats
                const pendingLabsCount = labs.filter(l => l.status !== 'Completed').length;
                const lowStockCount = pharmacy.filter(p => p.quantity <= p.low_stock_threshold).length;
                const todayIncomeCount = bills.reduce((sum, b) => sum + (b.amount || 0), 0);

                setStats({
                    totalPatients: patients.length,
                    pendingLabs: pendingLabsCount,
                    lowStock: lowStockCount,
                    todayIncome: todayIncomeCount
                });

                // Get top 5 most recent appointments
                const recent = appointments.slice(0, 5);
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
