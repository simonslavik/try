import AuthContext from '../../context';
import { useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import HomePageHeader from '../../components/HomePageHeader';


    


const Home = () => {
    const { auth, logout } = useContext(AuthContext);
    const [rooms, setRooms] = useState([]);
    const [bookClubs, setBookClubs] = useState([]);

    useEffect(() => {
        if (auth) {
            // Fetch book clubs 
            
        }
    }, []);
    
    return (
        <div>
            <HomePageHeader />
            <div className="flex items-center justify-center mt-10">
                <h3>Welcome <span className='text-lg font-semibold'>{auth.user.name}</span> !!</h3>
            </div>
            <div>
                <h1 className='font-semibold'>BookClubs</h1>
                {/* Render list of book clubs here */}
                {bookClubs.map(bookClub => (
                    <div key={bookClub.id}>{bookClub.name}</div>
                ))}
            </div>
        </div>
    );
};

export default Home;