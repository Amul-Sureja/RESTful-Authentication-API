import React, { useState, useEffect, useRef } from "react";
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

  // Resend OTP timer state
  const [timer, setTimer] = useState(0);
  const [canResend, setCanResend] = useState(false);
  const timerRef = useRef(null);

  const [error, setError] = useState("");
  const [attemptsLeft, setAttemptsLeft] = useState(null);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  // Start 30-second countdown after OTP is sent
  const startTimer = () => {
    setTimer(30);
    setCanResend(false);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

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
      startTimer();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  // ── Resend phone OTP ──
  const handleResendOtp = async () => {
    if (!canResend) return;
    setError("");
    setAttemptsLeft(null);
    setResendLoading(true);

    try {
      await api.post("/auth/resend-otp", {
        phone,
        countryCode,
        type: "login",
      });
      setOtp("");
      startTimer();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to resend OTP");
    } finally {
      setResendLoading(false);
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
            onClick={() => {
              setActiveTab("email");
              setError("");
              setAttemptsLeft(null);
              setOtpSent(false);
              if (timerRef.current) clearInterval(timerRef.current);
            }}
            type="button"
          >
            Email Login
          </button>
          <button
            className={activeTab === "otp" ? "active" : ""}
            onClick={() => {
              setActiveTab("otp");
              setError("");
              setAttemptsLeft(null);
              setOtpSent(false);
              if (timerRef.current) clearInterval(timerRef.current);
            }}
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
                marginTop: "8px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}>
                <span>Attempts remaining:</span>
                <div style={{ display: "flex", gap: "4px" }}>
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      style={{
                        width: "20px",
                        height: "8px",
                        borderRadius: "4px",
                        background: i < attemptsLeft ? "#dc2626" : "#fecaca",
                      }}
                    />
                  ))}
                </div>
                <span style={{ fontWeight: "700" }}>{attemptsLeft}/5</span>
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

            <div className="divider">
              <span>OR</span>
            </div>

            <button
              type="button"
              className="google-btn"
              onClick={() => {
                console.log("Google Sign In");
              }}
            >
              <img
                src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                alt="Google"
              />
              <span>Continue in with Google</span>
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
                  disabled={otpSent}
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
                  disabled={otpSent}
                />
              </div>
            </div>

            {otpSent && (
              <>
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

                {/* Resend OTP row */}
                <div style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "16px",
                  fontSize: "0.875rem",
                }}>
                  {canResend ? (
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={resendLoading}
                      style={{
                        background: "none",
                        border: "none",
                        color: resendLoading ? "#93c5fd" : "#2563eb",
                        fontWeight: "600",
                        cursor: resendLoading ? "not-allowed" : "pointer",
                        padding: 0,
                        fontSize: "0.875rem",
                      }}
                    >
                      {resendLoading ? "Resending..." : "Resend OTP"}
                    </button>
                  ) : (
                    <span style={{ color: "#6b7280" }}>
                      Resend OTP in{" "}
                      <span style={{ color: "#2563eb", fontWeight: "700" }}>
                        00:{timer < 10 ? `0${timer}` : timer}
                      </span>
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setOtpSent(false);
                      setOtp("");
                      setError("");
                      setAttemptsLeft(null);
                      if (timerRef.current) clearInterval(timerRef.current);
                    }}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#64748b",
                      cursor: "pointer",
                      fontSize: "0.875rem",
                      textDecoration: "underline",
                    }}
                  >
                    Change number
                  </button>
                </div>
              </>
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