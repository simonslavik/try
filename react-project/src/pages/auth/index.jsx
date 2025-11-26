import React, { useState } from 'react';
import SignIn from '../../components/SignComponents/SignIn.jsx';
import SignUp from '../../components/SignComponents/SignUp.jsx';

function AuthPage() {

    const [isLogin, setIsLogin] = useState(true);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div>
            {isLogin ? <SignIn /> : <SignUp />}
        </div>
    </div>
  );
}

export default AuthPage;