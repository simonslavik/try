import AuthContext from '../context';
import { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';


    


const HomePageHeader = () => {
    const { auth, logout } = useContext(AuthContext);
    const navigate = useNavigate();
    const [showDropdown, setShowDropdown] = useState(false);
    
    // Debug: Check what auth contains
    console.log('=== AUTH DEBUG ===');
    console.log('Full auth object:', JSON.stringify(auth, null, 2));
    console.log('Has user?', auth?.user);
    console.log('Profile image value:', auth?.user?.profileImage);
    console.log('Profile image type:', typeof auth?.user?.profileImage);
    console.log('==================');
    
    const handleLogout = () => {
        setShowDropdown(false);
        logout();
        navigate('/');
    };

    const handleProfileClick = () => {
        setShowDropdown(!showDropdown);
    };
    
    return (
        <div className='flex items-center p-4 '>
            <h1 className='absolute left-1/2 -translate-x-1/2'>YourBookClub.com</h1>
            {auth?.user && (
            <div className='ml-auto'>
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
                        <button onClick={() => navigate('/change-profile')} className="px-4 py-2 border-b border-gray-300 text-sm hover:bg-gray-100">
                            Change Profile Settings
                        </button>
                        <button
                            onClick={handleLogout}
                            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
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