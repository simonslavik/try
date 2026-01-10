import AuthContext from '../context';
import { useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { FiBell } from 'react-icons/fi';


    


const HomePageHeader = () => {
    const { auth, logout } = useContext(AuthContext);
    const navigate = useNavigate();
    const [showDropdown, setShowDropdown] = useState(false);
    const [newsShowDropdown, setNewsShowDropdown] = useState(false);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [friendRequests, setFriendRequests] = useState([]);


    
    const handleLogout = () => {
        setShowDropdown(false);
        logout();
        navigate('/');
    };

    const handleProfileClick = () => {
        setShowDropdown(!showDropdown);
    };

    useEffect(() => {
    const fetchFriendRequests = async () => {
      try {
        const headers = auth?.token 
          ? { Authorization: `Bearer ${auth.token}` }
          : {};
        
        const response = await fetch(`http://localhost:3000/v1/friends/requests`, { headers });
        const data = await response.json();
        setLoading(true);
        if (response.ok) {
          setFriendRequests(data.data || []);
          console.log('Friend Requests:', data);

        } else {
          setError(data.error || 'Failed to load friend requests');
        }
      } catch (err) {
        console.error('Error fetching friend requests:', err);
        setError('Failed to connect to server');
      } finally {
        setLoading(false);
      }
    };
    fetchFriendRequests();
  }, [auth]);
    
    return (
        <div className='flex items-center p-4 '>
            <button onClick={() => navigate('/')}>
                <h1 className='absolute left-1/2 -translate-x-1/2'>YourBookClub.com</h1>
            </button>
            {auth?.user && (
            <div className='ml-auto relative'>
                <button 
                    onClick={() => setNewsShowDropdown(!newsShowDropdown)} 
                    className="relative px-2 py-2 text-black rounded hover:bg-gray-100 transition mr-4"
                >
                    <FiBell size={22} />
                    {friendRequests.length > 0 && (
                        <span className="absolute top-1 right-3 flex h-5 w-5 items-center justify-center">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-4 w-4 bg-orange-500 text-white text-xs items-center justify-center font-semibold">
                                {friendRequests.length}
                            </span>
                        </span>
                    )}
                </button>
                {newsShowDropdown && (
                    <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-xl z-50 max-h-96 overflow-y-auto">
                        <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 rounded-t-lg">
                            <h3 className="text-sm font-semibold text-gray-900">Friend Requests</h3>
                            <p className="text-xs text-gray-500 mt-0.5">{friendRequests.length} pending</p>
                        </div>
                        {friendRequests.length === 0 ? (
                            <div className="px-4 py-8 text-center">
                                <FiBell className="mx-auto h-12 w-12 text-gray-300 mb-2" />
                                <p className="text-sm text-gray-500">No new friend requests</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-100">
                                {friendRequests.map((request) => (
                                    <div key={request.id} className="px-4 py-3 hover:bg-gray-50 transition">
                                        <div className="flex items-start space-x-3">
                                            <img 
                                                src={request.user.profileImage 
                                                    ? `http://localhost:3001${request.user.profileImage}` 
                                                    : "/images/default.webp"} 
                                                alt={request.user.name}
                                                className="h-10 w-10 rounded-full object-cover border-2 border-gray-200"
                                                onError={(e) => { e.target.src = '/images/default.webp'; }}
                                            />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm text-gray-900">
                                                    <span className="font-semibold">{request.user.name}</span>
                                                    <span className="text-gray-600"> sent you a friend request</span>
                                                </p>
                                                <p className="text-xs text-gray-500 mt-0.5">{request.user.email}</p>
                                                <div className="mt-3 flex space-x-2">
                                                    <button 
                                                        onClick={async () => {
                                                            try {
                                                                const headers = auth?.token 
                                                                  ? { 
                                                                      'Content-Type': 'application/json',
                                                                      Authorization: `Bearer ${auth.token}` 
                                                                    }
                                                                  : {};
                                                                const response = await fetch('http://localhost:3000/v1/friends/accept', {
                                                                    method: 'POST',
                                                                    headers,
                                                                    body: JSON.stringify({ requestId: request.id }),
                                                                });
                                                                if (response.ok) {
                                                                    setFriendRequests(prev => prev.filter(r => r.id !== request.id));
                                                                } else {
                                                                    const data = await response.json();
                                                                    console.error('Failed to accept:', data);
                                                                }
                                                            } catch (err) {
                                                                console.error('Error accepting friend request:', err);
                                                            }
                                                        }} 
                                                        className="flex-1 px-3 py-1.5 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition text-xs font-medium"
                                                    >
                                                        Accept
                                                    </button>
                                                    <button 
                                                        onClick={async () => {
                                                            try {
                                                                const headers = auth?.token 
                                                                  ? { 
                                                                      'Content-Type': 'application/json',
                                                                      Authorization: `Bearer ${auth.token}` 
                                                                    }
                                                                  : {};
                                                                const response = await fetch('http://localhost:3000/v1/friends/reject', {
                                                                    method: 'POST',
                                                                    headers,
                                                                    body: JSON.stringify({ requestId: request.id }),
                                                                });
                                                                if (response.ok) {
                                                                    setFriendRequests(prev => prev.filter(r => r.id !== request.id));
                                                                } else {
                                                                    const data = await response.json();
                                                                    console.error('Failed to reject:', data);
                                                                }
                                                            } catch (err) {
                                                                console.error('Error rejecting friend request:', err);
                                                            }
                                                        }} 
                                                        className="flex-1 px-3 py-1.5 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition text-xs font-medium"
                                                    >
                                                        Decline
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>  
            )}
            {auth?.user && (
            <div className="ml-4 relative">
                <button onClick={handleProfileClick}>
                    <div>
                        <img src={auth.user.profileImage 
                                ? `http://localhost:3001${auth.user.profileImage}` 
                                : "/images/default.webp"}
                            alt="Profile" 
                            className="h-11 w-11 rounded-full object-cover border-2 border-gray-200 cursor-pointer"
                            onError={(e) => { e.target.src = '/images/default.webp'; }}
                        />
                    </div>
                </button>
                {showDropdown && (
                    <div className="absolute right-4 mt-2 w-48 bg-white border border-gray-300 rounded shadow-lg z-10">
                        <button onClick={() => { navigate(`/profile/${auth.user.id}`); setShowDropdown(false); }} className="px-4 py-2 border-b border-gray-300 text-sm hover:bg-gray-100 w-full text-left">
                            View Profile
                        </button>
                        <button onClick={() => navigate('/change-profile')} className="px-4 py-2 border-b border-gray-300 text-sm hover:bg-gray-100 w-full text-left">
                            Change Profile Settings
                        </button>
                        <button
                            onClick={handleLogout}
                            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 w-full"
                        >
                            Logout
                        </button>
                    </div>
                )}
            </div>  
            )}
            {!auth?.user && (
            <div className='ml-auto'>
                <button 
                    onClick={() => navigate('/login')}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-700 transition mr-1"
                >
                    Login
                </button>
                <button 
                    onClick={() => navigate('/register')}
                    className="px-4 py-2 bg-blue-950 text-white rounded hover:bg-blue-700 transition"
                >
                    Register
                </button>
            </div>
            
            )}
        </div>
    );
};

export default HomePageHeader;