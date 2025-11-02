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
    const user = location.state?.user || null;
    const [provider, setProvider] = useState(initialProvider);
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

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
        if (provider && provider.services) {
            setServices(provider.services);
            return;
        }
        let mounted = true;
        const fetchProvider = async () => {
            setLoading(true);
            setError(null);
            try {
                const token = user?.token || user?.accessToken || null;
                const res = await fetch(`${API_ENDPOINTS.PROVIDERS}/${id}`, createGetOptions(token));
                if (!res.ok) {
                    const errBody = await res.json().catch(() => ({}));
                    throw new Error(errBody.message || `Failed to load provider (${res.status})`);
                }
                const data = await res.json().catch(() => ({}));
                if (mounted) {
                    setProvider(data);
                    setServices(data.services || []);
                }
            } catch (err) {
                if (mounted) setError(err.message || 'Failed to load provider');
            } finally {
                if (mounted) setLoading(false);
            }
        };
        fetchProvider();
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
                        {services.map(service => (
                            <div key={service.id || service._id} className="service-card">
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
                                    
                                    {/* --- MODIFICATION HERE --- */}
                                    {/* Changed from <button> to <Link> */}
                                    <Link 
                                        to="/booking"
                                        className="book-service-btn"
                                        // Pass all necessary data to the booking page
                                        state={{ 
                                            service: service, 
                                            provider: provider, 
                                            user: user 
                                        }}
                                    >
                                        Book Now
                                    </Link>
                                    {/* --- END MODIFICATION --- */}

                                </div>
                            </div>
                        ))}
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
                                    {provider.workingHours ? (
                                        <pre>{provider.workingHours}</pre>
                                    ) : (
                                        <div className="hours-list">
                                            <div className="hours-item">
                                                <span>Mon - Fri</span>
                                                <span>9:00 AM - 6:00 PM</span>
                                            </div>
                                            <div className="hours-item">
                                                <span>Saturday</span>
                                                <span>10:00 AM - 4:00 PM</span>
                                            </div>
                                            <div className="hours-item">
                                                <span>Sunday</span>
                                                <span>Closed</span>
                                            </div>
                                        </div>
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