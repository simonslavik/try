import React, { useContext, useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../../context';
import { FiImage, FiX, FiTrash2, FiUser } from 'react-icons/fi';

const ChangeProfilePage = () => {
    const { auth, setAuth } = useContext(AuthContext);
    const navigate = useNavigate();
    const fileInputRef = useRef(null);

    const [form, setForm] = useState({
        name: ''
    });
    const [selectedImage, setSelectedImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [currentProfileImage, setCurrentProfileImage] = useState(null);
    const [loading, setLoading] = useState(false);
    const [fetchingProfile, setFetchingProfile] = useState(true);
    const [error, setError] = useState('');
    const [deleteImage, setDeleteImage] = useState(false);

    // Fetch current profile data
    useEffect(() => {
        const fetchProfile = async () => {
            if (!auth?.token) {
                navigate('/login');
                return;
            }

            try {
                const response = await axios.get('http://localhost:3000/v1/profile', {
                    headers: {
                        'Authorization': `Bearer ${auth.token}`
                    }
                });

                const userData = response.data.data;
                setForm({ name: userData.name });
                if (userData.profileImage) {
                    setCurrentProfileImage(userData.profileImage); // Store just the path
                    setImagePreview(`http://localhost:3001${userData.profileImage}`); // Display with full URL
                }
            } catch (err) {
                console.error('Error fetching profile:', err);
                setError('Failed to load profile data');
            } finally {
                setFetchingProfile(false);
            }
        };

        fetchProfile();
    }, [auth, navigate]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setForm(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleImageSelect = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedImage(file);
            setDeleteImage(false);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const removeImage = () => {
        setSelectedImage(null);
        setImagePreview(null);
        setDeleteImage(true);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!auth?.token) {
            setError('Please login to change profile');
            navigate('/login');
            return;
        }

        if (!form.name.trim()) {
            setError('Name is required');
            return;
        }

        setLoading(true);
        setError('');

        try {
            // Update user name
            const profileResponse = await axios.put(
                'http://localhost:3000/v1/profile',
                { name: form.name.trim() },
                {
                    headers: {
                        'Authorization': `Bearer ${auth.token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            let updatedImageUrl = currentProfileImage;

            // Delete image if requested
            if (deleteImage && currentProfileImage) {
                await axios.delete(
                    'http://localhost:3000/v1/profile/image',
                    {
                        headers: {
                            'Authorization': `Bearer ${auth.token}`
                        }
                    }
                );
                updatedImageUrl = null;
            }

            // Upload new profile image if selected
            if (selectedImage) {
                const formData = new FormData();
                formData.append('image', selectedImage);

                const imageResponse = await axios.post(
                    'http://localhost:3000/v1/profile/image',
                    formData,
                    {
                        headers: {
                            'Authorization': `Bearer ${auth.token}`,
                            'Content-Type': 'multipart/form-data'
                        }
                    }
                );
                // Store just the path, not the full URL
                updatedImageUrl = imageResponse.data.imageUrl;
            }

            // Update auth context with new user data
            setAuth({
                user: {
                    ...auth.user,
                    name: form.name.trim(),
                    profileImage: updatedImageUrl
                },
                token: auth.token,
                refreshToken: auth.refreshToken
            });

            // Redirect to home
            navigate('/');
        } catch (err) {
            console.error('Error changing profile:', err);
            setError(err.response?.data?.error || err.response?.data?.message || 'Failed to change profile. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (fetchingProfile) {
        return (
            <div className='flex items-center justify-center min-h-screen bg-gray-100'>
                <div className="text-gray-600 text-lg">Loading profile...</div>
            </div>
        );
    }

    return (
        <div className='flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4'>
            <div className="w-full max-w-md bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-center mb-6">
                    <h2 className='text-2xl font-bold text-gray-800'>Change Profile</h2>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Image Upload */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Profile Picture
                        </label>
                        
                        <div className="flex flex-col items-center">
                            {imagePreview ? (
                                <div className="relative mb-4">
                                    <img 
                                        src={imagePreview} 
                                        alt="Profile Preview" 
                                        className="w-32 h-32 rounded-full object-cover border-4 border-purple-200"
                                        onError={(e) => { e.target.src = '/images/default-avatar.png'; }}
                                    />
                                    <button
                                        type="button"
                                        onClick={removeImage}
                                        className="absolute top-0 right-0 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-lg"
                                        title="Remove image"
                                    >
                                        <FiX size={16} />
                                    </button>
                                </div>
                            ) : (
                                <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center mb-4 border-4 border-gray-300">
                                    <FiUser className="text-6xl text-gray-400" />
                                </div>
                            )}
                            
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors font-medium"
                            >
                                <FiImage className="inline mr-2" />
                                {imagePreview ? 'Change Picture' : 'Upload Picture'}
                            </button>
                            <span className="text-xs text-gray-400 mt-2">PNG, JPG, GIF, WEBP up to 5MB</span>
                        </div>
                        
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleImageSelect}
                            className="hidden"
                        />
                    </div>
                    
                    {/* Username */}
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                            Username
                        </label>
                        <input
                            id="name"
                            name="name"
                            type="text"
                            value={form.name}
                            onChange={handleChange}
                            placeholder="Enter your name"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                            required
                        />
                    </div>

                    

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={loading || !form.name.trim()}
                        className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                    >
                        {loading ? 'Changing...' : 'Change Profile'}
                    </button>
                </form>

                <div className="mt-4 text-center">
                    <button
                        onClick={() => navigate('/')}
                        className="text-sm text-purple-600 hover:text-purple-800"
                    >
                        Cancel and go back
                    </button>
                </div>
            </div>
        </div>
    );
}   

export default ChangeProfilePage;
