import { createContext, useState, useEffect } from "react";
import axios from 'axios';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
    // initialize from localStorage so auth persists across refresh
    const [auth, setAuthState] = useState(() => {
        try {
            const raw = localStorage.getItem('auth');
            return raw ? JSON.parse(raw) : { user: null, token: null, refreshToken: null };
        } catch (e) {
            return { user: null, token: null, refreshToken: null };
        }
    });

    // helper to set auth both in state and localStorage
    const setAuth = (payload) => {
        const next = {
            user: payload?.user || null,
            token: payload?.token || null,
            refreshToken: payload?.refreshToken || null,
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
        setAuth({ user: null, token: null, refreshToken: null });
    };

    useEffect(() => {
        // ensure axios has header if token exists on initial load
        if (auth?.token) axios.defaults.headers.common['Authorization'] = `Bearer ${auth.token}`;
        else delete axios.defaults.headers.common['Authorization'];

        // Axios interceptor for automatic token refresh
        const interceptor = axios.interceptors.response.use(
            (response) => response, // Pass through successful responses
            async (error) => {
                const originalRequest = error.config;

                // If 401 error and we have a refresh token, try to refresh
                if (error.response?.status === 401 && auth?.refreshToken && !originalRequest._retry) {
                    originalRequest._retry = true;

                    try {
                        const { data } = await axios.post('http://localhost:3000/v1/auth/refresh', {
                            refreshToken: auth.refreshToken
                        });

                        // Update auth with new tokens
                        setAuth({
                            user: auth.user,
                            token: data.accessToken,
                            refreshToken: data.refreshToken
                        });

                        // Retry original request with new token
                        originalRequest.headers['Authorization'] = `Bearer ${data.accessToken}`;
                        return axios(originalRequest);
                    } catch (refreshError) {
                        // Refresh failed, logout user
                        console.error('Token refresh failed:', refreshError);
                        setAuth({ user: null, token: null, refreshToken: null });
                        return Promise.reject(refreshError);
                    }
                }

                return Promise.reject(error);
            }
        );

        // Cleanup interceptor on unmount
        return () => {
            axios.interceptors.response.eject(interceptor);
        };
    }, [auth]);

    return (
        <AuthContext.Provider value={{ auth, setAuth, logout }}>
            {children}
        </AuthContext.Provider>
    )
}

export default AuthContext;