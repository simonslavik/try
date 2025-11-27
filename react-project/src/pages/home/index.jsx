import AuthContext from '../../context';
import { useContext } from 'react';


    


const Home = () => {
    const { auth, logout } = useContext(AuthContext);
    return (
        <div>
            {auth.user ? (
                <div>
                    <h1>Welcome, {auth.user.name}!</h1>
                    <p>Your role: {auth.user.role}</p>
                    <button className='cursor-pointer border rounded hover:text-gray-500 font-semibold p-1 m-2' onClick={() => logout()}>
                        Logout
                    </button>
                </div>
            ) : (
                <h1>Welcome to the Home Page!</h1>
            )}
        </div>
    );
};

export default Home;