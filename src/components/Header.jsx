import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Header.css';

export default function Header({ user }) {
    const navigate = useNavigate();
    const initials = user ? `${(user.firstName || '').charAt(0)}${(user.lastName || '').charAt(0)}`.toUpperCase() : '??';

    const handleProfileClick = () => {
        navigate('/profile', { state: { user } });
    };

    return (
        <header className="header">
            <div className="header-content">
                <Link to="/home" className="header-brand">
                    EB Services
                </Link>
                <div className="header-right">
                    <button 
                        className="profile-button" 
                        onClick={handleProfileClick}
                        title="View Profile"
                    >
                        <span className="profile-avatar">{initials}</span>
                        <span className="profile-name">
                            {user?.firstName} {user?.lastName}
                        </span>
                    </button>
                </div>
            </div>
        </header>
    );
}