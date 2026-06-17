import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../api/api.js";

const VerifyOtp = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const { email, phone } = location.state || {};

  const [method, setMethod] = useState("email");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [timer, setTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!email && !phone) {
      navigate("/register");
      return;
    }
  }, [email, phone, navigate]);

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
      return () => clearInterval(interval);
    }
    setCanResend(true);
  }, [timer]);

  const handleChange = (value, index) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      document.getElementById(`otp-${index + 1}`)?.focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`)?.focus();
    }
  };

  const handleVerify = async () => {
    const otpValue = otp.join("");

    if (otpValue.length !== 6) {
      return setError("Please enter a complete 6-digit OTP");
    }

    setError("");
    setLoading(true);

    try {
      const params =
        method === "email" ? { email, otp: otpValue } : { phone, otp: otpValue };

      await api.get("/auth/signupVerifyOtp", { params });

      const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
      localStorage.setItem(
        "user",
        JSON.stringify({ ...storedUser, isVerified: true })
      );

      navigate("/profile");
    } catch (err) {
      setError(err.response?.data?.message || "OTP verification failed");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend) return;
    setError("");

    try {
      await api.post("/auth/resend-otp", {
        ...(method === "email" ? { email } : { phone }),
        type: "signup",
      });
      setTimer(30);
      setCanResend(false);
      setOtp(["", "", "", "", "", ""]);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to resend OTP");
    }
  };

  return (
    <div className="verify-container">
      <div className="verify-card">
        <div className="lock-icon">🔒</div>
        <h1>Verify Account</h1>
        <p className="subtitle">We've sent a verification code to</p>

        <div className="contact-box">
          {method === "email" ? email : phone}
        </div>

        <div className="method-switch">
          <button
            className={method === "email" ? "active" : ""}
            onClick={() => { setMethod("email"); setOtp(["", "", "", "", "", ""]); }}
          >
            Email OTP
          </button>
          <button
            className={method === "mobile" ? "active" : ""}
            onClick={() => { setMethod("mobile"); setOtp(["", "", "", "", "", ""]); }}
          >
            Mobile OTP
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}

        <label>Enter Verification Code</label>

        <div className="otp-boxes">
          {otp.map((digit, index) => (
            <input
              key={index}
              id={`otp-${index}`}
              type="text"
              maxLength="1"
              value={digit}
              onChange={(e) => handleChange(e.target.value, index)}
              onKeyDown={(e) => handleKeyDown(e, index)}
            />
          ))}
        </div>

        <button className="verify-btn" onClick={handleVerify} disabled={loading}>
          {loading ? "Verifying..." : "Verify OTP"}
        </button>

        <div className="otp-footer">
          {canResend ? (
            <button className="resend-btn" onClick={handleResend}>
              Resend OTP
            </button>
          ) : (
            <p className="timer">
              Resend OTP in <span>00:{timer < 10 ? `0${timer}` : timer}</span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerifyOtp;