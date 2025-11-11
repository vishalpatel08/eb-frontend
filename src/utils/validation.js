// Validate email format
export const emailIsValid = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

// Validate password length
export const passwordIsValid = (password, minLength = 6) => password.length >= minLength;

// API endpoints
export const API_ENDPOINTS = {
    LOGIN: 'http://localhost:4000/login',
    REGISTER: 'http://localhost:4000/registration',
    BOOKING: 'http://localhost:4000/booking',
    BOOKINGS_ME: 'http://localhost:4000/bookings/me',
    PROVIDER_BOOKINGS_ME: 'http://localhost:4000/providers/me/bookings',
    SERVICE_CREATE: 'http://localhost:4000/service',
    UPDATE_SCHEDULE: 'http://localhost:4000/updateschedule',
    BOOKING_STATUS_BASE: 'http://localhost:4000/bookings'
};

export const bookingStatusUrl = (bookingId) => `${API_ENDPOINTS.BOOKING_STATUS_BASE}/${bookingId}/status`;

// Provider list endpoint
API_ENDPOINTS.PROVIDERS = 'http://localhost:4000/providers';

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