import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { API_ENDPOINTS, createPostOptions } from '../../utils/validation';
import { getId } from '../../utils/normalize';

export default function ProviderRegister() {
  const location = useLocation();
  const navigate = useNavigate();
  const stateUser = location.state?.user;
  const storedUser = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || 'null') : null;
  const user = stateUser || storedUser;
  const token = user?.token || user?.accessToken || null;

  const [title, setTitle] = useState('');
  const [domain, setDomain] = useState('');
  const [qualifications, setQualifications] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError(null); setMessage(null);
    if (!title || !domain) { setError('Title and Domain are required'); return }
    setLoading(true);
    try {
      const body = { title, domain, qualifications };
      const res = await fetch(API_ENDPOINTS.PROVIDER_REGISTER, createPostOptions(body, token));
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || `Failed to register provider (${res.status})`);
      setMessage('Provider registered successfully');
    } catch (e) {
      setError(e.message || 'Failed to register provider');
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
  );
}
