// Validate email format
export const emailIsValid = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

// Validate password length
export const passwordIsValid = (password, minLength = 6) => password.length >= minLength;

// API base and endpoints
import { API_BASE_URL } from '../config';

export const API_BASE = API_BASE_URL;

const join = (base, path) => `${String(base).replace(/\/+$/,'')}/${String(path).replace(/^\/+/, '')}`;

export const API_ENDPOINTS = {
    LOGIN: join(API_BASE, '/login'),
    REGISTER: join(API_BASE, '/registration'),
    BOOKING: join(API_BASE, '/booking'),
    BOOKINGS_ME: join(API_BASE, '/bookings/me'),
    PROVIDER_BOOKINGS_ME: join(API_BASE, '/providers/me/bookings'),
    SERVICE_CREATE: join(API_BASE, '/service'),
    PROVIDER_REGISTER: join(API_BASE, '/provider'),
    UPDATE_SCHEDULE: join(API_BASE, '/updateschedule'),
    BOOKING_STATUS_BASE: join(API_BASE, '/bookings'),
    AUTH_GOOGLE_LOGIN: join(API_BASE, '/auth/google/login')
};

export const bookingStatusUrl = (bookingId) => `${API_ENDPOINTS.BOOKING_STATUS_BASE}/${bookingId}/status`;

// Provider list endpoint
API_ENDPOINTS.PROVIDERS = join(API_BASE, '/providers');

// Handle API errors consistently
export const handleApiError = (error) => {
    if (error.response?.data?.message) {
        return error.response.data.message;
    }
    return error.message || 'An unexpected error occurred. Please try again.';
};

// Format API request options
export const createApiOptions = (method, data) => ({
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
});

export const createGetOptions = (token) => ({
    method: 'GET',
    headers: token ? { Authorization: `Bearer ${token}` } : {}
});

export const createPutOptions = (bodyData, token = null) => {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return { method: 'PUT', headers, body: JSON.stringify(bodyData) };
};

export const createPostOptions = (bodyData, token = null) => {
    const headers = {
        'Content-Type': 'application/json',
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return {
        method: 'POST',
        headers,
        body: JSON.stringify(bodyData),
    };
};

export const createPutOptionsForStatusUpdate = (bodyData, token = null) => {
    const headers = {
        'Content-Type': 'application/json',
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return {
        method: 'PUT',
        headers,
        body: JSON.stringify(bodyData),
    };
};

export const buildBookingStatusUrl = (bookingId) => `${API_ENDPOINTS.BOOKING_STATUS_BASE}/${bookingId}/status`;