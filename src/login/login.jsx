import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Input from "../components/Input";
import Button from "../components/Button";
import { emailIsValid, passwordIsValid, API_ENDPOINTS, createApiOptions } from "../utils/validation";
import "./login.css";

export default function Login({ onSuccess }) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        // Validate inputs
        if (!emailIsValid(email)) {
            setError("Please enter a valid email address.");
            return;
        }
        if (!passwordIsValid(password)) {
            setError("Password must be at least 6 characters.");
            return;
        }

        setLoading(true);
        try {
            const res = await fetch(API_ENDPOINTS.LOGIN, createApiOptions("POST", { email, password }));
            const data = await res.json().catch(() => null);

            if (!res.ok) {
                throw new Error((data && data.message) || `Login failed (${res.status})`);
            }

            // Handle success
            if (onSuccess) {
                onSuccess(data);
            }
            // Be flexible with payload shape: some APIs return the user directly,
            // others wrap it as { user }
            const userPayload = (data && (data.user || data)) || { email };
            navigate("/home", { state: { user: userPayload }, replace: true });
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
                    label="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    autoComplete="email"
                />

                <div className="password-row">
                    <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        label="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
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

                {error && <div className="error">{error}</div>}

                <Button
                    type="submit"
                    loading={loading}
                    disabled={loading}
                >
                    Sign in
                </Button>

                <div className="reg-footer">
                    <Link to="/register" className="reg-login-link">
                        New user? Register Now
                    </Link>
                </div>
            </form>
        </div>
    );
};
