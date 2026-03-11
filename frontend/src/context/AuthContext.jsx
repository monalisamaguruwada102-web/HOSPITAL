import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [serverReady, setServerReady] = useState(false);

    // Restore logged-in user from localStorage on mount
    useEffect(() => {
        const storedUser = localStorage.getItem('ihms_user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
    }, []);

    // Server wake-up ping: hit the lightweight /api/version endpoint to
    // wake the Render free-tier server BEFORE any authenticated page loads.
    // This dramatically reduces NS_BINDING_ABORTED errors on all other API calls.
    useEffect(() => {
        const wakeServer = async () => {
            try {
                await fetch('/api/version');
            } catch {
                // Server still sleeping — UI pages have their own retry logic
            } finally {
                setServerReady(true);
            }
        };
        wakeServer();
    }, []);

    // Global 401 Interceptor: Automatically logout on expired/invalid session
    useEffect(() => {
        const originalFetch = window.fetch;
        window.fetch = async (...args) => {
            const response = await originalFetch(...args);
            if (response.status === 401 && !window.location.pathname.includes('/login')) {
                localStorage.removeItem('token');
                localStorage.removeItem('ihms_user');
                setUser(null);
                window.location.href = '/login';
            }
            return response;
        };
        return () => { window.fetch = originalFetch; };
    }, []);

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('ihms_user');
        setUser(null);
        window.location.href = '/login';
    };

    // Show a brief "waking server" screen only when user is logged in and server is not ready
    const isWaking = user && !serverReady;

    return (
        <AuthContext.Provider value={{ user, setUser, logout, serverReady }}>
            {isWaking ? (
                <div style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    justifyContent: 'center', minHeight: '100vh', gap: '16px',
                    background: 'var(--bg-primary, #0f172a)'
                }}>
                    <div style={{
                        width: '48px', height: '48px',
                        border: '4px solid rgba(59,130,246,0.2)',
                        borderTopColor: '#3b82f6',
                        borderRadius: '50%',
                        animation: 'spin 0.9s linear infinite'
                    }} />
                    <p style={{ color: '#94a3b8', fontSize: '14px' }}>
                        Connecting to server, please wait…
                    </p>
                    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                </div>
            ) : children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
