import AuthContext from '../../context';
import { useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import HomePageHeader from '../../components/HomePageHeader';
import axios from 'axios';


    


const Home = () => {
    const { auth, logout } = useContext(AuthContext);
    const [bookClubs, setBookClubs] = useState([]);
    const [myBookClubs, setMyBookClubs] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        const headers = auth?.token 
            ? { Authorization: `Bearer ${auth.token}` }
            : {};

        // Fetch my bookclubs (only if authenticated)
        if (auth?.user) {
            fetch('http://localhost:3000/v1/editor/bookclubs?mine=true', { headers })
                .then(response => response.json())
                .then(data => {
                    console.log('My Bookclubs response:', data);
                    setMyBookClubs(data.bookClubs || []);
                })
                .catch(error => console.error('Error fetching my book clubs:', error));
        }
        
        // Always fetch all public bookclubs
        fetch('http://localhost:3000/v1/editor/bookclubs', { headers })
            .then(response => response.json())
            .then(data => {
                console.log('All Bookclubs response:', data);
                setBookClubs(data.bookClubs || []);
            })
            .catch(error => console.error('Error fetching all book clubs:', error));
    }, [auth]);
    
    const createNewBookClub = () => {
        if (!auth?.token) {
            alert('Please login to create a book club');
            return;
        }
        
        console.log('Creating bookclub with token:', auth.token);
        
        // axios already has Authorization header set by auth context
        axios.post('http://localhost:3000/v1/editor/bookclubs', {
            name: 'New Book Club',
            isPublic: true,
        })
        .then(response => {
            console.log('Created Bookclub:', response.data);
            // Refresh my book clubs list
            setMyBookClubs(prev => [...prev, response.data.bookClub]);
            setBookClubs(prev => [...prev, response.data.bookClub]);
        })
        .catch(error => {
            alert('Failed to create book club. Please try again.');
            console.error('Error creating book club:', error);
            console.error('Error response:', error.response?.data);
        });
    };



    return (
        <div>
            <HomePageHeader />
            <div className="flex flex-col p-8 w-full min-h-screen gap-4">
                {auth?.user && (
                    <div className="flex flex-col  bg-gray-100 p-4 rounded w-full">
                        <h1 className='font-semibold text-xl mb-4 '>My Book Clubs</h1>
                        {myBookClubs.length === 0 ? (
                            <button onClick={createNewBookClub}>
                                <div className="p-4 border rounded hover:bg-gray-50 cursor-pointer w-17 h-17 flex items-center justify-center">
                                    <h3 className="font-medium text-2xl">+</h3>
                                </div>
                            </button>
                        ) : (
                            <div className="flex gap-4 overflow-x-auto">
                                {myBookClubs.map(bookClub => (
                                    <div 
                                        key={bookClub.id}
                                        onClick={() => navigate(`/bookclub/${bookClub.id}`)}
                                        className="p-4 border rounded hover:bg-gray-50 cursor-pointer flex-shrink-0 min-w-[200px]"
                                    >
                                        <img 
                                            src={bookClub.imageUrl ? `http://localhost:4000${bookClub.imageUrl}` : '/images/default.webp'} 
                                            alt={bookClub.name}
                                            className="w-full h-32 object-cover mb-2 rounded"
                                            onError={(e) => { e.target.src = '/images/default.webp'; }}
                                        />
                                        <h3 className="font-medium">{bookClub.name}</h3>
                                        <p className="text-sm text-gray-600">
                                            {bookClub.activeUsers || 0} users online
                                        </p>
                                    </div>
                                    
                                ))}
                                <button onClick={createNewBookClub}>
                                    <div className="p-4 border rounded hover:bg-gray-50 cursor-pointer w-20 h-20 flex items-center justify-center">
                                        <h3 className="font-medium text-2xl">+</h3>
                                    </div>
                                </button>
                            </div>
                        )}
                    </div>
                )}
                
                <div className="flex flex-col  bg-gray-100 p-4 rounded w-full">
                    <h1 className='font-semibold text-xl mb-4 '>All Book Clubs</h1>
                    {bookClubs.length === 0 ? (
                        <button onClick={createNewBookClub}>
                                <div className="p-4 border rounded hover:bg-gray-50 cursor-pointer w-20 h-20 flex items-center justify-center">
                                    <h3 className="font-medium text-2xl">+</h3>
                                </div>
                            </button>
                    ) : (
                        <div className="flex gap-4 overflow-x-auto">
                            {bookClubs.map(bookClub => (
                                <div 
                                    key={bookClub.id}
                                    className="p-4 border rounded hover:bg-gray-50 cursor-pointer flex-shrink-0 min-w-[200px]"
                                >
                                    <img 
                                        src={bookClub.imageUrl ? `http://localhost:4000${bookClub.imageUrl}` : '/images/default.webp'} 
                                        alt={bookClub.name}
                                        className="w-full h-32 object-cover mb-2 rounded"
                                        onError={(e) => { e.target.src = '/images/default.webp'; }}
                                    />
                                    <h3 className="font-medium">{bookClub.name}</h3>
                                    <button onClick={() => navigate(`/bookclub/${bookClub.id}`)} className='border rounded p-2 bg-gray-100 hover:bg-gray-200'>Join</button>
                                    <p className="text-sm text-gray-600">
                                        {bookClub.activeUsers || 0} users online
                                    </p>
                                </div>
                            ))}
                            <button onClick={createNewBookClub}>
                                <div className="p-4 border rounded hover:bg-gray-50 cursor-pointer w-20 h-20 flex items-center justify-center">
                                    <h3 className="font-medium text-2xl">+</h3>
                                </div>
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Home;