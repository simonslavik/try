import React, { useContext, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../../context';
import { FiImage, FiX, FiHome } from 'react-icons/fi';

const categories = [
    'General',
    'Fiction',
    'Non-Fiction',
    'Mystery',
    'Romance',
    'Science Fiction',
    'Fantasy',
    'Thriller',
    'Biography',
    'Self-Help',
    'History',
    'Poetry',
    'Young Adult',
    'Classic Literature',
    'Horror',
    'Philosophy'
];

const NewBookClubPage = () => {
    const { auth } = useContext(AuthContext);
    const navigate = useNavigate();
    const fileInputRef = useRef(null);

    const [form, setForm] = useState({
        name: '',
        category: 'General',
        isPublic: true
    });
    const [selectedImage, setSelectedImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

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
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!auth?.token) {
            setError('Please login to create a book club');
            return;
        }

        if (!form.name.trim()) {
            setError('Book club name is required');
            return;
        }

        setLoading(true);
        setError('');

        try {
            // Create bookclub
            const response = await axios.post('http://localhost:3000/v1/editor/bookclubs', {
                name: form.name.trim(),
                category: form.category,
                isPublic: form.isPublic,
            });

            const bookClubId = response.data.bookClub.id;
            console.log('Created Bookclub:', bookClubId);

            // Upload image if selected
            if (selectedImage) {
                const formData = new FormData();
                formData.append('image', selectedImage);

                await axios.post(
                    `http://localhost:3000/v1/editor/bookclubs/${bookClubId}/image`,
                    formData,
                    {
                        headers: {
                            'Content-Type': 'multipart/form-data'
                        }
                    }
                );
            }

            // Redirect to the new bookclub
            navigate(`/bookclub/${bookClubId}`);
        } catch (err) {
            console.error('Error creating book club:', err);
            setError(err.response?.data?.error || 'Failed to create book club. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className='flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4'>
            <div className="w-full max-w-md bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-center mb-6">
                    <h2 className='text-2xl font-bold text-gray-800'>Create Book Club</h2>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Book Club Name */}
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                            Book Club Name *
                        </label>
                        <input
                            id="name"
                            name="name"
                            type="text"
                            value={form.name}
                            onChange={handleChange}
                            placeholder="Enter book club name"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                            required
                        />
                    </div>

                    {/* Category Selection */}
                    <div>
                        <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                            Category *
                        </label>
                        <select
                            id="category"
                            name="category"
                            value={form.category}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                            required
                        >
                            {categories.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>

                    {/* 
                    {/* Public/Private Toggle */}
                    <div className="flex items-center">
                        <input
                            id="isPublic"
                            name="isPublic"
                            type="checkbox"
                            checked={form.isPublic}
                            onChange={handleChange}
                            className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                        />
                        <label htmlFor="isPublic" className="ml-2 block text-sm text-gray-700">
                            Make this book club public
                        </label>
                    </div>

                    {/* Image Upload */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Book Club Cover Image (Optional)
                        </label>
                        
                        {imagePreview ? (
                            <div className="relative">
                                <img 
                                    src={imagePreview} 
                                    alt="Preview" 
                                    className="w-full h-48 object-cover rounded-lg"
                                />
                                <button
                                    type="button"
                                    onClick={removeImage}
                                    className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600"
                                >
                                    <FiX />
                                </button>
                            </div>
                        ) : (
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="w-full h-48 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center hover:border-purple-500 hover:bg-purple-50 transition-colors"
                            >
                                <FiImage className="text-4xl text-gray-400 mb-2" />
                                <span className="text-sm text-gray-600">Click to upload image</span>
                                <span className="text-xs text-gray-400 mt-1">PNG, JPG, GIF up to 5MB</span>
                            </button>
                        )}
                        
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleImageSelect}
                            className="hidden"
                        />
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={loading || !form.name.trim()}
                        className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                    >
                        {loading ? 'Creating...' : 'Create Book Club'}
                    </button>
                </form>

                <div className="mt-4 text-center">
                    <button
                        onClick={() => navigate(-1)}
                        className="text-sm text-purple-600 hover:text-purple-800"
                    >
                        Cancel and go back
                    </button>
                </div>
            </div>
        </div>
    );
}   

export default NewBookClubPage;
