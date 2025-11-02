import React from 'react';
import './ClientList.css';

// Mock data - replace with real API data
const MOCK_BOOKINGS = [
    { 
        id: 1, 
        client: { firstName: 'Alice', lastName: 'Cooper' },
        service: 'Plumbing Repair',
        date: '2025-11-05',
        time: '10:00 AM',
        status: 'pending'
    },
    { 
        id: 2, 
        client: { firstName: 'Bob', lastName: 'Dylan' },
        service: 'Electrical Installation',
        date: '2025-11-06',
        time: '2:30 PM',
        status: 'confirmed'
    },
];

export default function ClientList() {
    return (
        <div className="client-list">
            <h2>Your Bookings</h2>
            <div className="booking-list">
                {MOCK_BOOKINGS.map(booking => (
                    <div key={booking.id} className="booking-card">
                        <div className="booking-header">
                            <div className="client-avatar">
                                {booking.client.firstName[0]}{booking.client.lastName[0]}
                            </div>
                            <div className="booking-info">
                                <h3>{booking.client.firstName} {booking.client.lastName}</h3>
                                <p className="booking-service">{booking.service}</p>
                            </div>
                            <div className={`booking-status ${booking.status}`}>
                                {booking.status}
                            </div>
                        </div>
                        <div className="booking-details">
                            <div className="detail-item">
                                <span className="detail-label">Date:</span>
                                <span>{booking.date}</span>
                            </div>
                            <div className="detail-item">
                                <span className="detail-label">Time:</span>
                                <span>{booking.time}</span>
                            </div>
                        </div>
                        <div className="booking-actions">
                            <button className="action-button accept">
                                Accept
                            </button>
                            <button className="action-button reject">
                                Decline
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}