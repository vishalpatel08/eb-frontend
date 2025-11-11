import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './profile.css';

const ROLE_LABELS = {
    client: 'Client',
    provider: 'Provider',
};

const defaultUser = {
    firstName: 'Vishal',
    lastName: 'Patel',
    email: 'vishal.patel@example.com',
    phoneNumber: '+1 (555) 123-4567',
    role: 'client', // 'client' or 'provider'
};

export default function Profile() {
    const location = useLocation();
    const navigate = useNavigate();
    const received = location && location.state;
    const storedUser = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || 'null') : null;
    const user = (received && received.user) || received || storedUser || defaultUser;
    const { firstName, lastName, email, phoneNumber, role } = user || defaultUser;
    const initials = `${(firstName || '').charAt(0)}${(lastName || '').charAt(0)}`.toUpperCase();

    const goToBookings = () => {
        navigate('/bookings', { state: { user } });
    };

    return (
        <div className="profile-card">
            <div className="profile-header">
                <div className="avatar">{initials}</div>
                <div className="title">
                    <h2 className="name">{firstName} {lastName}</h2>
                    <span className={`role-badge ${role}`}>{ROLE_LABELS[role] || role}</span>
                </div>
            </div>

            <div className="profile-body">
                <div className="row">
                    <div className="label">Email</div>
                    <div className="value">{email}</div>
                </div>
                <div className="row">
                    <div className="label">Phone</div>
                    <div className="value">{phoneNumber}</div>
                </div>
                <div className="row">
                    <div className="label">Role</div>
                    <div className="value">{ROLE_LABELS[role] || role}</div>
                </div>
            </div>

            <div className="profile-actions" style={{gap: 8, flexWrap: 'wrap'}}>
                <button className="btn-primary" onClick={goToBookings}>My Bookings</button>
                {role === 'provider' && (
                  <>
                    <button className="btn-secondary" onClick={() => navigate('/provider/bookings', { state: { user } })}>Clients' Bookings</button>
                    <button className="btn-secondary" onClick={() => navigate('/provider/service/new', { state: { user } })}>Create Service</button>
                    <button className="btn-secondary" onClick={() => navigate('/provider/schedule', { state: { user } })}>Edit Schedule</button>
                  </>
                )}
            </div>
        </div>
    );
}