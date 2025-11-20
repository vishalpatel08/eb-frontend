import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { API_ENDPOINTS, createPostOptions } from '../../utils/validation';

export default function CreateService() {
  const location = useLocation();
  const navigate = useNavigate();
  const stateUser = location.state?.user;
  const storedUser = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || 'null') : null;
  const user = stateUser || storedUser;
  const token = user?.token || user?.accessToken || null;

  const [title, setTitle] = useState('');
  const [duration, setDuration] = useState('');
  const [price, setPrice] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError(null); setMessage(null);
    if (!title || !duration || !price) { setError('All fields are required'); return }
    setLoading(true);
    try {
      const body = { title, duration: Number(duration), price: Number(price) };
      const res = await fetch(API_ENDPOINTS.SERVICE_CREATE, createPostOptions(body, token));
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || `Failed to create service (${res.status})`);
      setMessage('Service created successfully');
    } catch (e) {
      setError(e.message || 'Failed to create service');
    } finally { setLoading(false) }
  }

  return (
    <div className="provider-bookings">
      <div className="pb-header">
        <h2 style={{margin:0}}>Create Service</h2>
        <button onClick={() => navigate(-1)} className="btn-primary">Back</button>
      </div>
      <form onSubmit={onSubmit} className="simple-form">
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
  );
}
