import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

function Portal() {
    const [stats, setStats] = useState({
        patients: 1250,
        doctors: 45,
        branches: 2,
        appointments: 5400
    });
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const fetchStats = async () => {
        try {
            const res = await fetch('/api/public/stats');
            if (res.ok) {
                const data = await res.json();
                setStats(data);
            }
        } catch (e) { console.error('Failed to fetch stats', e); }
    };

    useEffect(() => {
        fetchStats();
        // Optional: poll every minute
        const interval = setInterval(fetchStats, 60000);
        return () => clearInterval(interval);
    }, []);

    const services = [
        { title: 'Emergency Care', icon: '🚑', desc: '24/7 high-priority medical intervention for critical situations.' },
        { title: 'Laboratory', icon: '🔬', desc: 'Precision diagnostics and advanced biological testing services.' },
        { title: 'Pharmacy', icon: '💊', desc: 'Fully stocked medicinal inventory with automated batch tracking.' },
        { title: 'Specialized Surgery', icon: '🔪', desc: 'State-of-the-art operating theaters with expert surgical teams.' },
        { title: 'Telemedicine', icon: '💻', desc: 'Secure remote consultations from the comfort of your home.' },
        { title: 'Health Screenings', icon: '🛡️', desc: 'Comprehensive wellness checks and preventative diagnostic profiles.' }
    ];

    return (
        <div style={{ minHeight: '100vh', width: '100vw', display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)', overflowX: 'hidden' }}>
            <style>{`
                .portal-header { padding: 24px 80px; }
                .portal-hero { padding: 120px 80px; flex-direction: row; }
                .portal-section { padding: 100px 80px; }
                .portal-footer { padding: 80px 80px 40px 80px; }
                .hero-text h1 { font-size: 64px; }
                .hero-image { display: flex; }
                .mobile-toggle { display: none; }
                .nav-menu { display: flex; gap: 32px; align-items: center; }
                .footer-grid { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 60px; }

                @media (max-width: 1024px) {
                    .portal-header { padding: 20px 40px; }
                    .portal-hero { padding: 80px 40px; }
                    .portal-section { padding: 60px 40px; }
                    .portal-footer { padding: 60px 40px 30px 40px; }
                    .hero-text h1 { font-size: 48px; }
                }

                @media (max-width: 768px) {
                    .portal-header { padding: 16px 20px; }
                    .portal-hero { padding: 60px 20px; flex-direction: column; text-align: center; }
                    .hero-text { text-align: center; }
                    .hero-text h1 { font-size: 36px; }
                    .hero-text p { margin-left: auto; margin-right: auto; }
                    .hero-actions { justify-content: center; }
                    .hero-image { display: none; }
                    .portal-section { padding: 40px 20px; }
                    .portal-footer { padding: 40px 20px; }
                    .mobile-toggle { display: block; background: none; border: none; font-size: 30px; color: #fff; cursor: pointer; }
                    .nav-menu { 
                        display: ${mobileMenuOpen ? 'flex' : 'none'}; 
                        flex-direction: column; 
                        position: absolute; 
                        top: 100%; 
                        left: 0; 
                        width: 100%; 
                        background: rgba(15, 17, 26, 0.95); 
                        padding: 30px; 
                        border-bottom: 1px solid var(--border-glass);
                        gap: 20px;
                        backdrop-filter: blur(20px);
                    }
                    .footer-grid { grid-template-columns: 1fr; gap: 40px; text-align: center; }
                    .footer-grid div { display: flex; flexDirection: column; align-items: center; }
                    .nav-links { flex-direction: column; gap: 15px !important; }
                    .auth-buttons { flex-direction: column; width: 100%; }
                    .auth-buttons a { width: 100%; text-align: center; }
                }
            `}</style>
            {/* Navigation Header */}
            <header className="portal-header" style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                background: 'rgba(15, 17, 26, 0.7)', 
                backdropFilter: 'blur(20px)', 
                borderBottom: '1px solid var(--border-glass)',
                position: 'sticky',
                top: 0,
                zIndex: 100
            }}>
                <div style={{ fontSize: '24px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '32px' }}>🏥</span>
                    <span style={{ background: 'var(--gradient-main)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        IHMS Premium
                    </span>
                </div>

                <button className="mobile-toggle" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                    {mobileMenuOpen ? '✕' : '☰'}
                </button>

                <div className="nav-menu">
                    <nav className="nav-links" style={{ display: 'flex', gap: '24px' }}>
                        <a href="#services" onClick={() => setMobileMenuOpen(false)} style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontWeight: '500', transition: 'var(--transition)' }}>Services</a>
                        <a href="#stats" onClick={() => setMobileMenuOpen(false)} style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontWeight: '500', transition: 'var(--transition)' }}>Impact</a>
                        <a href="#about" onClick={() => setMobileMenuOpen(false)} style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontWeight: '500', transition: 'var(--transition)' }}>About</a>
                    </nav>
                    <div className="auth-buttons" style={{ display: 'flex', gap: '16px' }}>
                        <Link to="/login" className="btn btn-secondary" style={{ padding: '10px 24px', borderRadius: 'var(--radius-md)', textDecoration: 'none' }}>Staff Access</Link>
                        <Link to="/register-patient" className="btn btn-primary" style={{ padding: '10px 24px', borderRadius: 'var(--radius-md)', textDecoration: 'none' }}>Patient Login</Link>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <section className="portal-hero" style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between', 
                gap: '60px',
                position: 'relative'
            }}>
                <div className="hero-text animate-fade-in" style={{ flex: 1, zIndex: 2 }}>
                    <span className="badge badge-info" style={{ marginBottom: '24px', display: 'inline-block' }}>Innovating Healthcare Everywhere</span>
                    <h1 style={{ fontWeight: '800', lineHeight: '1.1', marginBottom: '32px', maxWidth: '700px' }}>
                        The Future of <br/>
                        <span style={{ background: 'var(--gradient-main)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Hospital Intelligence</span>
                    </h1>
                    <p style={{ fontSize: '18px', color: 'var(--text-secondary)', marginBottom: '48px', maxWidth: '600px', lineHeight: '1.7' }}>
                        Experience the most advanced Integrated Health Management System. We combine high-tech data sets with compassionate care to provide a seamless medical journey.
                    </p>
                    <div className="hero-actions" style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
                        <Link to="/register-patient" className="btn btn-primary" style={{ padding: '16px 36px', fontSize: '18px', borderRadius: 'var(--radius-lg)', textDecoration: 'none' }}>
                            📅 Book Your Visit
                        </Link>
                        <a href="#services" className="btn btn-secondary" style={{ padding: '16px 36px', fontSize: '18px', borderRadius: 'var(--radius-lg)', textDecoration: 'none' }}>
                            Explore Services
                        </a>
                    </div>
                </div>

                <div className="hero-image animate-fade-in" style={{ flex: 1, justifyContent: 'flex-end', position: 'relative' }}>
                    <div className="glass-panel" style={{ width: '100%', maxWidth: '450px', height: '550px', padding: '12px', transform: 'rotate(2deg)', overflow: 'hidden' }}>
                       <img src="https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=800" 
                            alt="Hospital Facility" 
                            style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'calc(var(--radius-lg) - 4px)' }} />
                    </div>
                    {/* Floating Element */}
                    <div className="glass-panel" style={{ 
                        position: 'absolute', 
                        bottom: '40px', 
                        left: '-20px', 
                        padding: '24px', 
                        zIndex: 3, 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '16px',
                        transform: 'rotate(-2deg)'
                    }}>
                        <div className="avatar" style={{ background: 'var(--accent-success)' }}>✨</div>
                        <div style={{ textAlign: 'left' }}>
                            <div style={{ fontSize: '14px', color: 'var(--accent-success)', fontWeight: '700' }}>Live Verification</div>
                            <div style={{ fontSize: '18px', fontWeight: '600' }}>ISO 9001 Certified</div>
                        </div>
                    </div>
                </div>

                {/* Background Blobs */}
                <div style={{ position: 'absolute', top: '-100px', left: '-100px', width: '400px', height: '400px', background: 'var(--accent-primary)', filter: 'blur(150px)', opacity: 0.15 }}></div>
                <div style={{ position: 'absolute', bottom: '-100px', right: '-100px', width: '400px', height: '400px', background: 'var(--accent-secondary)', filter: 'blur(150px)', opacity: 0.15 }}></div>
            </section>

            {/* Impact/Stats Section */}
            <section id="stats" className="portal-section">
                <div className="dashboard-grid">
                    <div className="stat-card glass-panel" style={{ padding: '30px' }}>
                        <div className="stat-info">
                            <h3>Trusted Patients</h3>
                            <p>{stats.patients.toLocaleString()}+</p>
                        </div>
                        <div className="stat-icon" style={{ background: 'rgba(59, 130, 246, 0.15)' }}>👤</div>
                    </div>
                    <div className="stat-card glass-panel" style={{ padding: '30px' }}>
                        <div className="stat-info">
                            <h3>Specialized Doctors</h3>
                            <p>{stats.doctors.toLocaleString()}</p>
                        </div>
                        <div className="stat-icon" style={{ background: 'rgba(139, 92, 246, 0.15)', color: 'var(--accent-secondary)' }}>🩺</div>
                    </div>
                    <div className="stat-card glass-panel" style={{ padding: '30px' }}>
                        <div className="stat-info">
                            <h3>Total Procedures</h3>
                            <p>{stats.appointments.toLocaleString()}+</p>
                        </div>
                        <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.15)', color: 'var(--accent-success)' }}>⚡</div>
                    </div>
                    <div className="stat-card glass-panel" style={{ padding: '30px' }}>
                        <div className="stat-info">
                            <h3>Regional Branches</h3>
                            <p>{stats.branches}</p>
                        </div>
                        <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.15)', color: 'var(--accent-warning)' }}>🏢</div>
                    </div>
                </div>
            </section>

            {/* Services Section */}
            <section id="services" className="portal-section" style={{ background: 'rgba(0,0,0,0.1)' }}>
                <div style={{ textAlign: 'center', marginBottom: '60px' }}>
                    <h2 style={{ fontSize: '36px', fontWeight: '700', marginBottom: '16px' }}>Advanced Medical Services</h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '18px', maxWidth: '600px', margin: '0 auto' }}>
                        We leverage AI and real-time batch pharmaceutical tracking to ensure you get the right care at the right time.
                    </p>
                </div>
                
                <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', 
                    gap: '32px' 
                }}>
                    {services.map((s, idx) => (
                        <div key={idx} className="glass-panel" style={{ 
                            padding: '40px', 
                            transition: 'var(--transition)', 
                            cursor: 'default',
                            position: 'relative'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--accent-primary)'}
                        onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-glass)'}
                        >
                            <div style={{ fontSize: '48px', marginBottom: '24px' }}>{s.icon}</div>
                            <h3 style={{ fontSize: '22px', fontWeight: '600', marginBottom: '16px' }}>{s.title}</h3>
                            <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6' }}>{s.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Call to Action Section */}
            <section className="portal-section" style={{ textAlign: 'center' }}>
                <div className="glass-panel cta-panel" style={{ 
                    padding: '60px 20px', 
                    background: 'var(--gradient-main)', 
                    position: 'relative', 
                    overflow: 'hidden' 
                }}>
                    <div style={{ position: 'relative', zIndex: 2 }}>
                        <h2 style={{ fontSize: '36px', fontWeight: '800', marginBottom: '24px', color: '#fff' }}>Ready to Experience Better Health?</h2>
                        <p style={{ fontSize: '18px', marginBottom: '40px', opacity: 0.9, maxWidth: '700px', margin: '0 auto' }}>
                            Join thousands of satisfied patients. Book your appointment today and skip the queue with our digital priority system.
                        </p>
                        <Link to="/register-patient" className="btn" style={{ 
                            background: '#fff', 
                            color: 'var(--accent-primary)', 
                            padding: '16px 40px', 
                            fontSize: '18px', 
                            borderRadius: 'var(--radius-lg)',
                            textDecoration: 'none'
                        }}>
                            Get Started Now
                        </Link>
                    </div>
                    {/* Decorative Blobs */}
                    <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: '300px', height: '300px', background: 'rgba(255,255,255,0.1)', borderRadius: '50%' }}></div>
                    <div style={{ position: 'absolute', bottom: '-10%', right: '-10%', width: '400px', height: '400px', background: 'rgba(0,0,0,0.1)', borderRadius: '50%' }}></div>
                </div>
            </section>

            {/* Footer */}
            <footer className="portal-footer" style={{ background: 'var(--bg-secondary)', borderTop: '1px solid var(--border-glass)' }}>
                <div className="footer-grid">
                    <div>
                        <div style={{ fontSize: '24px', fontWeight: '800', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span>🏥</span> IHMS Premium
                        </div>
                        <p style={{ color: 'var(--text-secondary)', lineHeight: '1.8' }}>
                            Integrated Health Management System. A state-of-the-art solution for modern medical facilities worldwide. Engineered for excellence, designed for people.
                        </p>
                    </div>
                    <div>
                        <h4 style={{ color: '#fff', marginBottom: '24px' }}>Quick Links</h4>
                        <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '12px', padding: 0 }}>
                            <li><a href="#" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>Home</a></li>
                            <li><a href="#services" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>Services</a></li>
                            <li><a href="#about" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>About Us</a></li>
                            <li><a href="/login" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>Staff Portal</a></li>
                        </ul>
                    </div>
                    <div>
                        <h4 style={{ color: '#fff', marginBottom: '24px' }}>Legal</h4>
                        <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '12px', padding: 0 }}>
                            <li><a href="#" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>Privacy Policy</a></li>
                            <li><a href="#" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>Terms of Service</a></li>
                            <li><a href="#" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>GDPR Compliance</a></li>
                        </ul>
                    </div>
                    <div>
                        <h4 style={{ color: '#fff', marginBottom: '24px' }}>Contact</h4>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.8' }}>
                            Main HQ: 123 Healthcare Blvd,<br/>
                            Medical District, State 45678<br/><br/>
                            Phone: +1 (555) 000-1111<br/>
                            Email: contact@ihms.premium
                        </p>
                    </div>
                </div>
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '40px' }}>
                    &copy; 2026 IHMS Premium Global Network. All rights reserved.
                </div>
            </footer>
        </div>
    );
}

export default Portal;
