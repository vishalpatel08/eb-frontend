import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { API_ENDPOINTS, createGetOptions, API_BASE } from '../../utils/validation';
import { getId } from '../../utils/normalize';
import './ProviderBookings.css';

export default function ProviderBookings() {
  const location = useLocation();
  const navigate = useNavigate();
  const stateUser = location.state?.user;
  const storedUser = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || 'null') : null;
  const user = stateUser || storedUser;
  const token = user?.token || user?.accessToken || null;

    // Removed duplicate fmt function definition
  const [error, setError] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState('upcoming');
  const [providerUserMap, setProviderUserMap] = useState({});

  useEffect(() => {
    let mounted = true;
    const fetchBookings = async () => {
      if (!token) return;
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(API_ENDPOINTS.PROVIDER_BOOKINGS_ME, createGetOptions(token));
        if (!res.ok) {
          const errBody = await res.json().catch(() => ({}));
          throw new Error(errBody.message || `Failed to load bookings (${res.status})`);
        }
        const data = await res.json().catch(() => ({}));
        const list = Array.isArray(data?.bookings) ? data.bookings : [];
        if (mounted) setBookings(list);
      } catch (e) {
        if (mounted) setError(e.message || 'Failed to load bookings');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    fetchBookings();
    return () => { mounted = false }
  }, [token]);

  const now = new Date();
  const toDate = (x) => new Date(x);
  const isUpcoming = (b) => toDate(b.startTime) >= now && (b.status || '').toLowerCase() !== 'cancelled';
  const byTab = tab === 'upcoming' ? bookings.filter(isUpcoming) : bookings.filter(b => toDate(b.startTime) < now || (b.status || '').toLowerCase() === 'completed');

  const fmt = (iso) => { try { return new Date(iso).toLocaleString() } catch { return String(iso) } };

  // Fetch client profiles for bookings so provider sees names
  useEffect(() => {
    let mounted = true;
    const toFetch = new Set();
    bookings.forEach(b => {
      if (b.user && typeof b.user === 'object') {
        const idKey = getId(b.user);
        if (idKey) setProviderUserMap(prev => ({ ...prev, [idKey]: b.user }));
        return;
      }
      const clientId = b.userId || b.clientId || getId(b);
      if (clientId) toFetch.add(clientId);
    });
    if (toFetch.size === 0) return;
    const fetchProfile = async (id) => {
      try {
        const url = `${API_BASE.replace(/\/+$/,'')}/api/users/${id}`;
        const tokenToUse = token || localStorage.getItem('token') || null;
        const res = await fetch(url, createGetOptions(tokenToUse));
        if (!res.ok) return;
        const data = await res.json().catch(() => null);
        if (!mounted || !data) return;
        setProviderUserMap(prev => ({ ...prev, [id]: data }));
      } catch (e) {
        // ignore individual failures
      }
    }

    toFetch.forEach(id => { fetchProfile(id) });

    return () => { mounted = false }
  }, [bookings, token]);

  return (
    <div className="provider-bookings">
      <div className="pb-header">
        <h2 style={{margin:0}}>Clients' Bookings</h2>
        <button onClick={() => navigate(-1)} className="btn-primary">Back</button>
      </div>
      <div className="pb-tabs">
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
          let client = null;
          let clientId = null;
          if (b.user && typeof b.user === 'object') {
            client = b.user;
            clientId = getId(b.user);
          } else {
            clientId = b.userId || b.clientId || getId(b);
            client = clientId ? providerUserMap[clientId] : null;
          }
          const clientName = client ? `${client.firstName || ''} ${client.lastName || ''}`.trim() : (clientId ? `User ${String(clientId).substring(0,6)}` : 'Unknown');
          return (
            <div key={String(getId(b) || b._id || b.id)} className="booking-row">
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
      
    </div>
  );
}
