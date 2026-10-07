import {createContext, useState, useEffect, useContext} from "react";
import api from "../api/axios";

const AuthContext = createContext();

export const AuthProvider = ({children}) => {
    const [user, setUser] = useState(() => {
        const savedUser = localStorage.getItem("user");
        return savedUser ? JSON.parse(savedUser) : null;
    });
    const [token, setToken] = useState(localStorage.getItem("token") || null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const initializeAuth = async () => {
            if (token) {
                try {
                    // Petición a /auth/me para revalidar la sesión
                    const response = await api.get("v1/auth/me");

                    const userData = response.data.user || response.data; // Ajusta según la estructura de la respuesta
                    setUser(userData);
                } catch (error) {
                    console.error('Error al revalidar sesión:', error);
                    logout();
                }
            }
            setLoading(false);
        };

        initializeAuth();
    }, [token]);

    const login = async (credentials) => {
        const response = await api.post("v1/auth/login", credentials);
        
        const {authorisation , user: userData} = response.data;

        const newToken = authorisation.token;
        
        localStorage.setItem("token", newToken);
        localStorage.setItem("user", JSON.stringify(userData));

        setToken(newToken);
        setUser(userData);

        return response.data;
    }

    const register = async (userData) => {
        const response = await api.post("v1/auth/register", userData);
        return response.data;
    }

    const logout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setToken(null);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{user, token, login, register, logout, loading}}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}