import { useState, useEffect } from 'react';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Fetch with a single retry after a delay (handles Render server cold-start)
const fetchWithRetry = async (url, options, retries = 2, delayMs = 2000) => {
    for (let i = 0; i < retries; i++) {
        try {
            const res = await fetch(url, options);
            if (res.ok) return res;
            // Non-network error (e.g. 401, 500) — don't retry
            return res;
        } catch (err) {
            if (i < retries - 1) {
                await sleep(delayMs);
            } else {
                throw err;
            }
        }
    }
};

function Dashboard() {
    const [stats, setStats] = useState({
        totalPatients: 0,
        pendingLabs: 0,
        lowStock: 0,
        todayIncome: 0
    });
    const [recentAppointments, setRecentAppointments] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState(false);

    const getAuthHeaders = () => {
        const token = localStorage.getItem('token');
        return {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };
    };

    useEffect(() => {
        const fetchDashboardData = async () => {
            setIsLoading(true);
            setLoadError(false);
            try {
                const headers = { headers: getAuthHeaders() };

                const [patRes, labRes, pharmRes, billRes, apptRes] = await Promise.all([
                    fetchWithRetry('/api/patients', headers),
                    fetchWithRetry('/api/lab', headers),
                    fetchWithRetry('/api/pharmacy', headers),
                    fetchWithRetry('/api/billing', headers),
                    fetchWithRetry('/api/appointments', headers)
                ]);

                const safeJson = async (res) => {
                    if (!res) return [];
                    try { return await res.json(); } catch { return []; }
                };

                const [pats, labs, pharmacy, bills, appointments] = await Promise.all([
                    safeJson(patRes),
                    safeJson(labRes),
                    safeJson(pharmRes),
                    safeJson(billRes),
                    safeJson(apptRes)
                ]);

                const safePats = Array.isArray(pats) ? pats : [];
                const safeLabs = Array.isArray(labs) ? labs : [];
                const safePharm = Array.isArray(pharmacy) ? pharmacy : [];
                const safeBills = Array.isArray(bills) ? bills : [];
                const safeAppts = Array.isArray(appointments) ? appointments : [];

                const pendingLabsCount = safeLabs.filter(l => l.status !== 'Completed').length;
                // Use total_quantity (aggregated from DrugBatches) for accurate low-stock count
                const lowStockCount = safePharm.filter(p => {
                    const qty = p.total_quantity != null ? p.total_quantity : p.quantity;
                    return (qty ?? 0) <= (p.low_stock_threshold ?? 10);
                }).length;
                const totalIncome = safeBills.reduce((sum, b) => sum + (b.amount || 0), 0);

                setStats({
                    totalPatients: safePats.length,
                    pendingLabs: pendingLabsCount,
                    lowStock: lowStockCount,
                    todayIncome: totalIncome
                });

                setRecentAppointments(safeAppts.slice(0, 5));

            } catch (err) {
                console.error('Failed to load dashboard data', err);
                setLoadError(true);
            } finally {
                setIsLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    if (isLoading) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 20px', gap: '16px' }}>
                <div style={{
                    width: '48px', height: '48px', border: '4px solid rgba(59,130,246,0.2)',
                    borderTopColor: 'var(--accent-primary)', borderRadius: '50%',
                    animation: 'spin 0.9s linear infinite'
                }} />
                <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Loading dashboard… (server may be waking up, please wait)</p>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    if (loadError) {
        return (
            <div style={{ padding: '40px 20px', textAlign: 'center' }}>
                <div className="glass-panel" style={{ maxWidth: '480px', margin: '0 auto', padding: '32px', borderLeft: '4px solid var(--accent-danger)' }}>
                    <h3 style={{ color: 'var(--accent-danger)', marginBottom: '12px' }}>⚠️ Could Not Load Dashboard</h3>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '20px', lineHeight: '1.6' }}>
                        The server did not respond in time. This can happen if the server just woke from sleep.
                        Please wait a moment and try again.
                    </p>
                    <button className="btn btn-primary" onClick={() => window.location.reload()}>
                        🔄 Retry
                    </button>
                </div>
            </div>
        );
    }

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
