
import React, { useState, useEffect, useContext, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AuthContext from '../../../context';
import HomePageHeader from '../../../components/HomePageHeader';
import { FiCornerRightDown, FiMail, FiMessageCircle } from 'react-icons/fi';
import BookSearch from '../../../components/SearchBookComponent';

const ProfilePage = () => {
  const { id } = useParams();
  const { auth, setAuth } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [profile, setProfile] = useState(null);
  const [createdBookClubs, setCreatedBookClubs] = useState([]);
  const [memberBookClubs, setMemberBookClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [friendRequestLoading, setFriendRequestLoading] = useState(false);
  
  // Image upload states
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef(null);
  
  const isOwnProfile = auth?.user?.id === id;


  // Books
  const GATEWAY_URL = 'http://localhost:3000';
  const [favoriteBooks, setFavoriteBooks] = useState([]);
  const [booksImReading, setBooksImReading] = useState([]);
  const [booksToRead, setBooksToRead] = useState([]);
  const [booksRead, setBooksRead] = useState([]);





  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        setLoading(true);
        
        // Fetch user profile with optional auth for friendship status
        const headers = auth?.token 
          ? { Authorization: `Bearer ${auth.token}` }
          : {};
          
        const profileResponse = await fetch(`http://localhost:3000/v1/profile/${id}`, { headers });
        const profileData = await profileResponse.json();
        
        if (profileResponse.ok && profileData.success) {
          setProfile(profileData.data);
        } else {
          setError('Failed to load profile');
          return;
        }
        
        // Fetch user's created bookclubs
        const createdBookClubsResponse = await fetch(`http://localhost:3000/v1/editor/users/${id}/bookclubs`, { headers });
        const createdBookClubsData = await createdBookClubsResponse.json();
        
        if (createdBookClubsResponse.ok) {
          setCreatedBookClubs(createdBookClubsData.bookClubs || []);
        }
        
        // Fetch all bookclubs and filter for ones where user is a member
        const allBookClubsResponse = await fetch('http://localhost:3000/v1/editor/bookclubs', { headers });
        const allBookClubsData = await allBookClubsResponse.json();
        
        if (allBookClubsResponse.ok) {
          // Filter bookclubs where this user is a member (but not creator to avoid duplicates)
          const memberClubs = (allBookClubsData.bookClubs || []).filter(club => {
            const isMember = club.members.some(member => 
              typeof member === 'string' ? member === id : member.id === id
            );
            const isCreator = club.creatorId === id;
            return isMember && !isCreator; // Only show if member but not creator
          });
          setMemberBookClubs(memberClubs);
        }

        const favoriteBooksResponse = await fetch(`${GATEWAY_URL}/v1/user-books?status=favorite`, {
          headers: auth?.token ? { Authorization: `Bearer ${auth.token}` } : {}
        });
        const data2 = await favoriteBooksResponse.json();
        
        if (data2.success) {
          setFavoriteBooks(data2.data || []);
        } 

        const booksImReadingResponse = await fetch(`${GATEWAY_URL}/v1/user-books?status=reading`, {
          headers: auth?.token ? { Authorization: `Bearer ${auth.token}` } : {}
        });
        const data3 = await booksImReadingResponse.json();
        
        if (data3.success) {
          setBooksImReading(data3.data || []);
        } 

        const booksToReadResponse = await fetch(`${GATEWAY_URL}/v1/user-books?status=want_to_read`, {
          headers: auth?.token ? { Authorization: `Bearer ${auth.token}` } : {}
        });
        const data4 = await booksToReadResponse.json();
        
        if (data4.success) {
          setBooksToRead(data4.data || []);
        } 

        const booksReadResponse = await fetch(`${GATEWAY_URL}/v1/user-books?status=completed`, {
          headers: auth?.token ? { Authorization: `Bearer ${auth.token}` } : {}
        });
        const data5 = await booksReadResponse.json();
        
        if (data5.success) {
          setBooksRead(data5.data || []);
        } 
        
      } catch (err) {
        console.error('Error fetching profile:', err);
        setError('Failed to load profile data');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchProfileData();
    }
  }, [id, auth]);

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
      // Automatically upload the image
      uploadImage(file);
    }
  };

  const uploadImage = async (file) => {
    if (!auth?.token) {
      alert('Please login to change profile picture');
      return;
    }

    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('http://localhost:3000/v1/profile/image', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${auth.token}`
        },
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        // Update profile state
        setProfile(prev => ({
          ...prev,
          profileImage: data.imageUrl
        }));
        // Update auth context only if user exists and this is own profile
        if (auth?.user && isOwnProfile) {
          setAuth({
            user: {
              ...auth.user,
              profileImage: data.imageUrl
            },
            token: auth.token,
            refreshToken: auth.refreshToken
          });
        }
        // Reset selection
        setSelectedImage(null);
        setImagePreview(null);
      } else {
        const errorData = await response.json();
        alert(errorData.message || 'Failed to upload image');
      }
    } catch (err) {
      console.error('Error uploading image:', err);
      alert('Failed to upload image');
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  if (loading) {
    return (
      <div>
        <HomePageHeader />
        <div className="flex items-center justify-center h-screen">
          <div className="text-xl text-gray-600">Loading profile...</div>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div>
        <HomePageHeader />
        <div className="flex flex-col items-center justify-center h-screen">
          <div className="text-xl text-red-500 mb-4">{error || 'Profile not found'}</div>
          <button 
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  const joinDate = new Date(profile.createdAt).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric'
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <HomePageHeader />
      
      <div className="max-w-6xl mx-auto p-8">
        {/* Profile Header */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-6">
          <div className="flex items-start gap-6">
            {/* Profile Image */}
            <div className="relative">
              <img 
                src={imagePreview || (profile.profileImage 
                  ? `http://localhost:3001${profile.profileImage}` 
                  : '/images/default.webp')
                }
                alt={profile.name}
                className={`w-32 h-32 rounded-full object-cover border-4 border-purple-200 ${
                  isOwnProfile ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''
                }`}
                onClick={() => isOwnProfile && fileInputRef.current?.click()}
                onError={(e) => { e.target.src = '/images/default.webp'; }}
              />
              {uploadingImage && (
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full">
                  <div className="text-white text-sm">Uploading...</div>
                </div>
              )}
              {isOwnProfile && (
                <>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                </>
              )}
            </div>
            {/* Profile Info */}
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">{profile.name}</h1>
                  <p className="text-gray-600 mt-1">{profile.email}</p>
                </div>
                
                {isOwnProfile && (
                  <button
                    onClick={() => navigate('/change-profile')}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    Edit Profile
                  </button>
                )}
                {!isOwnProfile && (
                  <div className="flex items-center gap-3">
                    {profile.friendshipStatus === 'friends' ? (
                      <>
                        <button
                          onClick={() => navigate(`/messages/${id}`)}
                          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                        >
                          Message
                        </button>
                        <button
                          className="px-4 py-2 bg-gray-500 text-white rounded-lg cursor-not-allowed"
                          disabled
                        >
                          Friends
                        </button>
                      </>
                    ) : profile.friendshipStatus === 'request_sent' ? (
                      <button
                        className="px-4 py-2 bg-yellow-500 text-white rounded-lg cursor-not-allowed"
                        disabled
                      >
                        Request Pending
                      </button>
                    ) : profile.friendshipStatus === 'request_received' ? (
                      <button
                        onClick={() => navigate('/')}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                      >
                        Respond to Request
                      </button>
                    ) : (
                      <button
                        onClick={async () => {
                          if (!auth?.token) {
                            navigate('/login');
                            return;
                          }
                          
                          setFriendRequestLoading(true);
                          try {
                            const response = await fetch('http://localhost:3000/v1/friends/request', {
                              method: 'POST',
                              headers: {
                                'Content-Type': 'application/json',
                                Authorization: `Bearer ${auth.token}`
                              },
                              body: JSON.stringify({ recipientId: id })
                            });
                            
                            if (response.ok) {
                              setProfile(prev => ({ ...prev, friendshipStatus: 'request_sent' }));
                            } else {
                              const data = await response.json();
                              alert(data.message || 'Failed to send friend request');
                            }
                          } catch (err) {
                            console.error('Error sending friend request:', err);
                            alert('Failed to send friend request');
                          } finally {
                            setFriendRequestLoading(false);
                          }
                        }}
                        disabled={friendRequestLoading}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                      >
                        {friendRequestLoading ? 'Sending...' : 'Add Friend'}
                      </button>
                    )}
                  </div>
                )}
              </div>
              
              <div className="mt-6 flex gap-8">
                <div>
                  <div className="text-2xl font-bold text-purple-600">{createdBookClubs.length + memberBookClubs.length}</div>
                  <div className="text-sm text-gray-600">Book Clubs</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-600">
                    {profile.numberOfFriends || 0}
                  </div>
                  <div className="text-sm text-gray-600">Friends</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-600">{joinDate}</div>
                  <div className="text-sm text-gray-600">Member Since</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Created Book Clubs Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            {isOwnProfile ? 'My Created Book Clubs' : `Book Clubs by ${profile.name}`}
          </h2>
          
          {createdBookClubs.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-lg mb-4">
                {isOwnProfile ? "You haven't created any book clubs yet" : "No book clubs created yet"}
              </div>
              {isOwnProfile && (
                <button
                  onClick={() => navigate('/create-bookclub')}
                  className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Create Your First Book Club
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {createdBookClubs.map(club => (
                <div
                  key={club.id}
                  onClick={() => navigate(`/bookclub/${club.id}`)}
                  className="border rounded-lg p-4 hover:shadow-lg cursor-pointer transition-shadow"
                >
                  <img 
                    src={club.imageUrl 
                      ? `http://localhost:4000${club.imageUrl}` 
                      : '/images/default.webp'
                    }
                    alt={club.name}
                    className="w-full h-40 object-cover rounded-lg mb-3"
                    onError={(e) => { e.target.src = '/images/default.webp'; }}
                  />
                  <h3 className="font-semibold text-lg truncate mb-2">{club.name}</h3>
                  
                  {/* Current Book */}
                  {club.currentBook && (
                    <div className="mt-2 mb-2 p-2 bg-purple-50 rounded border border-purple-200">
                      <p className="text-xs text-purple-600 font-semibold mb-1">📖 Currently Reading</p>
                      <div className="flex gap-2">
                        <img 
                          src={club.currentBook.book?.coverUrl || '/images/default.webp'}
                          alt={club.currentBook.book?.title}
                          className="w-12 h-16 object-cover rounded"
                          onError={(e) => { e.target.src = '/images/default.webp'; }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-gray-900 line-clamp-2">{club.currentBook.book?.title}</p>
                          <p className="text-xs text-gray-600 truncate">{club.currentBook.book?.author}</p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>{club.memberCount || club.members?.length || 0} members</span>
                    {club.activeUsers > 0 && (
                      <span className="text-green-600">{club.activeUsers} online</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Member Book Clubs Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            {isOwnProfile ? 'Book Clubs I\'m In' : `${profile.name} is a member of`}
          </h2>
          
          {memberBookClubs.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-lg mb-4">
                {isOwnProfile ? "You haven't joined any book clubs yet" : "Not a member of any book clubs"}
              </div>
              {isOwnProfile && (
                <button
                  onClick={() => navigate('/')}
                  className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Browse Book Clubs
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {memberBookClubs.map(club => (
                <div
                  key={club.id}
                  onClick={() => navigate(`/bookclub/${club.id}`)}
                  className="border rounded-lg p-4 hover:shadow-lg cursor-pointer transition-shadow"
                >
                  <img 
                    src={club.imageUrl 
                      ? `http://localhost:4000${club.imageUrl}` 
                      : '/images/default.webp'
                    }
                    alt={club.name}
                    className="w-full h-40 object-cover rounded-lg mb-3"
                    onError={(e) => { e.target.src = '/images/default.webp'; }}
                  />
                  <h3 className="font-semibold text-lg truncate mb-2">{club.name}</h3>
                  
                  {/* Current Book */}
                  {club.currentBook && (
                    <div className="mt-2 mb-2 p-2 bg-purple-50 rounded border border-purple-200">
                      <p className="text-xs text-purple-600 font-semibold mb-1">📖 Currently Reading</p>
                      <div className="flex gap-2">
                        <img 
                          src={club.currentBook.book?.coverUrl || '/images/default.webp'}
                          alt={club.currentBook.book?.title}
                          className="w-12 h-16 object-cover rounded"
                          onError={(e) => { e.target.src = '/images/default.webp'; }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-gray-900 line-clamp-2">{club.currentBook.book?.title}</p>
                          <p className="text-xs text-gray-600 truncate">{club.currentBook.book?.author}</p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {club.members && club.members.length > 0 && (
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex -space-x-2">
                        {club.members.slice(0, 3).map((member, idx) => (
                          <img 
                            key={idx}
                            src={member.profileImage 
                              ? `http://localhost:3001${member.profileImage}` 
                              : '/images/default.webp'
                            }
                            alt=""
                            className="w-6 h-6 rounded-full border-2 border-white object-cover"
                            onError={(e) => { e.target.src = '/images/default.webp'; }}
                          />
                        ))}
                      </div>
                      <span className="text-sm text-gray-600">
                        {club.members.length} {club.members.length === 1 ? 'member' : 'members'}
                      </span>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-1 text-sm text-gray-600">
                    <span className="inline-block w-2 h-2 bg-green-500 rounded-full"></span>
                    {club.activeUsers || 0} online
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Books Section - Only show for own profile */}
        {isOwnProfile && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">My Books</h2>
            
            {/* Favorite Books */}
            {favoriteBooks.length > 0 && (
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-red-600 mb-3">❤️ Favorites</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  {favoriteBooks.map(userBook => (
                    <div key={userBook.id} className="group">
                      <img
                        src={userBook.book.coverUrl || '/images/default.webp'}
                        alt={userBook.book.title}
                        className="w-full h-48 object-cover rounded-lg shadow-md group-hover:shadow-xl transition-shadow"
                        onError={(e) => { e.target.src = '/images/default.webp'; }}
                      />
                      <h4 className="mt-2 text-sm font-medium line-clamp-2">{userBook.book.title}</h4>
                      <p className="text-xs text-gray-600">{userBook.book.author}</p>
                      {userBook.rating && (
                        <p className="text-xs text-yellow-600">{'⭐'.repeat(userBook.rating)}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Currently Reading */}
            {booksImReading.length > 0 && (
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-green-600 mb-3">📖 Currently Reading</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  {booksImReading.map(userBook => (
                    <div key={userBook.id} className="group">
                      <img
                        src={userBook.book.coverUrl || '/images/default.webp'}
                        alt={userBook.book.title}
                        className="w-full h-48 object-cover rounded-lg shadow-md group-hover:shadow-xl transition-shadow"
                        onError={(e) => { e.target.src = '/images/default.webp'; }}
                      />
                      <h4 className="mt-2 text-sm font-medium line-clamp-2">{userBook.book.title}</h4>
                      <p className="text-xs text-gray-600">{userBook.book.author}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Want to Read */}
            {booksToRead.length > 0 && (
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-blue-600 mb-3">📚 Want to Read</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  {booksToRead.map(userBook => (
                    <div key={userBook.id} className="group">
                      <img
                        src={userBook.book.coverUrl || '/images/default.webp'}
                        alt={userBook.book.title}
                        className="w-full h-48 object-cover rounded-lg shadow-md group-hover:shadow-xl transition-shadow"
                        onError={(e) => { e.target.src = '/images/default.webp'; }}
                      />
                      <h4 className="mt-2 text-sm font-medium line-clamp-2">{userBook.book.title}</h4>
                      <p className="text-xs text-gray-600">{userBook.book.author}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Completed Books */}
            {booksRead.length > 0 && (
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-purple-600 mb-3">✅ Completed</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  {booksRead.map(userBook => (
                    <div key={userBook.id} className="group">
                      <img
                        src={userBook.book.coverUrl || '/images/default.webp'}
                        alt={userBook.book.title}
                        className="w-full h-48 object-cover rounded-lg shadow-md group-hover:shadow-xl transition-shadow"
                        onError={(e) => { e.target.src = '/images/default.webp'; }}
                      />
                      <h4 className="mt-2 text-sm font-medium line-clamp-2">{userBook.book.title}</h4>
                      <p className="text-xs text-gray-600">{userBook.book.author}</p>
                      {userBook.rating && (
                        <p className="text-xs text-yellow-600">{'⭐'.repeat(userBook.rating)}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Empty State */}
            {favoriteBooks.length === 0 && booksImReading.length === 0 && 
             booksToRead.length === 0 && booksRead.length === 0 && (
              <div className="text-center py-8 text-gray-400">
                <p>No books in your library yet. Search for books below to get started!</p>
              </div>
            )}
          </div>
        )}

        {/* Book Search - Only show for own profile */}
        {isOwnProfile && <BookSearch />}
      </div>
    </div>
  );
};

export default ProfilePage;