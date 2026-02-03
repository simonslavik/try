import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSearch, FiFilter, FiUsers, FiBook, FiX } from 'react-icons/fi';
import HomePageHeader from '../../components/layout/Header';
import { AuthContext } from '../../context';

const categories = [
    'All',
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

const DiscoverBookClubs = () => {
    const { auth } = useContext(AuthContext);
    const navigate = useNavigate();
    
    const [bookClubs, setBookClubs] = useState([]);
    const [filteredBookClubs, setFilteredBookClubs] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [loading, setLoading] = useState(true);

    // Fetch all bookclubs
    useEffect(() => {
        const headers = auth?.token 
            ? { Authorization: `Bearer ${auth.token}` }
            : {};

        fetch('http://localhost:3000/v1/editor/bookclubs', { headers })
            .then(response => response.json())
            .then(data => {
                console.log('Fetched bookclubs:', data);
                setBookClubs(data.bookClubs || []);
                setFilteredBookClubs(data.bookClubs || []);
                setLoading(false);
            })
            .catch(error => {
                console.error('Error fetching book clubs:', error);
                setLoading(false);
            });
    }, [auth]);

    // Filter bookclubs based on search and category
    useEffect(() => {
        let filtered = [...bookClubs];

        // Filter by search query
        if (searchQuery.trim()) {
            filtered = filtered.filter(club =>
                club.name.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        // Filter by category
        if (selectedCategory !== 'All') {
            filtered = filtered.filter(club =>
                club.category === selectedCategory
            );
        }

        setFilteredBookClubs(filtered);
    }, [searchQuery, selectedCategory, bookClubs]);

    const handleClearSearch = () => {
        setSearchQuery('');
    };

    const handleCategoryClick = (category) => {
        setSelectedCategory(category);
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <HomePageHeader />
            
            <div className="pt-20 pb-12">
                {/* Hero Section */}
                <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white py-16">
                    <div className="max-w-7xl mx-auto px-6">
                        <h1 className="text-5xl font-display font-bold mb-4">Discover Book Clubs</h1>
                        <p className="text-xl text-white/90 font-outfit">Find your perfect reading community</p>
                    </div>
                </div>

                {/* Search and Filter Section */}
                <div className="max-w-7xl mx-auto px-6 -mt-8">
                    <div className="bg-white rounded-2xl shadow-xl p-6">
                        {/* Search Bar */}
                        <div className="relative mb-6">
                            <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-xl" />
                            <input
                                type="text"
                                placeholder="Search for book clubs..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-12 pr-12 py-4 border-2 border-gray-200 rounded-xl font-outfit focus:border-purple-500 focus:outline-none text-lg"
                            />
                            {searchQuery && (
                                <button
                                    onClick={handleClearSearch}
                                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    <FiX className="text-xl" />
                                </button>
                            )}
                        </div>

                        {/* Category Filter */}
                        <div>
                            <div className="flex items-center gap-2 mb-4">
                                <FiFilter className="text-gray-600" />
                                <h3 className="font-semibold text-gray-900 font-outfit">Filter by Category</h3>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {categories.map(category => (
                                    <button
                                        key={category}
                                        onClick={() => handleCategoryClick(category)}
                                        className={`px-4 py-2 rounded-full font-outfit text-sm transition-all ${
                                            selectedCategory === category
                                                ? 'bg-purple-600 text-white shadow-lg scale-105'
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                    >
                                        {category}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Results Section */}
                <div className="max-w-7xl mx-auto px-6 mt-8">
                    {/* Results Header */}
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold text-gray-900 font-display">
                            {filteredBookClubs.length} Book Club{filteredBookClubs.length !== 1 ? 's' : ''} Found
                        </h2>
                        {(searchQuery || selectedCategory !== 'All') && (
                            <button
                                onClick={() => {
                                    setSearchQuery('');
                                    setSelectedCategory('All');
                                }}
                                className="text-purple-600 hover:text-purple-700 font-outfit font-medium"
                            >
                                Clear All Filters
                            </button>
                        )}
                    </div>

                    {/* Loading State */}
                    {loading ? (
                        <div className="flex justify-center items-center py-20">
                            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600"></div>
                        </div>
                    ) : filteredBookClubs.length === 0 ? (
                        /* Empty State */
                        <div className="text-center py-20">
                            <div className="text-6xl mb-4">📚</div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-2 font-display">No Book Clubs Found</h3>
                            <p className="text-gray-600 mb-6 font-outfit">
                                {searchQuery || selectedCategory !== 'All'
                                    ? 'Try adjusting your search or filters'
                                    : 'Be the first to create a book club!'}
                            </p>
                            <button
                                onClick={() => navigate('/create-bookclub')}
                                className="px-6 py-3 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 transition-colors font-outfit"
                            >
                                Create a Book Club
                            </button>
                        </div>
                    ) : (
                        /* Book Clubs Grid */
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {filteredBookClubs.map(bookClub => (
                                <div
                                    key={bookClub.id}
                                    onClick={() => navigate(`/bookclubpage/${bookClub.id}`)}
                                    className="bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer overflow-hidden transform hover:scale-105 w-full h-[420px] flex flex-col"
                                >
                                    {/* Book Club Image */}
                                    <div className="relative h-48 bg-gradient-to-br from-purple-400 to-blue-400">
                                        <img
                                            src={bookClub.imageUrl ? `http://localhost:4000${bookClub.imageUrl}` : '/images/default.webp'}
                                            alt={bookClub.name}
                                            className="w-full h-full object-cover"
                                            onError={(e) => { e.target.src = '/images/default.webp'; }}
                                        />
                                        {bookClub.category && (
                                            <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-semibold text-purple-700 font-outfit">
                                                {bookClub.category}
                                            </div>
                                        )}
                                    </div>

                                    {/* Content */}
                                    <div className="p-5 flex-1 flex flex-col">
                                        <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2 font-display">
                                            {bookClub.name}
                                        </h3>

                                        {/* Current Book Preview */}
                                        {bookClub.currentBook && (
                                            <div className="mb-3 p-2 bg-purple-50 rounded-lg border border-purple-100">
                                                <p className="text-xs text-purple-600 font-semibold mb-1 font-outfit">📖 Currently Reading</p>
                                                <p className="text-xs text-gray-900 font-medium line-clamp-1 font-outfit">
                                                    {bookClub.currentBook.book?.title}
                                                </p>
                                            </div>
                                        )}

                                        {/* Stats */}
                                        <div className="mt-auto space-y-2">
                                            <div className="flex items-center gap-2 text-gray-600">
                                                <FiUsers className="text-purple-600" />
                                                <span className="text-sm font-outfit">
                                                    {bookClub.members?.length || 0} member{bookClub.members?.length !== 1 ? 's' : ''}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 text-gray-600">
                                                <FiBook className="text-blue-600" />
                                                <span className="text-sm font-outfit">
                                                    {(bookClub.completedBooksCount || 0)} book{bookClub.completedBooksCount !== 1 ? 's' : ''} completed
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="inline-block w-2 h-2 bg-green-500 rounded-full"></span>
                                                <span className="text-sm text-gray-600 font-outfit">
                                                    {bookClub.activeUsers || 0} online now
                                                </span>
                                            </div>
                                        </div>

                                        {/* Members Preview */}
                                        {bookClub.members && bookClub.members.length > 0 && (
                                            <div className="mt-3 pt-3 border-t border-gray-100">
                                                <div className="flex -space-x-2">
                                                    {bookClub.members.slice(0, 5).map(member => (
                                                        <img
                                                            key={member.id}
                                                            src={member.profileImage
                                                                ? `http://localhost:3001${member.profileImage}`
                                                                : '/images/default.webp'
                                                            }
                                                            alt={member.username}
                                                            className="w-8 h-8 rounded-full border-2 border-white object-cover"
                                                            title={member.username}
                                                            onError={(e) => { e.target.src = '/images/default.webp'; }}
                                                        />
                                                    ))}
                                                    {bookClub.members.length > 5 && (
                                                        <div className="w-8 h-8 rounded-full border-2 border-white bg-purple-100 flex items-center justify-center text-xs font-semibold text-purple-700">
                                                            +{bookClub.members.length - 5}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DiscoverBookClubs;
