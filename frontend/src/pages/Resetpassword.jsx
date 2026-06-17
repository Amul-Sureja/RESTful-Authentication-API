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

      setTimeout(() => navigate('/login'), 2500);
    } catch (err) {
      setError(err.response?.data?.message || 'Reset failed. Link may be expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="login">
      <div className="login-card">
        <div style={{ textAlign: 'center', fontSize: '2.5rem', marginBottom: '8px' }}>🔒</div>
        <h1>Reset Password</h1>
        <p style={{ color: '#6b7280', fontSize: '0.9rem', textAlign: 'center', marginBottom: '24px' }}>
          Enter your new password below.
        </p>

        {error && <div className="error-message">{error}</div>}
        {success && (
          <div className="success-message">
            {success} Redirecting to login...
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
              />
            </div>

            <div className="form-group">
              <label>Confirm Password</label>
              <input
                type="password"
                placeholder="Re-enter new password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>

            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        )}

        <p className="register-link" style={{ marginTop: '20px' }}>
          <Link to="/login">Back to Login</Link>
        </p>
      </div>
    </section>
  );
};

export default ResetPassword;