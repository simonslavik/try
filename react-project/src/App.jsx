import { Route, Routes } from "react-router-dom";

import AuthPage from "./pages/auth";
import Register from "./pages/register";
import Login from "./pages/login";
import Home from "./pages/home";
import BookClub from "./pages/bookclub/:id";
import ProtectedRoute from "./components/ProtectedRoute";
import NewBookClubPage from "./pages/createbookclub";
import ChangeProfilePage from "./pages/changeProfile";
import ProfilePage from "./pages/profilePage/:id";
import BookClubPage from "./pages/bookclubPage/:id";
import DiscoverBookClubs from "./pages/discover";


function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/register" element={<Register />}/>
      <Route path="/login" element={<Login />}/>
      <Route path="/bookclub/:id" element={
        <ProtectedRoute>
          <BookClub />
        </ProtectedRoute>
      } />
      <Route path="/bookclubpage/:id" element={
        <ProtectedRoute>
          <BookClubPage />
        </ProtectedRoute>
      } />
      <Route path="/create-bookclub" element={
        <ProtectedRoute>
          <NewBookClubPage />
        </ProtectedRoute>
      }/>
      <Route path="/profile/:id" element={<ProfilePage />}/>
      <Route path="/change-profile" element={
        <ProtectedRoute>
          <ChangeProfilePage />
        </ProtectedRoute>
      }/>
      <Route path="/discover" element={<DiscoverBookClubs />}/>
      
    </Routes>
  );
}

export default App;