import React from 'react';
import { useLocation, Navigate } from 'react-router-dom';
import Header from '../components/Header';
import ProviderList from '../components/ProviderList';
import ClientList from '../components/ClientList';
import './Home.css';

export default function Home() {
    const location = useLocation();
    const user = location.state?.user;

    // Redirect to login if no user data
    if (!user) {
        return <Navigate to="/" replace />;
    }

    return (
        <div className="home-layout">
            <Header user={user} />
            <main className="home-content">
                {user.role === 'client' ? (
                    <ProviderList user={user} />
                ) : (
                    <ClientList user={user} />
                )}
            </main>
        </div>
    );
}