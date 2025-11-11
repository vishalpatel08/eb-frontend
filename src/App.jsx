import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import Login from './login/login'
import Registration from './login/registration'
import Profile from './profile/profile'
import Home from './home/Home'
import ProviderDetails from './components/ProviderDetails'
import BookingPage from './components/BookingPage'

// Protected Route wrapper
function RequireAuth({ children }) {
  const location = useLocation();
  const stateUser = location.state?.user;
  const storedUser = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || 'null') : null;
  const user = stateUser || storedUser;
  if (!user) {
    return <Navigate to="/" replace />;
  }
  return children;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Registration />} />
        
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
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
