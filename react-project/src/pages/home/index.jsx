import AuthContext from '../../context';
import { useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import HomePageHeader from '../../components/HomePageHeader';


    


const Home = () => {
    const { auth, logout } = useContext(AuthContext);
    const [rooms, setRooms] = useState([]);

    useEffect(() => {
        if (auth) {
            // Fetch rooms or any other data if needed
            
        }
    }, []);
    
    return (
        <div>
            <HomePageHeader />
            <div className="flex items-center justify-center mt-10">
                <h3>Welcome <span className='text-lg font-semibold'>{auth.user.name}</span> !!</h3>
            </div>
        </div>
    );
};

export default Home;