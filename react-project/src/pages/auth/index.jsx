
import { useNavigate } from 'react-router-dom';


function AuthPage() {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 flex-col">
        <div className='flex items-center justify-center'>
          <div>
            No account? 
          </div>
          <button 
              className='cursor-pointer border rounded hover:text-gray-500 font-semibold p-1 m-2' 
              onClick={() => navigate('/register')}
          >
              Register
          </button>
        </div>
        <div className='flex items-center justify-center'>
          <div>
            Have an account?
          </div>
          <button 
              className='cursor-pointer border rounded hover:text-gray-500 font-semibold p-1 m-2' 
              onClick={() => navigate('/login')}
          >
              Login
          </button>
        </div>
        
    </div>
  );
}

export default AuthPage;