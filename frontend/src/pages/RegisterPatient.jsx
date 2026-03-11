import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

function RegisterPatient() {
    const [name, setName] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setIsLoading(true);

        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                // Use default branch 1 for patients, hardcode role to Patient
                body: JSON.stringify({ name, username, password, role: 'Patient', branch_id: 1 })
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || 'Registration failed');
                return;
            }

            setSuccess('Registration successful! Redirecting to login...');
            setTimeout(() => {
                navigate('/login');
            }, 2000);
        } catch (err) {
            setError('Server error: ' + err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100vh',
            width: '100vw',
            background: 'var(--bg-main)'
        }}>
            <div className="glass-panel" style={{ width: '400px', padding: '40px', textAlign: 'center' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>👤</div>
                <h1 style={{ marginBottom: '8px', fontSize: '24px' }}>IHMS Premium</h1>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>Fast Patient Registration</p>
                
                {error && <div style={{ color: 'var(--accent-danger)', marginBottom: '16px', background: 'rgba(239, 68, 68, 0.1)', padding: '12px', borderRadius: '8px' }}>{error}</div>}
                {success && <div style={{ color: 'var(--accent-success)', marginBottom: '16px', background: 'rgba(16, 185, 129, 0.1)', padding: '12px', borderRadius: '8px' }}>{success}</div>}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'left' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label>Full Legal Name</label>
                        <input 
                            type="text" 
                            className="form-control" 
                            value={name} 
                            onChange={(e) => setName(e.target.value)} 
                            required 
                            placeholder="John Doe"
                        />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label>Username</label>
                        <input 
                            type="text" 
                            className="form-control" 
                            value={username} 
                            onChange={(e) => setUsername(e.target.value)} 
                            required 
                            placeholder="jdoe"
                        />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label>Password</label>
                        <input 
                            type="password" 
                            className="form-control" 
                            value={password} 
                            onChange={(e) => setPassword(e.target.value)} 
                            required 
                            placeholder="••••••••"
                        />
                    </div>
                    
                    <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '8px', padding: '12px' }} disabled={isLoading}>
                        {isLoading ? 'Registering...' : 'Register Account'}
                    </button>
                    
                    <p style={{ textAlign: 'center', marginTop: '16px', fontSize: '14px', color: 'var(--text-secondary)' }}>
                        Already have an account? <Link to="/login" style={{ color: 'var(--accent-primary)', textDecoration: 'none' }}>Log in here</Link>
                    </p>
                </form>
            </div>
        </div>
    );
}

export default RegisterPatient;
