import { Route, Routes } from "react-router-dom";

import AuthPage from "./pages/auth";
import Register from "./pages/register";
import Login from "./pages/login";
import Home from "./pages/home";
import CollaborativeEditor from "./pages/editor";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <Routes>
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/register" element={<Register />}/>
      <Route path="/login" element={<Login />}/>
      <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
      <Route path="/editor" element={<CollaborativeEditor />} />
    </Routes>
  );
}

export default App;