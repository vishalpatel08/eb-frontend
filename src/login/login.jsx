import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Input from "../components/Input";
import Button from "../components/Button";
import { emailIsValid, passwordIsValid, API_ENDPOINTS, createApiOptions } from "../utils/validation";
import "./login.css";

export default function Login({ onSuccess }) {
    const [formData, setFormData] = useState({
        email: "",
        password: "",
        role: "client", // Default role
    });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        // Validate inputs
        if (!emailIsValid(formData.email)) {
            setError("Please enter a valid email address.");
            return;
        }
        if (!passwordIsValid(formData.password)) {
            setError("Password must be at least 6 characters.");
            return;
        }

        setLoading(true);
        try {
            const res = await fetch(API_ENDPOINTS.LOGIN, createApiOptions("POST", { email: formData.email, password: formData.password, role: formData.role }));
            const data = await res.json().catch(() => null);

            if (!res.ok) {
                throw new Error((data && data.message) || `Login failed (${res.status})`);
            }

            if (onSuccess) {
                onSuccess(data);
            }
            const userPayload = (data && (data.user || data)) || { email: formData.email };
            const userWithToken = { ...userPayload, token: data?.token || userPayload?.token };
            try {
                localStorage.setItem('user', JSON.stringify(userWithToken));
            } catch {}
            navigate("/home", { state: { user: userWithToken }, replace: true });
        } catch (err) {
            setError(err.message || "Login failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">
            <form className="login-form" onSubmit={handleSubmit} noValidate>
                <h2 className="login-title">Sign in</h2>

                <Input
                    id="email"
                    type="email"
                    name="email"
                    label="Email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="you@example.com"
                    required
                    autoComplete="email"
                />

                <div className="password-row">
                    <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        name="password"
                        label="Password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="Enter your password"
                        required
                        autoComplete="current-password"
                    />
                    <button
                        type="button"
                        className="toggle-btn"
                        onClick={() => setShowPassword((s) => !s)}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                        {showPassword ? "Hide" : "Show"}
                    </button>
                </div>

                <div className="form-group">
                    <label>Login As</label>
                    <div className="radio-row">
                        <label className="radio-label">
                            <input
                                type="radio"
                                name="role"
                                value="client"
                                checked={formData.role === 'client'}
                                onChange={handleChange}
                            />
                            Client
                        </label>
                        <label className="radio-label">
                            <input
                                type="radio"
                                name="role"
                                value="provider"
                                checked={formData.role === 'provider'}
                                onChange={handleChange}
                            />
                            Service Provider
                        </label>
                    </div>
                </div>

                {error && <div className="error">{error}</div>}

                <Button
                    type="submit"
                    loading={loading}
                    disabled={loading}
                >
                    Sign in
                </Button>

                <div className="or-row">
                    <div className="or-line"></div>
                    <div className="or-text">or</div>
                    <div className="or-line"></div>
                </div>
                <button
                    type="button"
                    className="btn-secondary full-width"
                    onClick={() => { window.location.href = API_ENDPOINTS.AUTH_GOOGLE_LOGIN}}
                >
                    Continue with Google
                </button>

                <div className="reg-footer">
                    <Link to="/register" className="reg-login-link">
                        New user? Register Now
                    </Link>
                </div>
            </form>
        </div>
    );
};
