import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { API_ENDPOINTS, createGetOptions } from '../../utils/validation';
import { getId } from '../../utils/normalize';

export default function MyBookings() {
  const location = useLocation();
  const navigate = useNavigate();
  const stateUser = location.state?.user;
  const storedUser = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || 'null') : null;
  const user = stateUser || storedUser;
  const token = user?.token || user?.accessToken || null;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [tab, setTab] = useState('upcoming');

  useEffect(() => {
    let mounted = true;
    const fetchBookings = async () => {
      if (!token) return;
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(API_ENDPOINTS.BOOKINGS_ME, createGetOptions(token));
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
  const lc = (s) => String(s || '').toLowerCase();
  const isDeclined = (b) => lc(b.status) === 'cancelled';
  const isPast = (b) => toDate(b.startTime) < now || lc(b.status) === 'completed';
  const byTab = tab === 'upcoming' ? bookings.filter(isUpcoming) : tab === 'past' ? bookings.filter(isPast) : bookings.filter(isDeclined);

  const fmt = (iso) => { try { return new Date(iso).toLocaleString() } catch { return String(iso) } };

  return (
    <div className="provider-bookings">
      <div className="pb-header">
        <h2 style={{margin:0}}>My Bookings</h2>
        <button onClick={() => navigate(-1)} className="btn-primary">Back</button>
      </div>

      <div className="pb-tabs">
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

      
    </div>
  );
}
