// Validate email format
export const emailIsValid = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

// Validate password length
export const passwordIsValid = (password, minLength = 6) => password.length >= minLength;

// API endpoints
export const API_ENDPOINTS = {
    LOGIN: 'http://localhost:4000/login',
    REGISTER: 'http://localhost:4000/register'
};

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