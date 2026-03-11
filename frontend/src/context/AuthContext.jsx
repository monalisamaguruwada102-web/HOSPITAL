import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);

    useEffect(() => {
        const storedUser = localStorage.getItem('ihms_user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
    }, []);

    // Global 401 Interceptor: Automatically logout on session lapse
    useEffect(() => {
        const originalFetch = window.fetch;
        window.fetch = async (...args) => {
            const response = await originalFetch(...args);
            // If the server returns 401 (Unauthorized), but we're not on the login page
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

    return (
        <AuthContext.Provider value={{ user, setUser, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
