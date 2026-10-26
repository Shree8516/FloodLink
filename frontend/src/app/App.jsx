// [Person 1 – app shell] Top-level layout: navigation bar, live stats bar, the page routes (with role guards) and
// the mobile SOS button. Each page comes from a feature folder owned by one team member.
// The layout fills the screen: the header stays put and only <main> scrolls, so the map page can use 100% height.
import { Box } from '@mui/material';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useSelector } from 'react-redux';
import NavBar from './NavBar';
import SosButton from './SosButton';
import LoginPage from '../features/auth/LoginPage';
import RegisterPage from '../features/auth/RegisterPage';
import ProtectedRoute from '../features/auth/ProtectedRoute';
import StatsBar from '../features/live/StatsBar';
import useLiveUpdates from '../features/live/useLiveUpdates';
import useOfflineSync from '../features/live/useOfflineSync';
import HomePage from '../features/requests/HomePage';
import PostRequestPage from '../features/requests/PostRequestPage';
import VolunteerDashboard from '../features/requests/VolunteerDashboard';
import AdminDashboard from '../features/insights/AdminDashboard';

export default function App() {
  const user = useSelector((state) => state.auth.user);
  // One Socket.io connection for the whole app, opened after login
  useLiveUpdates();
  // Sends help requests that were written while offline, as soon as the connection is back
  useOfflineSync();

  return (
    <Box sx={{ height: '100dvh', display: 'flex', flexDirection: 'column' }}>
      <NavBar />
      {user && <StatsBar />}
      <Box component="main" sx={{ flex: 1, minHeight: 0, overflowY: 'auto', position: 'relative' }}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
          <Route path="/post" element={<ProtectedRoute><PostRequestPage /></ProtectedRoute>} />
          <Route path="/volunteer" element={<ProtectedRoute roles={['VOLUNTEER']}><VolunteerDashboard /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute roles={['ADMIN']}><AdminDashboard /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Box>
      {user && <SosButton />}
    </Box>
  );
}
