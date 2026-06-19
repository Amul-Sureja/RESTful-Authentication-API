import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api/api.js';

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword.length < 8) {
      return setError('Password must be at least 8 characters.');
    }

    if (newPassword !== confirmPassword) {
      return setError('Passwords do not match.');
    }

    setLoading(true);

    try {
      const res = await api.post(`/auth/reset-password/${token}`, { newPassword });
      setSuccess(res.data.message || 'Password reset successfully!');

      // Redirect to login after 2.5 seconds
      setTimeout(() => navigate('/login'), 2500);
    } catch (err) {
      setError(err.response?.data?.message || 'Reset failed. The link may be invalid or expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="login">
      <div className="login-card">
        <div style={{ textAlign: 'center', fontSize: '2.5rem', marginBottom: '8px' }}>🔒</div>
        <h1>Reset Password</h1>

        <p style={{
          color: '#6b7280',
          fontSize: '0.9rem',
          textAlign: 'center',
          marginBottom: '24px',
          lineHeight: '1.6'
        }}>
          Enter your new password below. The link expires in <strong>15 minutes</strong>.
        </p>

        {error && (
          <div style={{
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

        {success && (
          <div style={{
            background: '#f0fdf4',
            border: '1px solid #bbf7d0',
            color: '#16a34a',
            padding: '16px',
            borderRadius: '10px',
            marginBottom: '16px',
            fontSize: '0.95rem',
            fontWeight: '600',
            textAlign: 'center'
          }}>
            ✅ {success}
            <p style={{ fontWeight: '400', fontSize: '0.85rem', marginTop: '6px', color: '#15803d' }}>
              Redirecting to login...
            </p>
          </div>
        )}

        {!success && (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>New Password</label>
              <input
                type="password"
                placeholder="Min 8 characters"
                required
                minLength={8}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                style={{ width: '100%' }}
              />
            </div>

            <div className="form-group">
              <label>Confirm New Password</label>
              <input
                type="password"
                placeholder="Re-enter new password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                style={{ width: '100%' }}
              />
            </div>

            {/* Password strength hint */}
            {newPassword.length > 0 && newPassword.length < 8 && (
              <p style={{ color: '#f59e0b', fontSize: '0.8rem', marginBottom: '12px' }}>
                ⚠️ Password must be at least 8 characters
              </p>
            )}

            {newPassword.length >= 8 && confirmPassword.length > 0 && newPassword !== confirmPassword && (
              <p style={{ color: '#ef4444', fontSize: '0.8rem', marginBottom: '12px' }}>
                ✗ Passwords do not match
              </p>
            )}

            {newPassword.length >= 8 && confirmPassword.length > 0 && newPassword === confirmPassword && (
              <p style={{ color: '#16a34a', fontSize: '0.8rem', marginBottom: '12px' }}>
                ✓ Passwords match
              </p>
            )}

            <button
              type="submit"
              className="login-btn"
              disabled={loading}
              style={{ marginTop: '4px' }}
            >
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        )}

        <p className="register-link" style={{ marginTop: '20px' }}>
          <Link to="/login" style={{ color: '#2563eb', fontWeight: '600' }}>
            ← Back to Login
          </Link>
        </p>
      </div>
    </section>
  );
};

export default ResetPassword;