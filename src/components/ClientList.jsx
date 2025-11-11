import React, { useEffect, useState } from 'react';
import './ClientList.css';
import { API_ENDPOINTS, createGetOptions, buildBookingStatusUrl, createPutOptionsForStatusUpdate } from '../utils/validation';

export default function ClientList({ user }) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [bookings, setBookings] = useState([]);

    const getToken = () => {
        const storedUser = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || 'null') : null;
        const u = user || storedUser;
        return u?.token || u?.accessToken || null;
    };

    const loadBookings = async () => {
        const token = getToken();
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
            setBookings(list);
        } catch (e) {
            setError(e.message || 'Failed to load bookings');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        let mounted = true;
        (async () => { if (mounted) await loadBookings(); })();
        return () => { mounted = false; };
    }, [user]);

    const pending = bookings.filter(b => String(b.status || '').toLowerCase() === 'scheduled');

    const fmtDate = (iso) => { try { return new Date(iso).toLocaleDateString(); } catch { return String(iso); } };
    const fmtTime = (iso) => { try { return new Date(iso).toLocaleTimeString(); } catch { return String(iso); } };

    const handleUpdate = async (id, status) => {
        try {
            const token = getToken();
            const url = buildBookingStatusUrl(String(id));
            const res = await fetch(url, createPutOptionsForStatusUpdate({ status }, token));
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data.message || `Failed to update (${res.status})`);
            await loadBookings();
        } catch (e) {
            setError(e.message || 'Failed to update booking');
        }
    };

    return (
        <div className="client-list">
            <h2>Pending Bookings</h2>

            {loading && <div className="muted">Loading...</div>}
            {error && <div className="error-text">{error}</div>}

            {!loading && !error && pending.length === 0 && (
                <div className="muted">No bookings available.</div>
            )}

            <div className="booking-list">
                {pending.map(booking => {
                    const id = booking._id || booking.id;
                    return (
                        <div key={String(id)} className="booking-card">
                            <div className="booking-header">
                                <div className="client-avatar">
                                    {String(booking.userId || '').slice(-2).toUpperCase()}
                                </div>
                                <div className="booking-info">
                                    <h3>Client: {String(booking.userId)}</h3>
                                    <p className="booking-service">Service: {String(booking.serviceId)}</p>
                                </div>
                                <div className={`booking-status pending`}>waiting</div>
                            </div>
                            <div className="booking-details">
                                <div className="detail-item">
                                    <span className="detail-label">Date:</span>
                                    <span>{fmtDate(booking.startTime)}</span>
                                </div>
                                <div className="detail-item">
                                    <span className="detail-label">Time:</span>
                                    <span>{fmtTime(booking.startTime)}</span>
                                </div>
                            </div>
                            <div className="booking-actions">
                                <button className="action-button accept" onClick={() => handleUpdate(id, 'accepted')}>Accept</button>
                                <button className="action-button reject" onClick={() => handleUpdate(id, 'cancelled')}>Decline</button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}