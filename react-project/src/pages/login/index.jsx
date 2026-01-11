import React, { useState, useContext } from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from "react-router-dom";
import AuthContext from '../../context';

const Login = () => {

    const navigate = useNavigate();
    const location = useLocation();
    const { setAuth } = useContext(AuthContext);
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [errors, setErrors] = useState([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    const validate = () => {
        const errs = [];
        if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) errs.push('Valid email is required');
        if (!formData.password || formData.password.length < 8) errs.push('Password must be at least 8 characters');
        return errs;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        // Clear previous errors/messages while the user edits
        setMessage('');
        setErrors([]);
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        const v = validate();
        if (v.length) {
            setErrors(v);
            return;
        }
        setErrors([]);
        setLoading(true);
        try {
            const res = await axios.post('/v1/auth/login', formData);
            
            // Extract token, refreshToken, and user from response
            const accessToken = res?.data?.accessToken || res?.data?.token;
            const refreshToken = res?.data?.refreshToken;
            const user = res?.data?.user;
            
            console.log('Login response:', res.data);
            console.log('User data:', user);
            
            if (accessToken && user) {
                setAuth({ 
                    token: accessToken,
                    refreshToken: refreshToken,
                    user: user
                });
                
                // Redirect to the page they came from, or home
                const returnTo = location.state?.from || '/';
                navigate(returnTo);
                return;
            }
            setMessage(res.data?.message || 'Logged in');
            setFormData({ email: '', password: '' });
        } catch (err) {
            const respMsg = err?.response?.data?.message;
            const respErrors = err?.response?.data?.errors;
            if (respErrors && Array.isArray(respErrors)) setErrors(respErrors);
            else setErrors([respMsg || 'Login failed']);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className='flex flex-col items-center justify-center min-h-screen bg-gray-100'>

            {/* Global error list */}
                {errors && errors.length > 0 && (
                        <div role="alert" style={{ background: '#fee', color: '#900', padding: 12, borderRadius: 6, marginBottom: 12 }}>
                            <strong style={{ display: 'block', marginBottom: 6 }}>Please fix the following:</strong>
                            <ul style={{ margin: 0, paddingLeft: 18 }}>
                                {errors.map((err, i) => (
                                    <li key={i}>{err}</li>
                                ))}
                            </ul>
                        </div>
                )}
                {/* Informational / success message */}
                {message && (
                    <div role="status" style={{ background: '#efe', color: '#060', padding: 12, borderRadius: 6, marginBottom: 12 }}>
                        {message}
                    </div>
                )}
            <div className="">
                <h2>LOGIN USER</h2>
                <form onSubmit={handleSubmit}>
                    <div>
                        <input name="email" placeholder="email" className="p-2" value={formData.email} onChange={handleChange} />
                    </div>
                    <div>
                        <input name="password" type="password" placeholder="password" className="p-2" value={formData.password} onChange={handleChange} />
                    </div>
                    <button type="submit" disabled={loading} className='cursor-pointer border rounded hover:text-gray-500 font-semibold p-2 m-2'>
                            {loading ? 'logging in...' : 'Login'}
                    </button>
                </form>

                <p>
                    Don't have an account? 
                </p>
                <button className='cursor-pointer border rounded hover:text-gray-500 font-semibold p-1 m-2' onClick={() => navigate('/register')}>
                    Register here
                </button>
            </div>
        </div>
    );
};

export default Login;