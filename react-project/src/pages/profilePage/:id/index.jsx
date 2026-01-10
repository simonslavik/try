
import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AuthContext from '../../../context';
import HomePageHeader from '../../../components/HomePageHeader';

const ProfilePage = () => {
  const { id } = useParams();
  const { auth } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [profile, setProfile] = useState(null);
  const [bookClubs, setBookClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const isOwnProfile = auth?.user?.id === id;

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        setLoading(true);
        
        // Fetch user profile
        const profileResponse = await fetch(`http://localhost:3000/v1/profile/${id}`);
        const profileData = await profileResponse.json();
        
        if (profileResponse.ok && profileData.success) {
          setProfile(profileData.data);
        } else {
          setError('Failed to load profile');
          return;
        }
        
        // Fetch user's bookclubs
        const headers = auth?.token 
          ? { Authorization: `Bearer ${auth.token}` }
          : {};
          
        const bookClubsResponse = await fetch('http://localhost:3000/v1/editor/bookclubs', { headers });
        const bookClubsData = await bookClubsResponse.json();
        
        if (bookClubsResponse.ok) {
          // Filter bookclubs where this user is a member
          const userBookClubs = (bookClubsData.bookClubs || []).filter(club => 
            club.members.some(member => 
              typeof member === 'string' ? member === id : member.id === id
            )
          );
          setBookClubs(userBookClubs);
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
            <img 
              src={profile.profileImage 
                ? `http://localhost:3001${profile.profileImage}` 
                : '/images/default.webp'
              }
              alt={profile.name}
              className="w-32 h-32 rounded-full object-cover border-4 border-purple-200"
              onError={(e) => { e.target.src = '/images/default.webp'; }}
            />
            
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
              </div>
              
              <div className="mt-6 flex gap-8">
                <div>
                  <div className="text-2xl font-bold text-purple-600">{bookClubs.length}</div>
                  <div className="text-sm text-gray-600">Book Clubs</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-600">
                    {bookClubs.reduce((sum, club) => sum + (club.members?.length || 0), 0)}
                  </div>
                  <div className="text-sm text-gray-600">Connections</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-600">{joinDate}</div>
                  <div className="text-sm text-gray-600">Member Since</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Book Clubs Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            {isOwnProfile ? 'My Book Clubs' : `${profile.name}'s Book Clubs`}
          </h2>
          
          {bookClubs.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-lg mb-4">
                {isOwnProfile ? "You haven't joined any book clubs yet" : "No book clubs yet"}
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
              {bookClubs.map(club => (
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
      </div>
    </div>
  );
};

export default ProfilePage;