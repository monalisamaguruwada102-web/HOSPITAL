import { Link } from 'react-router-dom';

function Portal() {
    return (
        <div style={{ height: '100vh', width: '100vw', display: 'flex', flexDirection: 'column', background: 'var(--bg-main)' }}>
            {/* Header */}
            <header style={{ padding: '20px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(10px)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ fontSize: '24px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '32px' }}>🏥</span> IHMS Premium
                </div>
                <div style={{ display: 'flex', gap: '16px' }}>
                    <Link to="/login" className="btn btn-secondary" style={{ textDecoration: 'none' }}>Staff Login</Link>
                    <Link to="/register-patient" className="btn btn-primary" style={{ textDecoration: 'none' }}>Patient Login / Register</Link>
                </div>
            </header>

            {/* Hero Section */}
            <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '0 20px', position: 'relative', overflow: 'hidden' }}>
                <div className="glass-panel animate-fade-in" style={{ padding: '60px', maxWidth: '800px', zIndex: 2, background: 'rgba(30, 41, 59, 0.6)' }}>
                    <h1 style={{ fontSize: '48px', marginBottom: '24px', background: 'linear-gradient(45deg, var(--accent-primary), var(--accent-secondary))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        Welcome to IHMS Premium
                    </h1>
                    <p style={{ fontSize: '18px', color: 'var(--text-secondary)', marginBottom: '40px', lineHeight: '1.6' }}>
                        Providing world-class healthcare management and patient services. 
                        View real-time public data or book your appointments easily online without hassle.
                    </p>
                    
                    <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap' }}>
                        <Link to="/register-patient" className="btn btn-primary" style={{ padding: '16px 32px', fontSize: '18px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            📅 Book Appointment
                        </Link>
                        <a href="mailto:contact@ihms.local" className="btn btn-secondary" style={{ padding: '16px 32px', fontSize: '18px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            ✉️ Make Inquiries
                        </a>
                    </div>
                </div>

                {/* Decorative Background Elements */}
                <div style={{ position: 'absolute', top: '10%', left: '10%', width: '300px', height: '300px', background: 'var(--accent-primary)', filter: 'blur(150px)', opacity: 0.2, zIndex: 1, borderRadius: '50%' }}></div>
                <div style={{ position: 'absolute', bottom: '10%', right: '10%', width: '300px', height: '300px', background: 'var(--accent-info)', filter: 'blur(150px)', opacity: 0.2, zIndex: 1, borderRadius: '50%' }}></div>
            </main>

            {/* Footer */}
            <footer style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                &copy; 2026 IHMS Premium. All rights reserved.
            </footer>
        </div>
    );
}

export default Portal;
