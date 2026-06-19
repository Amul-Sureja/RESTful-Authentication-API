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
      if (err.response?.status === 429) {
        setError(err.response.data.message);
      } else if (err.response?.status === 400) {
        setError(err.response.data.message);
      } else {
        setSent(true);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="login">
      <div className="login-card">
        <div style={{ textAlign: 'center', fontSize: '2.5rem', marginBottom: '8px' }}>🔑</div>
        <h1>Forgot Password</h1>

        {error && (
          <div className="error-message" style={{
            background: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#dc2626',
            padding: '12px',
            borderRadius: '8px',
            marginBottom: '16px',
            fontSize: '0.9rem'
          }}>
            {error}
          </div>
        )}

        {sent ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{
              background: '#f0fdf4',
              border: '1px solid #bbf7d0',
              color: '#16a34a',
              padding: '16px',
              borderRadius: '10px',
              marginBottom: '16px',
              fontSize: '0.95rem',
              fontWeight: '600'
            }}>
              ✅ Request received!
            </div>
            <p style={{ color: '#6b7280', fontSize: '0.9rem', lineHeight: '1.7' }}>
              If <strong>{email}</strong> is registered, a password reset link
              has been sent. Check your <strong>backend terminal</strong> for
              the link and click it to reset your password.
            </p>
            <p style={{ color: '#9ca3af', fontSize: '0.8rem', marginTop: '10px' }}>
              The link expires in <strong>15 minutes</strong>.
            </p>
          </div>
        ) : (
          <>
            <p style={{
              color: '#6b7280',
              fontSize: '0.9rem',
              textAlign: 'center',
              marginBottom: '24px',
              lineHeight: '1.6'
            }}>
              Enter your registered email address and we'll send you a
              password reset link.
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
                  style={{ width: '100%' }}
                />
              </div>

              <button
                type="submit"
                className="login-btn"
                disabled={loading}
                style={{ marginTop: '8px' }}
              >
                {loading ? 'Please wait...' : 'Send Reset Link'}
              </button>
            </form>
          </>
        )}

        <p className="register-link" style={{ marginTop: '24px' }}>
          Remember your password?{' '}
          <Link to="/login" style={{ color: '#2563eb', fontWeight: '600' }}>
            Back to Login
          </Link>
        </p>
      </div>
    </section>
  );
};

export default ForgotPassword;