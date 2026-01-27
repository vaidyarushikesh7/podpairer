import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import './App.css';
import LandingPage from './pages/LandingPage';
import AuthCallback from './pages/AuthCallback';
import RoleSelection from './pages/RoleSelection';
import ProfileSetup from './pages/ProfileSetup';
import Discovery from './pages/Discovery';
import Matches from './pages/Matches';
import Chat from './pages/Chat';
import Settings from './pages/Settings';
import AdminDashboard from './pages/AdminDashboard';
import DataMapping from './pages/DataMapping';
import ProtectedRoute from './components/ProtectedRoute';

function AppRouter() {
  const location = useLocation();
  
  if (location.hash?.includes('session_id=')) {
    return <AuthCallback />;
  }
  
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/role" element={<ProtectedRoute><RoleSelection /></ProtectedRoute>} />
      <Route path="/profile-setup" element={<ProtectedRoute><ProfileSetup /></ProtectedRoute>} />
      <Route path="/discover" element={<ProtectedRoute><Discovery /></ProtectedRoute>} />
      <Route path="/matches" element={<ProtectedRoute><Matches /></ProtectedRoute>} />
      <Route path="/chat/:matchId" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
      <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppRouter />
      <Toaster position="top-center" richColors />
    </BrowserRouter>
  );
}

export default App;