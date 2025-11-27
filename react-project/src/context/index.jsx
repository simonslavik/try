import { createContext, useState, useEffect } from "react";
import axios from 'axios';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
    // initialize from localStorage so auth persists across refresh
    const [auth, setAuthState] = useState(() => {
        try {
            const raw = localStorage.getItem('auth');
            return raw ? JSON.parse(raw) : { user: null, token: null };
        } catch (e) {
            return { user: null, token: null };
        }
    });

    // helper to set auth both in state and localStorage
    const setAuth = (payload) => {
        const next = {
            user: payload?.user || null,
            token: payload?.token || null,
        };
        setAuthState(next);
        try {
            localStorage.setItem('auth', JSON.stringify(next));
        } catch (e) {
            // ignore
        }
        // apply axios default Authorization header
        if (next.token) axios.defaults.headers.common['Authorization'] = `Bearer ${next.token}`;
        else delete axios.defaults.headers.common['Authorization'];
    };

    const logout = () => {
        setAuth({ user: null, token: null });
    };

    useEffect(() => {
        // ensure axios has header if token exists on initial load
        if (auth?.token) axios.defaults.headers.common['Authorization'] = `Bearer ${auth.token}`;
        else delete axios.defaults.headers.common['Authorization'];
    }, []);

    return (
        <AuthContext.Provider value={{ auth, setAuth, logout }}>
            {children}
        </AuthContext.Provider>
    )
}

export default AuthContext;