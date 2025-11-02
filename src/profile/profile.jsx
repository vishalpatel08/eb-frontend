import React from 'react';
import { useLocation } from 'react-router-dom';
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
    // Expect payload from login: { message, token, user: { firstName, lastName, email, phoneNumber, role } }
    const received = location && location.state;
    console.log('Profile received state:', received);
    const user = (received && received.user) || received || defaultUser;
    const { firstName, lastName, email, phoneNumber, role } = user || defaultUser;
    const initials = `${(firstName || '').charAt(0)}${(lastName || '').charAt(0)}`.toUpperCase();

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
        </div>
    );
}