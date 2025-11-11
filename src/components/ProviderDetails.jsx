import React, { useEffect, useState } from 'react';
// Import Link from react-router-dom
import { useParams, useLocation, Link } from 'react-router-dom';
import { API_ENDPOINTS, createGetOptions } from '../utils/validation';
import './ProviderDetails.css';

export default function ProviderDetails() {
    const { id } = useParams();
    const location = useLocation();
    // Try to get provider from navigation state, else fetch by id
    const initialProvider = location.state?.provider || null;
    const stateUser = location.state?.user || null;
    const user = stateUser || (typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || 'null') : null);
    const bookedServiceId = location.state?.bookedServiceId || null;
    const [provider, setProvider] = useState(initialProvider);
    const [services, setServices] = useState([]);
    const [schedule, setSchedule] = useState(null);
    const [bookedServiceIds, setBookedServiceIds] = useState(new Set());
    const [serviceStatusMap, setServiceStatusMap] = useState(new Map());
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [scheduleError, setScheduleError] = useState(null);

    // Helpers to format service fields
    const formatDuration = (duration) => {
        // assume duration is minutes; if divisible by 60 show hours
        if (duration == null) return '—';
        const d = Number(duration);
        if (Number.isNaN(d)) return String(duration);
        if (d % 60 === 0) return `${d / 60} hr${d / 60 > 1 ? 's' : ''}`;
        if (d >= 60) return `${Math.floor(d / 60)} hr ${d % 60} min`;
        return `${d} min`;
    };

    const formatPrice = (price) => {
        const p = Number(price ?? 0);
        if (Number.isNaN(p)) return String(price);
        return p.toFixed(2);
    };

    useEffect(() => {
        let mounted = true;

        const token = user?.token || user?.accessToken || null;

        // Fetch current user's bookings and build a Set of serviceIds
        const fetchMyBookings = async () => {
            if (!token) return;
            try {
                const res = await fetch(API_ENDPOINTS.BOOKINGS_ME, createGetOptions(token));
                if (!res.ok) return;
                const data = await res.json().catch(() => ({}));
                const bookings = Array.isArray(data?.bookings) ? data.bookings : [];
                const ids = new Set();
                const statusMap = new Map();
                // Pick latest by startTime per service for current status view
                bookings.forEach(b => {
                    const sid = String(b.serviceId || b.serviceID || b.service_id || '');
                    if (!sid) return;
                    ids.add(sid);
                    const prev = statusMap.get(sid);
                    if (!prev || new Date(b.startTime) > new Date(prev.startTime)) {
                        statusMap.set(sid, { status: String(b.status || ''), startTime: b.startTime });
                    }
                });
                if (mounted) {
                    setBookedServiceIds(ids);
                    setServiceStatusMap(statusMap);
                }
            } catch (_) { /* ignore */ }
        };

        // If provider is absent (e.g., after refresh), fetch providers list and find the matching one.
        const ensureProviderHeader = async () => {
            if (provider) return;
            try {
                const res = await fetch(`${API_ENDPOINTS.PROVIDERS}`, createGetOptions(token));
                if (!res.ok) return; // silently ignore; header will remain minimal
                const data = await res.json().catch(() => ({}));
                const list = Array.isArray(data?.providers) ? data.providers : [];
                const match = list.find(p => String(p.id || p._id) === String(id) || String(p.userId) === String(id));
                if (mounted && match) setProvider(match);
            } catch (_) { /* ignore header fetch errors */ }
        };

        // Fetch services list from API
        const primeProvider = async () => {
            console.log(" 1 ")
            if (provider && Array.isArray(provider.services) && provider.services.length > 0) {
                setServices(provider.services);
                return;
            }
            console.log(" 2 ")
            setLoading(true);
            setError(null);
            console.log(" 3 ")
            try {
                console.log(" 4 ")
                const providerKey = provider?.userId || id; // backend expects provider's userId
                const res = await fetch(`${API_ENDPOINTS.PROVIDERS}/${providerKey}/services`, createGetOptions(token));
                console.log(" 5 ")
                if (!res.ok) {
                    console.log(" 6 ")
                    if (res.status === 404) {
                        if (mounted) setServices([]);
                        return;
                    }
                    const errBody = await res.json().catch(() => ({}));
                    throw new Error(errBody.message || `Failed to load services (${res.status})`);
                }
                const data = await res.json().catch(() => ({}));
                const list = Array.isArray(data?.services) ? data.services : [];
                if (mounted) setServices(list);
            } catch (err) {
                if (mounted) setError(err.message || 'Failed to load services');
            } finally {
                if (mounted) setLoading(false);
            }
        };

        const fetchSchedule = async () => {
            setScheduleError(null);
            try {
                const providerKey = provider?.userId || id; // Availability uses provider's userId
                const res = await fetch(`${API_ENDPOINTS.PROVIDERS}/${providerKey}/schedule`, createGetOptions(token));
                if (!res.ok) {
                    if (res.status === 404) {
                        // No schedule yet: treat as all closed without raising error
                        if (mounted) setSchedule({ week: {} });
                        return;
                    }
                    const errBody = await res.json().catch(() => ({}));
                    throw new Error(errBody.message || `Failed to load schedule (${res.status})`);
                }
                const data = await res.json().catch(() => ({}));
                if (mounted) setSchedule(data);
            } catch (err) {
                if (mounted) setScheduleError(err.message || 'Failed to load schedule');
            }
        };

        ensureProviderHeader();
        primeProvider();
        fetchSchedule();
        fetchMyBookings();

        return () => { mounted = false; };
    }, [id, user, provider]);

    return (
        <div className="provider-page">
            <header className="provider-header">
                {/* ... (header content remains the same) ... */}
                <div className="provider-header-content">
                    <div className="provider-avatar-large">
                        {provider?.firstName?.[0]}{provider?.lastName?.[0]}
                    </div>
                    <div className="provider-header-info">
                        <h1>{provider?.firstName} {provider?.lastName}</h1>
                        <div className="provider-meta">
                            <span className="provider-specialty">{provider?.specialty || provider?.domain}</span>
                            <span className="provider-specialty">{provider?.specialty || provider?.title}</span>
                            <span className="provider-rating">★ {provider?.rating ?? '—'}</span>
                            <span className={`status-badge ${provider?.status || 'available'}`}>
                                {provider?.status || 'Available'}
                            </span>
                        </div>
                    </div>
                </div>
            </header>

            <div className="provider-details-layout">
                <main className="services-section">
                    <div className="section-header">
                        <h2>Available Services</h2>
                        <div className="section-actions">
                            {/* Add any actions/filters here */}
                        </div>
                    </div>

                    {loading && <div className="loading-overlay">Loading services...</div>}
                    {error && <div className="error-message">{error}</div>}

                    <div className="services-list">
                        {services.map(service => {
                            const sid = String(service.id || service._id);
                            const isBooked = bookedServiceIds.has(sid) || (bookedServiceId && String(bookedServiceId) === sid);
                            const status = (serviceStatusMap.get(sid)?.status || '').toLowerCase();
                            return (
                                <div key={sid} className="service-card">
                                    <div className="service-content">
                                        <h3>{service.title ?? service.name}</h3>
                                        {service.description && (
                                            <p className="service-description">{service.description}</p>
                                        )}
                                        <div className="service-meta">
                                            <span className="service-duration">⏱ {formatDuration(service.duration)}</span>
                                            {service.category && (
                                                <span className="service-category">{service.category}</span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="service-actions">
                                        <div className="service-price">
                                            <span className="currency">$</span>
                                            <span className="amount">{formatPrice(service.price)}</span>
                                        </div>
                                        {isBooked ? (
                                            status === 'cancelled' ? (
                                                <Link 
                                                    to="/booking"
                                                    className="book-service-btn"
                                                    state={{ service, provider, user }}
                                                >
                                                    Rebook
                                                </Link>
                                            ) : (
                                                <button className="book-service-btn" disabled style={{
                                                    backgroundColor: status==='accepted' ? '#16a34a' : '#f59e0b',
                                                    color: '#fff'
                                                }}>
                                                    {status === 'accepted' ? 'Confirmed' : 'Waiting for approval'}
                                                </button>
                                            )
                                        ) : (
                                            <Link 
                                                to="/booking"
                                                className="book-service-btn"
                                                state={{ service, provider, user }}
                                            >
                                                Book Now
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                        {!loading && !error && services.length === 0 && (
                            <div className="empty-state">
                                <p>No services available at the moment.</p>
                            </div>
                        )}
                    </div>
                </main>

                <aside className="provider-info-section">
                    {/* ... (aside content remains the same) ... */}
                    {provider ? (
                        <div className="provider-info-card">
                            <div className="info-section">
                                <h3>Contact Information</h3>
                                <div className="info-list">
                                    <div className="info-item">
                                        <span className="info-label">Email</span>
                                        <span className="info-value">{provider.email}</span>
                                    </div>
                                    {provider.phoneNumber && (
                                        <div className="info-item">
                                            <span className="info-label">Phone</span>
                                            <span className="info-value">{provider.phoneNumber}</span>
                                        </div>
                                    )}
                                    {provider.location && (
                                        <div className="info-item">
                                            <span className="info-label">Location</span>
                                            <span className="info-value">{provider.location}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="info-section">
                                <h3>Experience & Expertise</h3>
                                <div className="info-content">
                                    <p>{provider.experience || 'Professional service provider with extensive experience in the field.'}</p>
                                </div>
                            </div>

                            <div className="info-section">
                                <h3>Working Hours</h3>
                                <div className="working-hours">
                                    {scheduleError && <div className="error-message">{scheduleError}</div>}
                                    {schedule ? (
                                        <div className="hours-list">
                                            {['monday','tuesday','wednesday','thursday','friday','saturday','sunday'].map(day => {
                                                const slot = schedule.week?.[day];
                                                const label = day.charAt(0).toUpperCase() + day.slice(1);
                                                if (!slot || !slot.isAvailable) {
                                                    return (
                                                        <div key={day} className="hours-item">
                                                            <span>{label}</span>
                                                            <span>Closed</span>
                                                        </div>
                                                    );
                                                }
                                                return (
                                                    <div key={day} className="hours-item">
                                                        <span>{label}</span>
                                                        <span>{slot.startTime} - {slot.endTime}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <div className="muted">Loading schedule...</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="empty-state">No provider details available.</div>
                    )}
                </aside>
            </div>
        </div>
    );
}