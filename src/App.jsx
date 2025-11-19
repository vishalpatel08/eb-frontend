import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import Login from './login/login'
import Registration from './login/registration'
import Profile from './profile/profile'
import Home from './home/Home'
import ProviderDetails from './components/ProviderDetails'
import BookingPage from './components/BookingPage'
import { ChatContainer } from './components/chat/ChatContainer';
import { API_BASE, API_ENDPOINTS, createGetOptions, createPostOptions, createPutOptions } from './utils/validation'
import React, { useEffect, useState } from 'react'

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
  const derivedUserId = user?._id || user?.id || user?.userId || user?.uid || null;
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

function ProviderRegister() {
  const location = useLocation()
  const navigate = useNavigate()
  const stateUser = location.state?.user
  const storedUser = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || 'null') : null
  const user = stateUser || storedUser
  const token = user?.token || user?.accessToken || null

  const [title, setTitle] = useState('')
  const [domain, setDomain] = useState('')
  const [qualifications, setQualifications] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [message, setMessage] = useState(null)

  const onSubmit = async (e) => {
    e.preventDefault()
    setError(null); setMessage(null)
    if (!title || !domain) { setError('Title and Domain are required'); return }
    setLoading(true)
    try {
      const body = { title, domain, qualifications }
      const res = await fetch(API_ENDPOINTS.PROVIDER_REGISTER, createPostOptions(body, token))
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.message || `Failed to register provider (${res.status})`)
      setMessage('Provider registered successfully')
    } catch (e) {
      setError(e.message || 'Failed to register provider')
    } finally { setLoading(false) }
  }

  return (
    <div style={{maxWidth: 560, margin: '24px auto', padding:'0 12px'}}>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: 12}}>
        <h2 style={{margin:0}}>Provider Registration</h2>
        <button onClick={() => navigate(-1)} className="btn-primary">Back</button>
      </div>
      <form onSubmit={onSubmit} style={{display:'grid', gap:12}}>
        <label>
          <div className="label">Title</div>
          <input value={title} onChange={e=>setTitle(e.target.value)} className="reg-input" />
        </label>
        <label>
          <div className="label">Domain</div>
          <input value={domain} onChange={e=>setDomain(e.target.value)} className="reg-input" />
        </label>
        <label>
          <div className="label">Qualifications (optional)</div>
          <textarea value={qualifications} onChange={e=>setQualifications(e.target.value)} className="reg-input" rows={4} />
        </label>
        {error && <div className="error-text">{error}</div>}
        {message && <div className="reg-message">{message}</div>}
        <button type="submit" className="btn-primary" disabled={loading}>{loading?'Submitting...':'Submit'}</button>
      </form>
    </div>
  )
}

function MyBookings() {
  const location = useLocation()
  const navigate = useNavigate()
  const stateUser = location.state?.user
  const storedUser = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || 'null') : null
  const user = stateUser || storedUser
  const token = user?.token || user?.accessToken || null

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [bookings, setBookings] = useState([])
  const [tab, setTab] = useState('upcoming')
  

  useEffect(() => {
    let mounted = true
    const fetchBookings = async () => {
      if (!token) return
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(API_ENDPOINTS.BOOKINGS_ME, createGetOptions(token))
        if (!res.ok) {
          const errBody = await res.json().catch(() => ({}))
          throw new Error(errBody.message || `Failed to load bookings (${res.status})`)
        }
        const data = await res.json().catch(() => ({}))
        const list = Array.isArray(data?.bookings) ? data.bookings : []
        if (mounted) setBookings(list)
      } catch (e) {
        if (mounted) setError(e.message || 'Failed to load bookings')
      } finally {
        if (mounted) setLoading(false)
      }
    }
    fetchBookings()
    return () => { mounted = false }
  }, [token])

  const now = new Date()
  const toDate = (x) => new Date(x)
  const isUpcoming = (b) => toDate(b.startTime) >= now && (b.status || '').toLowerCase() !== 'cancelled'
  const lc = (s) => String(s || '').toLowerCase()
  const isDeclined = (b) => lc(b.status) === 'cancelled'
  const isPast = (b) => toDate(b.startTime) < now || lc(b.status) === 'completed'
  const byTab = tab === 'upcoming' ? bookings.filter(isUpcoming) : tab === 'past' ? bookings.filter(isPast) : bookings.filter(isDeclined)

  const fmt = (iso) => {
    try { return new Date(iso).toLocaleString() } catch { return String(iso) }
  }

  return (
    <div style={{maxWidth: 720, margin: '24px auto', padding: '0 12px'}}>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: 12}}>
        <h2 style={{margin:0}}>My Bookings</h2>
        <button onClick={() => navigate(-1)} className="btn-primary">Back</button>
      </div>

      <div style={{display:'flex', gap:8, marginBottom:12}}>
        <button className={`tab-btn ${tab==='upcoming'?'active':''}`} onClick={() => setTab('upcoming')}>Upcoming</button>
        <button className={`tab-btn ${tab==='past'?'active':''}`} onClick={() => setTab('past')}>Past</button>
        <button className={`tab-btn ${tab==='declined'?'active':''}`} onClick={() => setTab('declined')}>Declined</button>
      </div>

      {loading && <div>Loading...</div>}
      {error && <div className="error-text">{error}</div>}

      {!loading && !error && bookings.length === 0 && (
        <div className="muted">No bookings available.</div>
      )}
      {!loading && !error && bookings.length > 0 && byTab.length === 0 && (
        <div className="muted">No {tab} bookings.</div>
      )}

      <div className="booking-list">
        {byTab.map(b => (
          <div key={String(b._id || b.id)} className="booking-row">
            <div className="booking-col">
              <div className="label">Service</div>
              <div className="value">{String(b.serviceId)}</div>
            </div>
            <div className="booking-col">
              <div className="label">Start</div>
              <div className="value">{fmt(b.startTime)}</div>
            </div>
            <div className="booking-col">
              <div className="label">End</div>
              <div className="value">{fmt(b.endTime)}</div>
            </div>
            <div className="booking-col">
              <div className="label">Status</div>
              <div className="value" style={{color: lc(b.status)==='accepted'?'#166534': lc(b.status)==='cancelled'?'#991b1b': '#92400e'}}>
                {lc(b.status)==='accepted' ? 'Confirmed' : lc(b.status)==='cancelled' ? 'Declined' : 'Waiting for approval'}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* lightweight styles for the page */}
      <style>{`
        .tab-btn{ border:none; padding:8px 12px; border-radius:8px; background:#eef2ff; color:#3730a3; font-weight:600; cursor:pointer }
        .tab-btn.active{ background: var(--accent); color: white }
        .booking-list{ display:flex; flex-direction:column; gap:10px }
        .booking-row{ display:flex; gap:12px; padding:12px; border-radius:10px; background:var(--bg); box-shadow: var(--card-shadow) }
        .booking-col{ flex:1 }
        .label{ color: var(--muted); font-size:12px; margin-bottom:4px }
        .value{ font-weight:600 }
      `}</style>
    </div>
  )
}

function ProviderBookings() {
  const location = useLocation()
  const navigate = useNavigate()
  const stateUser = location.state?.user
  const storedUser = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || 'null') : null
  const user = stateUser || storedUser
  const token = user?.token || user?.accessToken || null

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [bookings, setBookings] = useState([])
  const [tab, setTab] = useState('upcoming')
  const [providerUserMap, setProviderUserMap] = useState({})

  useEffect(() => {
    let mounted = true
    const fetchBookings = async () => {
      if (!token) return
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(API_ENDPOINTS.PROVIDER_BOOKINGS_ME, createGetOptions(token))
        if (!res.ok) {
          const errBody = await res.json().catch(() => ({}))
          throw new Error(errBody.message || `Failed to load bookings (${res.status})`)
        }
        const data = await res.json().catch(() => ({}))
        const list = Array.isArray(data?.bookings) ? data.bookings : []
        if (mounted) setBookings(list)
      } catch (e) {
        if (mounted) setError(e.message || 'Failed to load bookings')
      } finally {
        if (mounted) setLoading(false)
      }
    }
    fetchBookings()
    return () => { mounted = false }
  }, [token])

  const now = new Date()
  const toDate = (x) => new Date(x)
  const isUpcoming = (b) => toDate(b.startTime) >= now && (b.status || '').toLowerCase() !== 'cancelled'
  const byTab = tab === 'upcoming' ? bookings.filter(isUpcoming) : bookings.filter(b => toDate(b.startTime) < now || (b.status || '').toLowerCase() === 'completed')

  const fmt = (iso) => { try { return new Date(iso).toLocaleString() } catch { return String(iso) } }

  // Fetch client profiles for bookings so provider sees names
  useEffect(() => {
    let mounted = true
    const toFetch = new Set()
    bookings.forEach(b => {
      // If booking already contains a user object, seed the map immediately
      if (b.user && typeof b.user === 'object') {
        const idKey = b.user._id || b.user.id || null
        if (idKey) setProviderUserMap(prev => ({ ...prev, [idKey]: b.user }))
        return
      }
      const clientId = b.userId || b.clientId || null
      if (clientId) toFetch.add(clientId)
    })
    console.log("to Fetch", toFetch.size)
    if (toFetch.size === 0) return

    const fetchProfile = async (id) => {
      try {
        const url = `${API_BASE.replace(/\/+$/,'')}/api/users/${id}`
        console.log(" checking ")
        console.log(id)
        console.log(url)
        const tokenToUse = token || localStorage.getItem('token') || null
        const res = await fetch(url, createGetOptions(tokenToUse))
        if (!res.ok) return
        const data = await res.json().catch(() => null)
        if (!mounted || !data) return
        console.log(" 111 d", data)
        setProviderUserMap(prev => ({ ...prev, [id]: data }))
      } catch (e) {
        console.log(" Error in fetching the users", e)
        // ignore individual failures
      }
    }

    console.log(" providerUsermap", providerUserMap)

    toFetch.forEach(id => { fetchProfile(id) })

    return () => { mounted = false }
  }, [bookings, token])

  return (
    <div style={{maxWidth: 900, margin: '24px auto', padding: '0 12px'}}>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: 12}}>
        <h2 style={{margin:0}}>Clients' Bookings</h2>
        <button onClick={() => navigate(-1)} className="btn-primary">Back</button>
      </div>
      <div style={{display:'flex', gap:8, marginBottom:12}}>
        <button className={`tab-btn ${tab==='upcoming'?'active':''}`} onClick={() => setTab('upcoming')}>Upcoming</button>
        <button className={`tab-btn ${tab==='past'?'active':''}`} onClick={() => setTab('past')}>Past</button>
      </div>
      {loading && <div>Loading...</div>}
      {error && <div className="error-text">{error}</div>}
      {!loading && !error && bookings.length === 0 && (
        <div className="muted">No bookings available.</div>
      )}
      {!loading && !error && bookings.length > 0 && byTab.length === 0 && (
        <div className="muted">No {tab} bookings.</div>
      )}
      <div className="booking-list">
        {byTab.map(b => {
          let client = null
          let clientId = null
          if (b.user && typeof b.user === 'object') {
            client = b.user
            clientId = b.user._id || b.user.id || null
          } else {
            clientId = b.userId || b.clientId || null
            client = clientId ? providerUserMap[clientId] : null
          }
          const clientName = client ? `${client.firstName || ''} ${client.lastName || ''}`.trim() : (clientId ? `User ${String(clientId).substring(0,6)}` : 'Unknown')
          return (
            <div key={String(b._id || b.id)} className="booking-row">
              <div className="booking-col">
                <div className="label">Client</div>
                <div className="value" style={{display:'flex', gap:8, alignItems:'center'}}>
                  <span style={{cursor:'pointer', textDecoration:'underline'}} onClick={() => navigate('/profile', { state: { user: client || { _id: clientId, firstName: clientName } } })}>
                    {clientName}
                  </span>
                </div>
              </div>
              <div className="booking-col">
                <div className="label">Service</div>
                <div className="value">{String(b.serviceId)}</div>
              </div>
              <div className="booking-col">
                <div className="label">Start</div>
                <div className="value">{fmt(b.startTime)}</div>
              </div>
              <div className="booking-col">
                <div className="label">End</div>
                <div className="value">{fmt(b.endTime)}</div>
              </div>
              <div className="booking-col">
                <div className="label">Status</div>
                <div className="value">{b.status}</div>
              </div>
            </div>
          )
        })}
      </div>
      <style>{`
        .tab-btn{ border:none; padding:8px 12px; border-radius:8px; background:#eef2ff; color:#3730a3; font-weight:600; cursor:pointer }
        .tab-btn.active{ background: var(--accent); color: white }
        .booking-list{ display:flex; flex-direction:column; gap:10px }
        .booking-row{ display:flex; gap:12px; padding:12px; border-radius:10px; background:var(--bg); box-shadow: var(--card-shadow) }
        .booking-col{ flex:1 }
        .label{ color: var(--muted); font-size:12px; margin-bottom:4px }
        .value{ font-weight:600 }
      `}</style>
    </div>
  )
}

function CreateService() {
  const location = useLocation()
  const navigate = useNavigate()
  const stateUser = location.state?.user
  const storedUser = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || 'null') : null
  const user = stateUser || storedUser
  const token = user?.token || user?.accessToken || null

  const [title, setTitle] = useState('')
  const [duration, setDuration] = useState('')
  const [price, setPrice] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [message, setMessage] = useState(null)

  const onSubmit = async (e) => {
    e.preventDefault()
    setError(null); setMessage(null)
    if (!title || !duration || !price) { setError('All fields are required'); return }
    setLoading(true)
    try {
      const body = { title, duration: Number(duration), price: Number(price) }
      const res = await fetch(API_ENDPOINTS.SERVICE_CREATE, createPostOptions(body, token))
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.message || `Failed to create service (${res.status})`)
      setMessage('Service created successfully')
    } catch (e) {
      setError(e.message || 'Failed to create service')
    } finally { setLoading(false) }
  }

  return (
    <div style={{maxWidth: 560, margin: '24px auto', padding:'0 12px'}}>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: 12}}>
        <h2 style={{margin:0}}>Create Service</h2>
        <button onClick={() => navigate(-1)} className="btn-primary">Back</button>
      </div>
      <form onSubmit={onSubmit} style={{display:'grid', gap:12}}>
        <label>
          <div className="label">Title</div>
          <input value={title} onChange={e=>setTitle(e.target.value)} className="reg-input" />
        </label>
        <label>
          <div className="label">Duration (minutes)</div>
          <input type="number" value={duration} onChange={e=>setDuration(e.target.value)} className="reg-input" />
        </label>
        <label>
          <div className="label">Price</div>
          <input type="number" step="0.01" value={price} onChange={e=>setPrice(e.target.value)} className="reg-input" />
        </label>
        {error && <div className="error-text">{error}</div>}
        {message && <div className="reg-message">{message}</div>}
        <button type="submit" className="btn-primary" disabled={loading}>{loading?'Creating...':'Create'}</button>
      </form>
    </div>
  )
}

function EditSchedule() {
  const location = useLocation()
  const navigate = useNavigate()
  const stateUser = location.state?.user
  const storedUser = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || 'null') : null
  const user = stateUser || storedUser
  const token = user?.token || user?.accessToken || null

  const [dayOfWeek, setDayOfWeek] = useState('monday')
  const [startTime, setStartTime] = useState('09:00')
  const [endTime, setEndTime] = useState('17:00')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [message, setMessage] = useState(null)

  const onSubmit = async (e) => {
    e.preventDefault()
    setError(null); setMessage(null)
    setLoading(true)
    try {
      const body = { dayOfWeek, startTime, endTime }
      const res = await fetch(API_ENDPOINTS.UPDATE_SCHEDULE, createPutOptions(body, token))
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.message || `Failed to update schedule (${res.status})`)
      setMessage('Schedule updated')
    } catch (e) {
      setError(e.message || 'Failed to update schedule')
    } finally { setLoading(false) }
  }

  return (
    <div style={{maxWidth: 560, margin: '24px auto', padding:'0 12px'}}>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: 12}}>
        <h2 style={{margin:0}}>Edit Schedule</h2>
        <button onClick={() => navigate(-1)} className="btn-primary">Back</button>
      </div>
      <form onSubmit={onSubmit} style={{display:'grid', gap:12}}>
        <label>
          <div className="label">Day of Week</div>
          <select value={dayOfWeek} onChange={e=>setDayOfWeek(e.target.value)} className="reg-input">
            {['monday','tuesday','wednesday','thursday','friday','saturday','sunday'].map(d=> (
              <option key={d} value={d}>{d.charAt(0).toUpperCase()+d.slice(1)}</option>
            ))}
          </select>
        </label>
        <label>
          <div className="label">Start Time</div>
          <input type="time" value={startTime} onChange={e=>setStartTime(e.target.value)} className="reg-input" />
        </label>
        <label>
          <div className="label">End Time</div>
          <input type="time" value={endTime} onChange={e=>setEndTime(e.target.value)} className="reg-input" />
        </label>
        {error && <div className="error-text">{error}</div>}
        {message && <div className="reg-message">{message}</div>}
        <button type="submit" className="btn-primary" disabled={loading}>{loading?'Saving...':'Save Changes'}</button>
      </form>
    </div>
  )
}

export default App

function OAuthCallback() {
  const navigate = useNavigate()
  const [hasProcessed, setHasProcessed] = React.useState(false)
  
  useEffect(() => {
    // Skip if we've already processed the OAuth callback
    if (hasProcessed) return;
    
    try {
      const params = new URLSearchParams(window.location.search)
      const token = params.get('token')
      
      // Only proceed if we have a token (prevents empty second render from clearing data)
      if (!token) {
        console.log('No token found in URL, skipping OAuth processing')
        return;
      }
      
      const firstName = params.get('firstName') || ''
      const lastName = params.get('lastName') || ''
      const email = params.get('email') || ''
      const role = params.get('role') || 'client'
      // userId comes from the backend GoogleCallback query param
      const userId = params.get('userId') || ''
      const user = userId
        ? { _id: userId, firstName, lastName, email, role, token }
        : { firstName, lastName, email, role, token }
      
      console.log('Saving user to localStorage:', user)
      localStorage.setItem('user', JSON.stringify(user))
      console.log('Successfully saved user to localStorage')
      
      // Mark as processed to prevent duplicate processing
      setHasProcessed(true)
      
      // Navigate to home with the user data
      navigate('/home', { state: { user }, replace: true })
    } catch (error) {
      console.error('Error in OAuthCallback:', error)
      
      // Check if localStorage is available
      try {
        const testKey = 'test-storage';
        localStorage.setItem(testKey, testKey);
        localStorage.removeItem(testKey);
        console.log('localStorage is available and working')
      } catch (e) {
        console.error('localStorage is not available:', e)
      }
    }
  }, [])
  return (
    <div style={{maxWidth:560, margin:'24px auto', padding:'0 12px'}}>
      <h2>Signing you in...</h2>
    </div>
  )
}
