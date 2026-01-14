import { AuthContext } from '../../context';
import { useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import HomePageHeader from '../../components/HomePageHeader';



    


const Home = () => {
    const { auth} = useContext(AuthContext);
    const [bookClubs, setBookClubs] = useState([]);
    const [myCreatedBookClubs, setMyCreatedBookClubs] = useState([]);
    const [myMemberBookClubs, setMyMemberBookClubs] = useState([]);

    const navigate = useNavigate();
    
    
    useEffect(() => {
        const headers = auth?.token 
            ? { Authorization: `Bearer ${auth.token}` }
            : {};

        // Fetch my created bookclubs (only if authenticated)
        if (auth?.user) {
            fetch('http://localhost:3000/v1/editor/my-bookclubs', { headers })
                .then(response => response.json())
                .then(data => {
                    console.log('My Created Bookclubs response:', data);
                    setMyCreatedBookClubs(data.bookClubs || []);
                })
                .catch(error => console.error('Error fetching my created book clubs:', error));
        }
        
        // Always fetch all public bookclubs
        fetch('http://localhost:3000/v1/editor/bookclubs', { headers })
            .then(response => response.json())
            .then(data => {
                console.log('All Bookclubs response:', data);
                setBookClubs(data.bookClubs || []);
                
                // Filter for bookclubs where user is a member but not creator
                if (auth?.user) {
                    const memberClubs = (data.bookClubs || []).filter(club => {
                        const isMember = club.members.some(member => 
                            typeof member === 'string' ? member === auth.user.id : member.id === auth.user.id
                        );
                        const isCreator = club.creatorId === auth.user.id;
                        return isMember && !isCreator;
                    });
                    setMyMemberBookClubs(memberClubs);
                }
            })
            .catch(error => console.error('Error fetching all book clubs:', error));
    }, [auth]);
    
    const createNewBookClub = () => {
        navigate('/create-bookclub');
    };



    return (
        <div>
            <HomePageHeader />
            <div className="flex flex-col p-8 w-full min-h-screen gap-4">
                {auth?.user && (
                    <div className="flex flex-col justify-center items-center p-4 rounded w-full">
                        <h1 className='text-xl mb-4 font-mono font-light '>BookClubs Created By You</h1>
                        {myCreatedBookClubs.length === 0 ? (
                            <button onClick={createNewBookClub}>
                                <div className="p-4 border rounded hover:bg-gray-50 cursor-pointer w-17 h-17 flex items-center justify-center">
                                    <h3 className="font-medium text-2xl">+</h3>
                                </div>
                            </button>
                        ) : (
                            <div className="flex gap-4 overflow-x-auto">
                                {myCreatedBookClubs.map(bookClub => (
                                    <div 
                                        key={bookClub.id}
                                        onClick={() => navigate(`/bookclub/${bookClub.id}`)}
                                        className="p-4 shadow border rounded cursor-pointer flex-shrink-0 w-[280px] h-[420px] flex flex-col"
                                    >
                                        <img 
                                            src={bookClub.imageUrl ? `http://localhost:4000${bookClub.imageUrl}` : '/images/default.webp'} 
                                            alt={bookClub.name}
                                            className="w-full h-40 object-cover mb-3 rounded"
                                            onError={(e) => { e.target.src = '/images/default.webp'; }}
                                        />
                                        <h3 className="font-sans truncate">{bookClub.name}</h3>
                                        {bookClub.members && bookClub.members.length > 0 && (
                                            <div className="mt-2">
                                                <p className="text-sm font-sans text-gray-600 mb-1">
                                                    {bookClub.members.length} {bookClub.members.length === 1 ? 'member' : 'members'}
                                                </p>
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
                                                        <div className="w-8 h-8 rounded-full border-2 border-white bg-gray-300 flex items-center justify-center text-xs font-semibold text-gray-700">
                                                            +{bookClub.members.length - 5}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                        <p className="text-sm font-sans text-gray-600 mt-2">
                                            <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-1"></span>
                                            {bookClub.activeUsers || 0} online
                                        </p>
                                    </div>
                                    
                                ))}
                            </div>
                        )}
                    </div>
                )}
                {auth?.user && (
                <div className='flex justify-center'>
                    <button className='font-medium border-0.5 rounded p-2  bg-gray-200 text-gray-800 cursor-pointer hover:bg-gray-100'  onClick={createNewBookClub}>
                        Create New Book Club
                    </button>
                </div>
                )}
                
                {auth?.user && myMemberBookClubs.length > 0 && (
                    <div className="flex flex-col p-4 rounded w-full">
                        <h1 className='font-semibold text-xl mb-4'>Book Clubs I'm In</h1>
                        <div className="flex gap-4 overflow-x-auto">
                            {myMemberBookClubs.map(bookClub => (
                                <div 
                                    key={bookClub.id}
                                    onClick={() => navigate(`/bookclub/${bookClub.id}`)}
                                    className="p-4 border rounded hover:bg-gray-50 cursor-pointer flex-shrink-0 w-[280px] h-[420px] flex flex-col"
                                >
                                    <img 
                                        src={bookClub.imageUrl ? `http://localhost:4000${bookClub.imageUrl}` : '/images/default.webp'} 
                                        alt={bookClub.name}
                                        className="w-full h-40 object-cover mb-3 rounded"
                                        onError={(e) => { e.target.src = '/images/default.webp'; }}
                                    />
                                    <h3 className="font-medium truncate">{bookClub.name}</h3>
                                    
                                    {/* Current Book */}
                                    {bookClub.currentBook && (
                                        <div className="mt-2 p-2 bg-purple-50 rounded border border-purple-200">
                                            <p className="text-xs text-purple-600 font-semibold mb-1">📖 Currently Reading</p>
                                            <div className="flex gap-2">
                                                <img 
                                                    src={bookClub.currentBook.book?.coverUrl || '/images/default.webp'}
                                                    alt={bookClub.currentBook.book?.title}
                                                    className="w-12 h-16 object-cover rounded"
                                                    onError={(e) => { e.target.src = '/images/default.webp'; }}
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-medium text-gray-900 line-clamp-2">{bookClub.currentBook.book?.title}</p>
                                                    <p className="text-xs text-gray-600 truncate">{bookClub.currentBook.book?.author}</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    
                                    {bookClub.members && bookClub.members.length > 0 && (
                                        <div className="mt-2">
                                            <p className="text-sm text-gray-600 mb-1">
                                                {bookClub.members.length} {bookClub.members.length === 1 ? 'member' : 'members'}
                                            </p>
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
                                                    <div className="w-8 h-8 rounded-full border-2 border-white bg-gray-300 flex items-center justify-center text-xs font-semibold text-gray-700">
                                                        +{bookClub.members.length - 5}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                    <p className="text-sm text-gray-600 mt-2">
                                        <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-1"></span>
                                        {bookClub.activeUsers || 0} online
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                
                <div className="flex flex-col p-4 rounded w-full">
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
                                    onClick={() => navigate(`/bookclubpage/${bookClub.id}`)}
                                    key={bookClub.id}
                                    className="p-4 border rounded hover:bg-gray-50 flex-shrink-0 w-[280px] h-[420px] cursor-pointer flex flex-col"
                                >
                                    <img 
                                        src={bookClub.imageUrl ? `http://localhost:4000${bookClub.imageUrl}` : '/images/default.webp'} 
                                        alt={bookClub.name}
                                        className="w-full h-40 object-cover mb-3 rounded"
                                        onError={(e) => { e.target.src = '/images/default.webp'; }}
                                    />
                                    <h3 className="font-medium truncate">{bookClub.name}</h3>
                                    
                                    {/* Current Book */}
                                    {bookClub.currentBook && (
                                        <div className="mt-2 p-2 bg-purple-50 rounded border border-purple-200">
                                            <p className="text-xs text-purple-600 font-semibold mb-1">📖 Currently Reading</p>
                                            <div className="flex gap-2">
                                                <img 
                                                    src={bookClub.currentBook.book?.coverUrl || '/images/default.webp'}
                                                    alt={bookClub.currentBook.book?.title}
                                                    className="w-12 h-16 object-cover rounded"
                                                    onError={(e) => { e.target.src = '/images/default.webp'; }}
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-medium text-gray-900 line-clamp-2">{bookClub.currentBook.book?.title}</p>
                                                    <p className="text-xs text-gray-600 truncate">{bookClub.currentBook.book?.author}</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    
                                    {bookClub.members && bookClub.members.length > 0 && (
                                        <div className="mt-2">
                                            <p className="text-sm text-gray-600 mb-1">
                                                {bookClub.members.length} {bookClub.members.length === 1 ? 'member' : 'members'}
                                            </p>
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
                                                    <div className="w-8 h-8 rounded-full border-2 border-white bg-gray-300 flex items-center justify-center text-xs font-semibold text-gray-700">
                                                        +{bookClub.members.length - 5}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                    
                                    <p className="text-sm text-gray-600 mt-2">
                                        <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-1"></span>
                                        {bookClub.activeUsers || 0} online
                                    </p>
                                </div>
                            ))}
                        </div>
                        
                    )}
                </div>
                <div className='flex justify-center'>
                    <button 
                        onClick={() => navigate('/discover')}
                        className='font-medium border-0.5 rounded p-2  bg-gray-200 text-gray-800 cursor-pointer hover:bg-gray-100'
                    >
                        Discover More Book Clubs
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Home;