import { useLocation } from 'react-router-dom';

function Header({ toggleSidebar }) {
    const location = useLocation();

    const getPageTitle = () => {
        switch (location.pathname) {
            case '/': return 'Dashboard Overview';
            case '/patients': return 'Patient Management';
            case '/appointments': return 'Appointments & Queue';
            case '/laboratory': return 'Laboratory Results';
            case '/pharmacy': return 'Pharmacy Inventory';
            case '/billing': return 'Billing & Payments';
            case '/system-logs': return 'Audit Logs';
            default: return 'IHMS Platform';
        }
    };

    return (
        <header className="top-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <button className="menu-toggle" onClick={toggleSidebar}>☰</button>
                <h1 className="page-title">{getPageTitle()}</h1>
            </div>

            <div className="user-profile">
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: '600', fontSize: '14px' }}>System Admin</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Administrator</div>
                </div>
                <div className="avatar">SA</div>
            </div>
        </header>
    );
}

export default Header;
