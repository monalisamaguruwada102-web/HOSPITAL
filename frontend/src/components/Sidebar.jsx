import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Sidebar({ isOpen, closeSidebar }) {
    const { user, logout } = useAuth();
    const menuItems = [
        { path: '/', icon: '📊', label: 'Dashboard', roles: ['Admin', 'Doctor', 'Nurse', 'Receptionist', 'Pharmacist', 'Lab Technician'] },
        { path: '/patients', icon: '👥', label: 'Patients', roles: ['Admin', 'Doctor', 'Nurse', 'Receptionist', 'Pharmacist', 'Lab Technician'] },
        { path: '/appointments', icon: '📅', label: 'Appointments', roles: ['Admin', 'Doctor', 'Nurse', 'Receptionist'] },
        { path: '/laboratory', icon: '🔬', label: 'Laboratory', roles: ['Admin', 'Doctor', 'Lab Technician'] },
        { path: '/pharmacy', icon: '💊', label: 'Pharmacy', roles: ['Admin', 'Doctor', 'Pharmacist'] },
        { path: '/billing', icon: '💳', label: 'Billing', roles: ['Admin', 'Receptionist', 'Doctor'] },
    ];

    return (
        <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
            <div className="brand" style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                <div><span style={{ fontSize: '28px' }}>🏥</span> IHMS</div>
                <button className="menu-toggle" onClick={closeSidebar}>×</button>
            </div>

            <nav className="nav-links">
                {menuItems.filter(item => item.roles.includes(user?.role)).map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                        end={item.path === '/'}
                    >
                        <i>{item.icon}</i>
                        <span>{item.label}</span>
                    </NavLink>
                ))}
                {user?.role === 'Admin' && (
                    <NavLink
                        to="/system-logs"
                        className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                    >
                        <i>🔒</i>
                        <span>Audit Logs</span>
                    </NavLink>
                )}
                {user?.role === 'Admin' && (
                    <NavLink
                        to="/approvals"
                        className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                    >
                        <i>✅</i>
                        <span>User Approvals</span>
                    </NavLink>
                )}
            </nav>

            <div style={{ marginTop: 'auto', padding: '16px 0', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                {user && (
                    <div style={{ marginBottom: '12px', padding: '0 16px' }}>
                        <div style={{ fontWeight: '500', fontSize: '14px' }}>{user.name}</div>
                        <div style={{ fontSize: '12px', color: 'var(--accent-primary)' }}>{user.role}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>📍 Branch {user.branch_id || 1}</div>
                    </div>
                )}
                <button className="btn btn-secondary" style={{ width: '100%', justifyContent: 'flex-start', background: 'transparent', border: 'none', color: '#ef4444' }} onClick={logout}>
                    <i>🚪</i> Logout
                </button>
            </div>
        </aside>
    );
}

export default Sidebar;
