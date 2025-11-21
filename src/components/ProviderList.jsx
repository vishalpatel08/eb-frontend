import React, { useEffect, useState } from 'react';
import './ProviderList.css';
import { API_ENDPOINTS, createGetOptions } from '../utils/validation';
import { getId } from '../utils/normalize';
import { useNavigate } from 'react-router-dom';

export default function ProviderList({ user }) {
    const [providers, setProviders] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        let mounted = true;
        const fetchProviders = async () => {
            setLoading(true);
            setError(null);
            try {
                const token = user?.token || user?.accessToken || null;
                const res = await fetch(API_ENDPOINTS.PROVIDERS, createGetOptions(token));
                if (!res.ok) {
                    const errBody = await res.json().catch(() => ({}));
                    throw new Error(errBody.message || `Failed to load providers (${res.status})`);
                }
                const data = await res.json().catch(() => []);
                if (mounted) setProviders(Array.isArray(data) ? data : data.providers || []);
            } catch (err) {
                if (mounted) setError(err.message || 'Failed to load providers');
            } finally {
                if (mounted) setLoading(false);
            }
        };

        fetchProviders();

        return () => { mounted = false; };
    }, [user]);

    return (
        <div className="provider-list">
            <h2>Available Service Providers</h2>
            {loading && <div className="loading">Loading providers...</div>}
            {error && <div className="error-text">{error}</div>}
            <div className="provider-grid">
                {providers.map(provider => (
                    <div 
                        key={getId(provider) || provider.id} 
                        className="provider-card clickable" 
                        onClick={() => navigate(`/provider/${getId(provider) || provider.id}`, { state: { provider, user } })}
                    >
                        <div className="provider-avatar">
                            {provider.firstName?.[0]}{provider.lastName?.[0]}
                        </div>
                        <div className="provider-info">
                            <h3>{provider.firstName} {provider.lastName}</h3>
                            <p className="provider-specialty">{provider.specialty || provider.title}</p>
                            <div className="provider-rating">★ {provider.rating ?? '—'}</div>
                        </div>

                        <button 
                            className="book-button" 
                            onClick={e => { 
                                e.stopPropagation(); 
                                navigate(`/provider/${getId(provider) || provider.id}`, { state: { provider, user } });
                            }}
                        >
                            Book Now
                        </button>
                    </div>
                ))}
                {!loading && !error && providers.length === 0 && (
                    <div className="muted">No providers found.</div>
                )}
            </div>
        </div>
    );
}