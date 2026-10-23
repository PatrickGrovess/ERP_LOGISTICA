import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

const readStoredJson = (key) => {
    try {
        return JSON.parse(localStorage.getItem(key) || 'null');
    } catch {
        localStorage.removeItem(key);
        return null;
    }
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => readStoredJson('user'));
    const [tenant, setTenant] = useState(() => readStoredJson('tenant'));
    const [token, setToken] = useState(() => localStorage.getItem('token'));
    const [loading, setLoading] = useState(true);

    const clearSession = useCallback(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('tenant');
        setToken(null);
        setUser(null);
        setTenant(null);
    }, []);

    useEffect(() => {
        let active = true;

        const initializeAuth = async () => {
            if (!token) {
                setLoading(false);
                return;
            }

            setLoading(true);
            try {
                const response = await api.get('v1/auth/me');
                if (!active) return;

                const userData = response.data.user || null;
                const tenantData = response.data.tenant || null;
                setUser(userData);
                setTenant(tenantData);
                localStorage.setItem('user', JSON.stringify(userData));
                localStorage.setItem('tenant', JSON.stringify(tenantData));
            } catch {
                if (active) clearSession();
            } finally {
                if (active) setLoading(false);
            }
        };

        initializeAuth();
        return () => { active = false; };
    }, [token, clearSession]);

    const login = async (credentials) => {
        const response = await api.post('v1/auth/login', credentials);
        const { authorisation, user: userData, tenant: tenantData } = response.data;
        const newToken = authorisation.token;

        localStorage.setItem('token', newToken);
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('tenant', JSON.stringify(tenantData));
        setToken(newToken);
        setUser(userData);
        setTenant(tenantData);

        return response.data;
    };

    const register = async (userData) => {
        const response = await api.post('v1/auth/register', userData);
        return response.data;
    };

    const logout = async () => {
        try {
            if (token) await api.post('v1/auth/logout');
        } catch {
            // La sesión local se elimina aunque el token ya haya expirado o el servidor no responda.
        } finally {
            clearSession();
        }
    };

    const updateUser = useCallback((userData) => {
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
    }, []);

    const updateTenant = useCallback((tenantData) => {
        setTenant(tenantData);
        localStorage.setItem('tenant', JSON.stringify(tenantData));
    }, []);

    return (
        <AuthContext.Provider value={{
            user, tenant, token, login, register, logout, loading, updateUser, updateTenant,
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within an AuthProvider');
    return context;
};
