import AuthContext from '../../context';
import { useContext } from 'react';
import { useNavigate } from 'react-router-dom';


    


const Home = () => {
    const { auth, logout } = useContext(AuthContext);
    const navigate = useNavigate();
    
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
            <div className="max-w-4xl mx-auto">
                {auth.user ? (
                    <div className="bg-white rounded-2xl shadow-xl p-8">
                        <div className="mb-8">
                            <h1 className="text-4xl font-bold text-gray-800 mb-2">
                                Welcome, {auth.user.name}! 👋
                            </h1>
                            <p className="text-gray-600">Your role: <span className="font-semibold text-indigo-600">{auth.user.role}</span></p>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                            <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl p-6 text-white cursor-pointer hover:scale-105 transition-transform shadow-lg"
                                 onClick={() => navigate('/editor')}>
                                <div className="text-4xl mb-3">👥</div>
                                <h2 className="text-2xl font-bold mb-2">Collaborative Editor</h2>
                                <p className="text-purple-100">Code together in real-time with your team</p>
                            </div>
                            
                            <div className="bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl p-6 text-white opacity-60">
                                <div className="text-4xl mb-3">🚀</div>
                                <h2 className="text-2xl font-bold mb-2">More Services</h2>
                                <p className="text-blue-100">Coming soon...</p>
                            </div>
                        </div>
                        
                        <button 
                            className='w-full md:w-auto bg-red-500 hover:bg-red-600 text-white font-semibold px-6 py-3 rounded-lg transition-colors shadow-md' 
                            onClick={() => logout()}
                        >
                            🚪 Logout
                        </button>
                    </div>
                ) : (
                    <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
                        <h1 className="text-3xl font-bold text-gray-800">Welcome to the Home Page!</h1>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Home;