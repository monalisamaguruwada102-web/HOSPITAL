import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const res = await fetch('http://localhost:5000/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Login failed');
            }

            // Save token and user info
            localStorage.setItem('ihms_token', data.token);
            localStorage.setItem('ihms_user', JSON.stringify(data.user));

            navigate('/');
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)' }}>
            <div className="glass-panel animate-fade-in" style={{ padding: '40px', width: '100%', maxWidth: '400px' }}>
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <div className="brand" style={{ justifyContent: 'center', marginBottom: '16px' }}>
                        <span style={{ fontSize: '32px' }}>🏥</span> IHMS
                    </div>
                    <p style={{ color: 'var(--text-secondary)' }}>Sign in to access the system</p>
                </div>

                {error && (
                    <div style={{ padding: '12px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--accent-danger)', borderRadius: '8px', color: 'var(--accent-danger)', marginBottom: '20px', fontSize: '14px' }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin}>
                    <div className="form-group">
                        <label>Username</label>
                        <input
                            type="text"
                            className="form-control"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                        />
                    </div>
                    <div className="form-group" style={{ marginBottom: '32px' }}>
                        <label>Password</label>
                        <input
                            type="password"
                            className="form-control"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={isLoading}>
                        {isLoading ? 'Authenticating...' : 'Sign In'}
                    </button>
                </form>

                <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '13px', color: 'var(--text-muted)' }}>
                    <p>Demo Credentials: admin / admin123</p>
                    <p style={{ marginTop: '8px', fontSize: '14px', color: 'var(--text-secondary)' }}>
                        New Staff Member? <Link to="/register" style={{ color: 'var(--accent-primary)', textDecoration: 'none' }}>Register here</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}

export default Login;
