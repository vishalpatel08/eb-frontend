import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { API_ENDPOINTS, createPutOptions } from '../../utils/validation';

export default function EditSchedule() {
  const location = useLocation();
  const navigate = useNavigate();
  const stateUser = location.state?.user;
  const storedUser = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || 'null') : null;
  const user = stateUser || storedUser;
  const token = user?.token || user?.accessToken || null;

  const [dayOfWeek, setDayOfWeek] = useState('monday');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError(null); setMessage(null);
    setLoading(true);
    try {
      const body = { dayOfWeek, startTime, endTime };
      const res = await fetch(API_ENDPOINTS.UPDATE_SCHEDULE, createPutOptions(body, token));
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || `Failed to update schedule (${res.status})`);
      setMessage('Schedule updated');
    } catch (e) {
      setError(e.message || 'Failed to update schedule');
    } finally { setLoading(false) }
  }

  return (
    <div className="provider-bookings">
      <div className="pb-header">
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
  );
}
