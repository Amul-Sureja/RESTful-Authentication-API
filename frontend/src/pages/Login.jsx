import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api/api.js";

const Login = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("email");

  // Email login state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Phone OTP login state
  const [countryCode, setCountryCode] = useState("+91");
  const [phone, setPhone] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");

  const [error, setError] = useState("");
  const [attemptsLeft, setAttemptsLeft] = useState(null);
  const [loading, setLoading] = useState(false);

  // ── Email login ──
  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setError("");
    setAttemptsLeft(null);
    setLoading(true);

    try {
      const response = await api.post("/auth/login", { email, password });
      const { user, accessToken } = response.data;
      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("user", JSON.stringify(user));
      navigate("/profile");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── Send phone OTP ──
  const handleSendOtp = async () => {
    if (!phone) return setError("Please enter a phone number");
    setError("");
    setAttemptsLeft(null);
    setLoading(true);

    try {
      await api.post("/auth/login", { phone, countryCode });
      setOtpSent(true);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  // ── Verify phone OTP ──
  const handleOtpLogin = async (e) => {
    e.preventDefault();
    setError("");
    setAttemptsLeft(null);
    setLoading(true);

    try {
      const response = await api.get("/auth/loginVerifyOtp", {
        params: { phone, otp },
      });
      const { user, accessToken } = response.data;
      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("user", JSON.stringify(user));
      navigate("/profile");
    } catch (err) {
      const data = err.response?.data;
      setError(data?.message || "OTP verification failed");
      if (data?.attemptsLeft !== undefined) {
        setAttemptsLeft(data.attemptsLeft);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="login">
      <div className="login-card">
        <h1>Welcome Back</h1>

        <div className="tabs">
          <button
            className={activeTab === "email" ? "active" : ""}
            onClick={() => { setActiveTab("email"); setError(""); setAttemptsLeft(null); }}
            type="button"
          >
            Email Login
          </button>
          <button
            className={activeTab === "otp" ? "active" : ""}
            onClick={() => { setActiveTab("otp"); setError(""); setAttemptsLeft(null); }}
            type="button"
          >
            Mobile OTP
          </button>
        </div>

        {error && (
          <div className="error-message">
            {error}
            {attemptsLeft !== null && (
              <div style={{
                marginTop: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}>
                <span>Attempts remaining:</span>
                <div style={{ display: 'flex', gap: '4px' }}>
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      style={{
                        width: '20px',
                        height: '8px',
                        borderRadius: '4px',
                        background: i < attemptsLeft ? '#dc2626' : '#fecaca',
                      }}
                    />
                  ))}
                </div>
                <span style={{ fontWeight: '700' }}>{attemptsLeft}/5</span>
              </div>
            )}
          </div>
        )}

        {activeTab === "email" ? (
          <form onSubmit={handleEmailLogin}>
            <div className="form-group">
              <label>Email Address</label>
              <input
                type="email"
                placeholder="Enter your email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                placeholder="Enter your password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <p className="forgot-link">
              <Link to="/forgot-password">Forgot password?</Link>
            </p>

            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleOtpLogin}>
            <div className="phone-group">
              <div className="form-group code">
                <label>Code</label>
                <input
                  type="text"
                  placeholder="+91"
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  required
                />
              </div>

              <div className="form-group number">
                <label>Mobile Number</label>
                <input
                  type="tel"
                  placeholder="Enter mobile number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>
            </div>

            {otpSent && (
              <div className="form-group">
                <label>Enter OTP</label>
                <input
                  type="text"
                  placeholder="6-digit OTP"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  required
                />
              </div>
            )}

            {!otpSent ? (
              <button
                type="button"
                className="login-btn"
                onClick={handleSendOtp}
                disabled={loading}
              >
                {loading ? "Sending..." : "Send OTP"}
              </button>
            ) : (
              <button type="submit" className="login-btn" disabled={loading}>
                {loading ? "Verifying..." : "Verify & Login"}
              </button>
            )}
          </form>
        )}

        <p className="register-link">
          Don't have an account? <Link to="/register">Register</Link>
        </p>
      </div>
    </section>
  );
};

export default Login;