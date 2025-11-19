import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { API_ENDPOINTS, createApiOptions } from "../utils/validation";
import "./registration.css";

/* registration.jsx */

const initialState = {
    firstName: "",
    lastName: "",
    phoneNumber: "",
    email: "",
    password: "",
    role: "client",
};

export default function Registration() {
    const [form, setForm] = useState(initialState);
    const [errors, setErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState(null);
    const navigate = useNavigate();

    const validate = (values) => {
        const errs = {};
        if (!values.firstName.trim()) errs.firstName = "First name is required";
        if (!values.email.trim()) {
            errs.email = "Email is required";
        } else {
            // basic email pattern
            const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!re.test(values.email)) errs.email = "Invalid email address";
        }
        if (!values.password) {
            errs.password = "Password is required";
        } else if (values.password.length < 6) {
            errs.password = "Password must be at least 6 characters";
        }
        if (!values.role || !["client", "provider"].includes(values.role)) {
            errs.role = "Role must be client or provider";
        }
        return errs;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((s) => ({ ...s, [name]: value }));
        setErrors((es) => ({ ...es, [name]: undefined }));
        setMessage(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const validation = validate(form);
        setErrors(validation);
        if (Object.keys(validation).length) return;

        setSubmitting(true);
        setMessage(null);

        try {
            const res = await fetch(API_ENDPOINTS.REGISTER, createApiOptions("POST", form));
            const data = await res.json().catch(() => ({}));

            if (!res.ok) {
                throw new Error(data.message || "Registration failed");
            }

            // Build user object with token so authenticated requests work
            const token = data?.token;
            // Prefer backend user payload (which should now include an _id) but
            // fall back to the local form values if needed
            const backendUser = data && data.user ? data.user : null;
            const userPayload = backendUser
                ? { ...backendUser, token }
                : {
                    firstName: form.firstName,
                    lastName: form.lastName,
                    email: form.email,
                    phoneNumber: form.phoneNumber,
                    role: form.role,
                    token,
                };
            if (token) {
                try { localStorage.setItem('user', JSON.stringify(userPayload)); } catch (_) {}
            }
            navigate("/home", {
                state: { user: userPayload },
                replace: true,
            });
        } catch (err) {
            setMessage({ type: "error", text: err.message || "Something went wrong" });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="reg-container">
            <form className="reg-form" onSubmit={handleSubmit} noValidate>
                <h2 className="reg-title">Create account</h2>

                <div className="reg-row">
                    <label className="reg-label">
                        First name
                        <input
                            name="firstName"
                            value={form.firstName}
                            onChange={handleChange}
                            className={`reg-input ${errors.firstName ? "invalid" : ""}`}
                            required
                        />
                        {errors.firstName && <div className="reg-error">{errors.firstName}</div>}
                    </label>

                    <label className="reg-label">
                        Last name
                        <input
                            name="lastName"
                            value={form.lastName}
                            onChange={handleChange}
                            className="reg-input"
                        />
                    </label>
                </div>

                <label className="reg-label">
                    Phone number
                    <input
                        name="phoneNumber"
                        value={form.phoneNumber}
                        onChange={handleChange}
                        className="reg-input"
                        placeholder="+1 555 555 5555"
                    />
                </label>

                <label className="reg-label">
                    Email
                    <input
                        name="email"
                        type="email"
                        value={form.email}
                        onChange={handleChange}
                        className={`reg-input ${errors.email ? "invalid" : ""}`}
                        required
                    />
                    {errors.email && <div className="reg-error">{errors.email}</div>}
                </label>

                <label className="reg-label">
                    Password
                    <input
                        name="password"
                        type="password"
                        value={form.password}
                        onChange={handleChange}
                        className={`reg-input ${errors.password ? "invalid" : ""}`}
                        required
                    />
                    {errors.password && <div className="reg-error">{errors.password}</div>}
                </label>

                <div className="form-group">
                    <label>Register As</label>
                    <div style={{ display: 'flex', gap: '16px', marginTop: '8px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <input
                                type="radio"
                                name="role"
                                value="client"
                                checked={form.role === 'client'}
                                onChange={handleChange}
                            />
                            Client
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <input
                                type="radio"
                                name="role"
                                value="provider"
                                checked={form.role === 'provider'}
                                onChange={handleChange}
                            />
                            Service Provider
                        </label>
                    </div>
                    {errors.role && <div className="reg-error">{errors.role}</div>}
                </div>

                <button className="reg-button" type="submit" disabled={submitting}>
                    {submitting ? "Submitting..." : "Register"}
                </button>

                <div style={{display:'flex', alignItems:'center', gap:8, marginTop:12}}>
                    <div style={{height:1, background:'#e5e7eb', flex:1}}></div>
                    <div style={{color:'#6b7280', fontSize:12}}>or</div>
                    <div style={{height:1, background:'#e5e7eb', flex:1}}></div>
                </div>
                <button
                    type="button"
                    className="btn-secondary"
                    style={{width:'100%', marginTop:8}}
                    onClick={() => {
                        // Ensure we have a valid role before proceeding
                        const role = form.role === 'provider' ? 'provider' : 'client';
                        window.location.href = `${API_ENDPOINTS.AUTH_GOOGLE_LOGIN}?role=${encodeURIComponent(role)}`;
                    }}
                >
                    Continue with Google as {form.role === 'provider' ? 'Service Provider' : 'Client'}
                </button>

                <div className="reg-footer">
                    <Link to="/" className="reg-login-link">Already have an account? Log in</Link>
                </div>

                {message && (
                    <div className={`reg-message ${message.type === "error" ? "error" : "success"}`}>
                        {message.text}
                    </div>
                )}
            </form>
        </div>
    );
}