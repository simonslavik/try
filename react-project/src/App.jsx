import { Route, Routes } from "react-router-dom";

import AuthPage from "./pages/auth";
import Register from "./pages/register";
import Login from "./pages/login";
import Home from "./pages/home";
import CollaborativeEditor from "./pages/editor/enhanced";
import BookClub from "./pages/bookclub/:id";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/register" element={<Register />}/>
      <Route path="/login" element={<Login />}/>
      <Route path="/editor" element={<CollaborativeEditor />} />
      <Route path="/bookclub/:id" element={<BookClub />} />
    </Routes>
  );
}

export default App;