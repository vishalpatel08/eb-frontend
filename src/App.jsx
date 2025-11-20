import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import Login from './login/login'
import Registration from './login/registration'
import Profile from './profile/profile'
import Home from './home/Home'
import ProviderDetails from './components/ProviderDetails'
import BookingPage from './components/BookingPage'
import { ChatContainer } from './components/chat/ChatContainer';
import ProviderRegister from './components/app/ProviderRegister';
import MyBookings from './components/app/MyBookings';
import ProviderBookings from './components/app/ProviderBookings';
import CreateService from './components/app/CreateService';
import EditSchedule from './components/app/EditSchedule';
import OAuthCallback from './components/app/OAuthCallback';
import { getId } from './utils/normalize';
import React from 'react'

// Protected Route wrapper
function RequireAuth({ children }) {
  const location = useLocation();
  const stateUser = location.state?.user;
  const storedUser = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || 'null') : null;
  const user = stateUser || storedUser;
  if (!user) {
    return <Navigate to="/" replace />;
  }
  // derive a stable userId to pass into protected children (covers different payload shapes)
  const derivedUserId = getId(user);
  // Ensure we return a single React element (the protected child) with injected props
  try {
    const onlyChild = React.Children.only(children);
    return React.cloneElement(onlyChild, { currentUser: user, userId: derivedUserId });
  } catch (e) {
    // Fallback to mapping if multiple children were provided for some reason
    return React.Children.map(children, child => 
      React.cloneElement(child, { currentUser: user, userId: derivedUserId })
    );
  }
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Registration />} />
        
        {/* OAuth callback (public) */}
        <Route path="/oauth/callback" element={<OAuthCallback />} />

        {/* Protected routes */}
        <Route path="/home" element={
          <RequireAuth>
            <Home />
          </RequireAuth>
        } />
        <Route path="/profile" element={
          <RequireAuth>
            <Profile />
          </RequireAuth>
        } />
        <Route path="/provider/:id" element={
          <RequireAuth>
            <ProviderDetails />
          </RequireAuth>
        } />
        <Route path="/booking" element={
          <RequireAuth>
            <BookingPage />
          </RequireAuth>
        } />
        <Route path="/bookings" element={
          <RequireAuth>
            <MyBookings />
          </RequireAuth>
        } />
        <Route path="/provider/bookings" element={
          <RequireAuth>
            <ProviderBookings />
          </RequireAuth>
        } />
        <Route path="/provider/service/new" element={
          <RequireAuth>
            <CreateService />
          </RequireAuth>
        } />
        <Route path="/provider/schedule" element={
          <RequireAuth>
            <EditSchedule />
          </RequireAuth>
        } />
        <Route path="/chats" element={
          <RequireAuth>
            <ChatContainer />
          </RequireAuth>
        } />
        <Route path="/provider/register" element={
          <RequireAuth>
            <ProviderRegister />
          </RequireAuth>
        } />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
