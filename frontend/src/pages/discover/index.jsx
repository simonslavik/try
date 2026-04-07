import React, { useState, useEffect, useContext } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { FiSearch, FiFilter, FiUsers, FiBook, FiX, FiLock, FiUnlock, FiEyeOff, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import HomePageHeader from '@components/layout/Header';
import { AuthContext } from '@context/index';
import { bookclubAPI } from '@api/bookclub.api';
import JoinBookclubModal from '@components/common/modals/JoinBookclubModal';
import { getCollabImageUrl, getProfileImageUrl } from '@config/constants';
import apiClient from '@api/axios';
import logger from '@utils/logger';
import { DiscoverCardSkeleton } from '@components/common/Skeleton';
import EmptyState from '@components/common/EmptyState';
import { BOOKCLUB_CATEGORIES } from '@config/constants';

const categories = ['All', ...BOOKCLUB_CATEGORIES];

const DiscoverBookClubs = () => {
    const { auth } = useContext(AuthContext);
    const navigate = useNavigate();
    
    const [bookClubs, setBookClubs] = useState([]);
    const [filteredBookClubs, setFilteredBookClubs] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [loading, setLoading] = useState(true);
    const [showJoinModal, setShowJoinModal] = useState(false);
    const [selectedBookclub, setSelectedBookclub] = useState(null);
    const [cardBookIndex, setCardBookIndex] = useState({});
    const [friends, setFriends] = useState([]);
    const [hoveredMember, setHoveredMember] = useState(null);

    // Fetch friends list
    useEffect(() => {
        const fetchFriends = async () => {
            if (!auth?.token) return;
            try {
                const response = await apiClient.get('/v1/friends/list');
                setFriends(response.data?.data || []);
            } catch (err) {
                logger.error('Error fetching friends:', err);
            }
        };
        fetchFriends();
    }, [auth?.token]);

    // Fetch all bookclubs
    useEffect(() => {
        const fetchBookclubs = async () => {
            try {
                const response = await bookclubAPI.discoverBookclubs(
                    selectedCategory === 'All' ? undefined : selectedCategory
                );
                
                logger.debug('Fetched bookclubs:', response);
                const clubs = response.data || [];

                // Fetch current books for all clubs in batch
                let clubsWithBooks = clubs;
                try {
                    const clubIds = clubs.map(c => c.id);
                    if (clubIds.length > 0) {
                        const booksRes = await apiClient.post('/v1/bookclub/batch-current-books', { bookClubIds: clubIds });
                        if (booksRes.data?.success && Array.isArray(booksRes.data.currentBooks)) {
                            const booksMap = new Map(
                                booksRes.data.currentBooks.map(b => [b.bookClubId, b.currentBooks || []])
                            );
                            clubsWithBooks = clubs.map(club => ({
                                ...club,
                                currentBooks: booksMap.get(club.id) || [],
                            }));
                        }
                    }
                } catch (err) {
                    logger.error('Error fetching batch current books:', err);
                }

                setBookClubs(clubsWithBooks);
                setFilteredBookClubs(clubsWithBooks);
            } catch (error) {
                logger.error('Error fetching book clubs:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchBookclubs();
    }, [selectedCategory]);

    // Filter bookclubs based on search query only (category filtering happens in API call)
    useEffect(() => {
        let filtered = [...bookClubs];

        // Filter by search query
        if (searchQuery.trim()) {
            filtered = filtered.filter(club =>
                club.name.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        setFilteredBookClubs(filtered);
    }, [searchQuery, bookClubs]);

    const handleClearSearch = () => {
        setSearchQuery('');
    };

    const handleCategoryClick = (category) => {
        setSelectedCategory(category);
    };

    const handleBookclubClick = (bookClub, e) => {
        e.stopPropagation();
        
        // Always navigate to bookclub page (preview/info page)
        navigate(`/bookclubpage/${bookClub.id}`);
    };

    const handleJoinSuccess = async (memberData) => {
        // Refresh bookclubs list
        try {
            const response = await bookclubAPI.discoverBookclubs(
                selectedCategory === 'All' ? undefined : selectedCategory
            );
            const clubs = response.data || [];
            setBookClubs(clubs);
            setFilteredBookClubs(clubs);
        } catch (error) {
            logger.error('Error refreshing book clubs:', error);
        }
        
        // Navigate to club
        if (selectedBookclub) {
            navigate(`/bookclub/${selectedBookclub.id}`);
        }
    };

    const getVisibilityIcon = (visibility) => {
        switch (visibility) {
            case 'PUBLIC':
                return <FiUnlock className="w-4 h-4" />;
            case 'PRIVATE':
                return <FiLock className="w-4 h-4" />;
            case 'INVITE_ONLY':
                return <FiEyeOff className="w-4 h-4" />;
            default:
                return <FiUnlock className="w-4 h-4" />;
        }
    };

    const getVisibilityColor = (visibility) => {
        switch (visibility) {
            case 'PUBLIC':
                return 'bg-green-100 text-green-700';
            case 'PRIVATE':
                return 'bg-yellow-100 text-yellow-700';
            case 'INVITE_ONLY':
                return 'bg-stone-100 text-stone-800';
            default:
                return 'bg-gray-100 text-gray-700';
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
            <HomePageHeader />
            
            <div className="pb-12">
                {/* Hero Section */}
                <div className="text-white py-8 md:py-16">
                    <div className="max-w-7xl mx-auto px-4 md:px-6">
                        <h1 className="text-3xl md:text-5xl font-display font-bold mb-2 md:mb-4 text-black dark:text-white">Discover Book Clubs</h1>
                        <p className="text-base md:text-xl text-black/90 dark:text-gray-300 font-outfit">Find your perfect reading community</p>
                    </div>
                </div>

                {/* Search and Filter Section */}
                <div className="max-w-7xl mx-auto px-4 md:px-6 -mt-4 md:-mt-8">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-4 md:p-6">
                        {/* Search Bar */}
                        <div className="relative mb-6">
                            <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-xl" />
                            <input
                                type="text"
                                placeholder="Search for book clubs..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-12 pr-12 py-4 border-2 border-gray-200 dark:border-gray-600 rounded-xl font-outfit focus:border-stone-500 focus:outline-none text-lg bg-white dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-400"
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
                                <FiFilter className="text-gray-600 dark:text-gray-400" />
                                <h3 className="font-semibold text-gray-900 dark:text-gray-100 font-outfit">Filter by Category</h3>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {categories.map(category => (
                                    <button
                                        key={category}
                                        onClick={() => handleCategoryClick(category)}
                                        className={`px-4 py-2 rounded-full font-outfit text-sm transition-all ${
                                            selectedCategory === category
                                                ? 'bg-stone-700 text-white shadow-lg scale-105'
                                                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
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
                <div className="max-w-7xl mx-auto px-4 md:px-6 mt-6 md:mt-8">
                    {/* Results Header */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-4 md:mb-6">
                        <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100 font-display">
                            {filteredBookClubs.length} Book Club{filteredBookClubs.length !== 1 ? 's' : ''} Found
                        </h2>
                        {(searchQuery || selectedCategory !== 'All') && (
                            <button
                                onClick={() => {
                                    setSearchQuery('');
                                    setSelectedCategory('All');
                                }}
                                className="text-stone-700 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-300 font-outfit font-medium"
                            >
                                Clear All Filters
                            </button>
                        )}
                    </div>

                    {/* Loading State */}
                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {[...Array(8)].map((_, i) => (
                                <DiscoverCardSkeleton key={i} />
                            ))}
                        </div>
                    ) : filteredBookClubs.length === 0 ? (
                        <EmptyState
                            preset={searchQuery || selectedCategory !== 'All' ? 'no-results' : 'no-clubs'}
                            description={
                                searchQuery || selectedCategory !== 'All'
                                    ? 'Try adjusting your search or filters'
                                    : 'Be the first to create a book club!'
                            }
                            actionLabel="Create a Book Club"
                            actionPath="/create-bookclub"
                        />
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {filteredBookClubs.map(bookClub => (
                                <div
                                    key={bookClub.id}
                                    onClick={(e) => handleBookclubClick(bookClub, e)}
                                    className="bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer overflow-hidden transform hover:scale-105 w-full h-[420px] flex flex-col"
                                >
                                    {/* Book Club Image */}
                                    <div className="relative h-48 bg-gradient-to-br from-stone-500 to-stone-600">
                                        <img
                                            src={bookClub.imageUrl ? getCollabImageUrl(bookClub.imageUrl) : '/images/default.webp'}
                                            alt={bookClub.name}
                                            className="w-full h-full object-cover"
                                            onError={(e) => { e.target.src = '/images/default.webp'; }}
                                        />
                                        <div className="absolute top-3 left-3 right-3 flex justify-between items-start">
                                            {bookClub.category && (
                                                <div className="bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-semibold text-stone-800 font-outfit">
                                                    {bookClub.category}
                                                </div>
                                            )}
                                            <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${getVisibilityColor(bookClub.visibility)}`}>
                                                {getVisibilityIcon(bookClub.visibility)}
                                                {bookClub.visibility}
                                            </div>
                                        </div>
                                        {bookClub.isMember && (
                                            <div className="absolute bottom-3 left-3 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                                                ✓ Member
                                            </div>
                                        )}
                                    </div>

                                    {/* Content */}
                                    <div className="p-5 flex-1 flex flex-col">
                                        <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2 font-display">
                                            {bookClub.name}
                                        </h3>

                                        {bookClub.description && (
                                            <p className="text-sm text-gray-600 mb-3 line-clamp-2 font-outfit">
                                                {bookClub.description}
                                            </p>
                                        )}

                                        {/* Currently Reading Books */}
                                        {bookClub.currentBooks && bookClub.currentBooks.length > 0 && (() => {
                                            const books = bookClub.currentBooks;
                                            const bookIdx = cardBookIndex[bookClub.id] || 0;
                                            const currentEntry = books[bookIdx] || books[0];
                                            const hasMultiple = books.length > 1;

                                            return (
                                                <div className="mb-3 p-2 bg-gray-50 rounded-lg border border-gray-100">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <p className="text-[10px] uppercase tracking-wider text-stone-600 font-bold font-outfit">Currently Reading</p>
                                                        {hasMultiple && (
                                                            <span className="text-[10px] text-stone-400 font-medium">{bookIdx + 1}/{books.length}</span>
                                                        )}
                                                    </div>
                                                    <div className="flex gap-2 items-center">
                                                        {hasMultiple && (
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setCardBookIndex(prev => ({
                                                                        ...prev,
                                                                        [bookClub.id]: (bookIdx - 1 + books.length) % books.length,
                                                                    }));
                                                                }}
                                                                className="flex-shrink-0 w-5 h-5 rounded-full bg-white border border-gray-200 flex items-center justify-center text-stone-500 hover:bg-stone-100 hover:text-stone-700 transition-colors"
                                                            >
                                                                <FiChevronLeft size={12} />
                                                            </button>
                                                        )}
                                                        <img
                                                            src={currentEntry.book?.coverUrl || '/images/default.webp'}
                                                            alt={currentEntry.book?.title}
                                                            className="w-9 h-12 object-cover rounded shadow-sm flex-shrink-0"
                                                            onError={(e) => { e.target.src = '/images/default.webp'; }}
                                                        />
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-xs font-semibold text-gray-800 line-clamp-2 leading-tight font-outfit">{currentEntry.book?.title}</p>
                                                            <p className="text-[11px] text-gray-500 truncate mt-0.5 font-outfit">{currentEntry.book?.author}</p>
                                                        </div>
                                                        {hasMultiple && (
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setCardBookIndex(prev => ({
                                                                        ...prev,
                                                                        [bookClub.id]: (bookIdx + 1) % books.length,
                                                                    }));
                                                                }}
                                                                className="flex-shrink-0 w-5 h-5 rounded-full bg-white border border-gray-200 flex items-center justify-center text-stone-500 hover:bg-stone-100 hover:text-stone-700 transition-colors"
                                                            >
                                                                <FiChevronRight size={12} />
                                                            </button>
                                                        )}
                                                    </div>
                                                    {hasMultiple && (
                                                        <div className="flex justify-center gap-1 mt-1.5">
                                                            {books.map((_, bi) => (
                                                                <button
                                                                    key={bi}
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setCardBookIndex(prev => ({ ...prev, [bookClub.id]: bi }));
                                                                    }}
                                                                    className={`rounded-full transition-all ${
                                                                        bi === bookIdx
                                                                            ? 'w-3 h-1.5 bg-stone-600'
                                                                            : 'w-1.5 h-1.5 bg-stone-300 hover:bg-stone-400'
                                                                    }`}
                                                                />
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })()}

                                        {/* Stats */}
                                        <div className="mt-auto space-y-2">
                                            {/* Member Avatars */}
                                            {bookClub.members && bookClub.members.length > 0 && (() => {
                                                const friendIds = new Set(friends.map(f => f.friendId || f.id));
                                                const sorted = [...bookClub.members].sort((a, b) => {
                                                    const aFriend = friendIds.has(a.id) ? 0 : 1;
                                                    const bFriend = friendIds.has(b.id) ? 0 : 1;
                                                    return aFriend - bFriend;
                                                });
                                                const shown = sorted.slice(0, 4);
                                                const remaining = bookClub.members.length - shown.length;

                                                return (
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex -space-x-2">
                                                            {shown.map(member => (
                                                                <div key={member.id} className="relative">
                                                                    <img
                                                                        src={getProfileImageUrl(member.profileImage) || '/images/default.webp'}
                                                                        alt={member.username}
                                                                        className={`w-7 h-7 rounded-full border-2 object-cover shadow-sm cursor-pointer hover:ring-2 hover:ring-stone-400 transition-all hover:z-10 relative ${
                                                                            friendIds.has(member.id) ? 'border-green-400' : 'border-white'
                                                                        }`}
                                                                        onClick={(e) => { e.stopPropagation(); navigate(`/profile/${member.id}`); }}
                                                                        onError={(e) => { e.target.src = '/images/default.webp'; }}
                                                                        onMouseEnter={(e) => {
                                                                            const rect = e.currentTarget.getBoundingClientRect();
                                                                            setHoveredMember({
                                                                                id: member.id,
                                                                                name: member.name || member.username,
                                                                                image: getProfileImageUrl(member.profileImage) || '/images/default.webp',
                                                                                isFriend: friendIds.has(member.id),
                                                                                x: rect.left + rect.width / 2,
                                                                                y: rect.top,
                                                                            });
                                                                        }}
                                                                        onMouseLeave={() => setHoveredMember(null)}
                                                                    />
                                                                </div>
                                                            ))}
                                                            {remaining > 0 && (
                                                                <div className="w-7 h-7 rounded-full border-2 border-white bg-stone-100 flex items-center justify-center text-[10px] font-bold text-stone-700">
                                                                    +{remaining}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <span className="text-xs text-gray-400 font-medium font-outfit">
                                                            {bookClub.memberCount || bookClub.members.length} {(bookClub.memberCount || bookClub.members.length) === 1 ? 'member' : 'members'}
                                                        </span>
                                                    </div>
                                                );
                                            })()}

                                            {(!bookClub.members || bookClub.members.length === 0) && (
                                                <div className="flex items-center gap-2 text-gray-600">
                                                    <FiUsers className="text-stone-700" />
                                                    <span className="text-sm font-outfit">
                                                        {bookClub.memberCount || 0} member{bookClub.memberCount !== 1 ? 's' : ''}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Join Modal */}
            <JoinBookclubModal
                isOpen={showJoinModal}
                onClose={() => setShowJoinModal(false)}
                bookclub={selectedBookclub}
                onJoinSuccess={handleJoinSuccess}
            />

            {/* Portal tooltip for member avatars */}
            {hoveredMember && createPortal(
                <div
                    className="fixed flex items-center gap-2 bg-gray-800 text-white text-xs rounded-lg px-3 py-2 shadow-xl whitespace-nowrap pointer-events-none"
                    style={{
                        zIndex: 99999,
                        left: hoveredMember.x,
                        top: hoveredMember.y - 10,
                        transform: 'translate(-50%, -100%)',
                    }}
                >
                    <img
                        src={hoveredMember.image}
                        alt={hoveredMember.name}
                        className="w-6 h-6 rounded-full object-cover"
                        onError={(e) => { e.target.src = '/images/default.webp'; }}
                    />
                    <span className="font-medium">{hoveredMember.name}</span>
                    {hoveredMember.isFriend && (
                        <span className="text-green-400 text-[10px]">★ Friend</span>
                    )}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-800 rotate-45 -mt-1"></div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default DiscoverBookClubs;
