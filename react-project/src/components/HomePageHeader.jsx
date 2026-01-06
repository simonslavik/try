import AuthContext from '../context';
import { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';


    


const HomePageHeader = () => {
    const { logout } = useContext(AuthContext);
    const navigate = useNavigate();
    const [showDropdown, setShowDropdown] = useState(false);
    
    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const handleProfileClick = () => {
        setShowDropdown(!showDropdown);
    };
    
    return (
        <div className='flex items-center p-4 border-b border-gray-300 '>
            <h1 className='absolute left-1/2 -translate-x-1/2'>CodeCollab.com</h1>
            <div className='ml-auto'>
                <button onClick={handleProfileClick}>
                    <div>
                        <img src="public/images/IMG_2650.jpg" 
                            alt="Profile" 
                            className="h-13 w-13 rounded-full object-cover border-2 border-gray-200 cursor-pointer"/>
                    </div>
                </button>
                {showDropdown && (
                    <div className="absolute right-4 mt-2 w-48 bg-white border border-gray-300 rounded shadow-lg z-10">
                        <button className="px-4 py-2 border-b border-gray-300 text-sm hover:bg-gray-100">
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
        </div>
    );
};

export default HomePageHeader;