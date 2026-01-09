import React, { useState, useContext } from 'react';
import axios from 'axios';
import { useNavigate } from "react-router-dom";
import AuthContext from '../../context';

const Register = () => {
    const navigate = useNavigate();
    const { setAuth } = useContext(AuthContext);
    const [form, setForm] = useState({ name: '', email: '', password: '' });
    const [errors, setErrors] = useState([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    const validate = () => {
        const errs = [];
        if (!form.name || form.name.trim().length < 3) errs.push('Name must be at least 3 characters');
        if (!form.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.push('Valid email is required');
        if (!form.password || form.password.length < 8) errs.push('Password must be at least 8 characters');
        return errs;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        // Clear previous messages/errors when user edits fields
        setMessage('');
        setErrors([]);
        setForm(prev => ({ ...prev, [name]: value }));
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
            const res = await axios.post('/v1/auth/register', form);
            // If registration returns token, auto-login then redirect
            const token = res?.data?.token || res?.data?.accessToken || res?.data?.data?.token;
            const user = res?.data?.user || res?.data?.data?.user || null;
            if (token) {
                setAuth({ token, user });
                // Redirect to the page they came from, or home
                const returnTo = location.state?.from || '/';
                navigate(returnTo);
                return;
            }
            setMessage(res.data?.message || 'Registered');
            setForm({ name: '', email: '', password: '' });
        } catch (err) {
            const respMsg = err?.response?.data?.message;
            const respErrors = err?.response?.data?.errors;
            if (respErrors && Array.isArray(respErrors)) setErrors(respErrors);
            else setMessage(respMsg || 'Registration failed');
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
                <div>
                    <div>
                    
                    <h2 className='font-semibold'>REGISTER USER</h2>


                    <form onSubmit={handleSubmit}>
                        <div className='p-3'>
                            <input name="name" value={form.name} onChange={handleChange} placeholder="username" style={{ width: '100%' }} />
                        </div>

                        <div className='p-3'>
                            <input name="email" value={form.email} onChange={handleChange} placeholder="email@example.com" style={{ width: '100%' }} />
                        </div>

                        <div className='p-3'>
                            <input name="password" type="password" value={form.password} onChange={handleChange} placeholder="choose a strong password" style={{ width: '100%' }} />
                        </div>

                        <button type="submit" disabled={loading} className='cursor-pointer border rounded hover:text-gray-500 font-semibold p-1 m-2'>
                            {loading ? 'creating...' : 'register'}
                        </button>
                    </form>
                    
                </div>
                <button className='cursor-pointer border rounded hover:text-gray-500 font-semibold p-1 m-2' onClick={() => navigate('/login')}>
                    Login here
                </button>
            </div>
        </div>
    );
};

export default Register;