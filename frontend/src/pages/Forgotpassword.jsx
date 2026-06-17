import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await axios.post('/api/auth/forgot-password', { email });
      setSent(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="login">
      <div className="login-card">
        <div style={{ textAlign: 'center', fontSize: '2.5rem', marginBottom: '8px' }}>🔑</div>
        <h1>Forgot Password</h1>

        {error && <div className="error-message">{error}</div>}

        {sent ? (
          <div style={{ textAlign: 'center' }}>
            <div className="success-message">Request sent successfully!</div>
            <p style={{ color: '#6b7280', fontSize: '0.9rem', marginTop: '12px', lineHeight: '1.6' }}>
              Check your <strong>backend terminal</strong> for the reset link and click it to reset your password.
            </p>
          </div>
        ) : (
          <>
            <p style={{ color: '#6b7280', fontSize: '0.9rem', textAlign: 'center', marginBottom: '24px' }}>
              Enter your registered email to reset your password.
            </p>
            <form onSubmit={handleSubmit}>
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
              <button type="submit" className="login-btn" disabled={loading}>
                {loading ? 'Please wait...' : 'Send Reset Link'}
              </button>
            </form>
          </>
        )}

        <p className="register-link" style={{ marginTop: '20px' }}>
          Remember your password? <Link to="/login">Login</Link>
        </p>
      </div>
    </section>
  );
};

export default ForgotPassword;