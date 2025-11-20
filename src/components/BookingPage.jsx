// In a new file, e.g., /components/BookingPage.js
import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './BookingPage.css';
import { API_ENDPOINTS, createPostOptions } from '../utils/validation';
import { getId } from '../utils/normalize';

export default function BookingPage() {
    const location = useLocation();
    const navigate = useNavigate();

    // Get the data passed from the <Link> component
    let { service, provider, user } = location.state || {};
    if (!user && typeof window !== 'undefined') {
        try {
            user = JSON.parse(localStorage.getItem('user') || 'null');
        } catch {
            user = null;
        }
    }
    
    // State to hold the selected start time
    const [startTime, setStartTime] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Handle case where user lands here directly
    if (!service) {
        return <div>No service selected. Please <a href="/">go back</a> and select a service.</div>;
    }

    const handleBooking = async (e) => {
        e.preventDefault();
        if (!startTime) {
            setError('Please select a date and time.');
            return;
        }

        setLoading(true);
        setError(null);

        // This is the data your Go backend is expecting
        const bookingDetails = {
            serviceId: getId(service) || service.id || service._id, // Use normalized ID
            startTime: new Date(startTime).toISOString(), // Ensure it's in a format Go time.Time can parse
        };
        
        const BOOKING_URL = API_ENDPOINTS.BOOKING;
        
        try {
            // Resolve user/token from state and/or localStorage
            let effectiveUser = user || null;

            if (typeof window !== 'undefined') {
                try {
                    const stored = JSON.parse(localStorage.getItem('user') || 'null');
                    if (!effectiveUser && stored) {
                        // No user from navigation -> use stored user
                        effectiveUser = stored;
                    } else if (effectiveUser && !effectiveUser.token && !effectiveUser.accessToken && stored) {
                        // Navigation user present but without token -> merge token from storage
                        effectiveUser = { ...effectiveUser, token: stored.token || stored.accessToken };
                    }
                } catch {
                    // ignore parse errors
                }
            }

            const token = effectiveUser?.token || effectiveUser?.accessToken || null;

            if (!token) {
                // No token at all: send user back to login
                navigate('/', { replace: true });
                return;
            }

            // You'll need a createPostOptions utility function for POST requests
            const res = await fetch(BOOKING_URL, createPostOptions(bookingDetails, token)); 

            if (!res.ok) {
                const errBody = await res.json().catch(() => ({}));
                throw new Error(errBody.message || `Booking failed (${res.status})`);
            }

            // Success!
            alert('Booking successful!');
            const providerId = getId(provider) || provider?.id || provider?._id;
            navigate(`/provider/${providerId}` , { state: { provider, user, bookedServiceId: bookingDetails.serviceId } });
        } catch (err) {
            setError(err.message || 'An error occurred during booking.');
        } finally {
            setLoading(false);
        }
    };

    // Regarding "withdrawal": 
    // This is the "cancel" or "back" action before the booking is confirmed.
    const handleWithdrawal = () => {
        navigate(-1); // Go back to the previous page
    };

    return (
        <div className="booking-page">
            <h2>Book a Service</h2>
            <div className="booking-summary">
                <h3>{service.name}</h3>
                <p>with {provider.firstName} {provider.lastName}</p>
                <p>Duration: {service.duration} min</p>
                <p>Price: ${service.price}</p>
            </div>

            <form onSubmit={handleBooking} className="booking-form">
                <div className="form-group">
                    <label htmlFor="startTime">Select Date and Time:</label>
                    <input 
                        type="datetime-local" 
                        id="startTime"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        required
                    />
                </div>

                {error && <div className="error-message">{error}</div>}

                <div className="booking-footer">
                    <button type="button" className="btn btn-ghost" onClick={handleWithdrawal}>
                        Cancel
                    </button>
                    <button type="submit" className="btn btn-primary" disabled={loading}>
                        {loading ? 'Confirming...' : 'Confirm Booking'}
                    </button>
                </div>
            </form>
        </div>
    );
}