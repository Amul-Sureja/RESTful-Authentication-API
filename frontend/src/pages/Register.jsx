import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/api.js';

const Register = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    countryCode: '+91',
    phone: '',
    password: '',
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.post('/auth/register', form);
      const { user, accessToken } = response.data;

      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem(
        'user',
        JSON.stringify({
          name: user.name,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: user.phone,
          countryCode: user.countryCode,
          role: user.role,
          isVerified: user.isVerified,
          status: user.status,
        })
      );

      navigate('/verify-otp', {
        state: { email: form.email, phone: form.phone },
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="register">
      <form className="register-form" onSubmit={handleSubmit}>
        <h1>Create Account</h1>

        {error && <div className="error-message">{error}</div>}

        <div className="form-group">
          <label htmlFor="firstName">First Name</label>
          <input
            id="firstName"
            name="firstName"
            type="text"
            placeholder="Enter your first name"
            required
            value={form.firstName}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label htmlFor="lastName">Last Name</label>
          <input
            id="lastName"
            name="lastName"
            type="text"
            placeholder="Enter your last name"
            required
            value={form.lastName}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label htmlFor="email">Email Address</label>
          <input
            id="email"
            name="email"
            type="email"
            placeholder="Enter your email"
            required
            value={form.email}
            onChange={handleChange}
          />
        </div>

        <div className="phone-group">
          <div className="form-group country-code">
            <label htmlFor="countryCode">Country Code</label>
            <input
              id="countryCode"
              name="countryCode"
              type="text"
              placeholder="+91"
              required
              value={form.countryCode}
              onChange={handleChange}
            />
          </div>

          <div className="form-group phone-number">
            <label htmlFor="phone">Phone Number</label>
            <input
              id="phone"
              name="phone"
              type="tel"
              placeholder="Enter 10-digit phone number"
              required
              value={form.phone}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            placeholder="Min 8 characters"
            required
            minLength={8}
            value={form.password}
            onChange={handleChange}
          />
        </div>

        <button type="submit" className="register-btn" disabled={loading}>
          {loading ? 'Registering...' : 'Register'}
        </button>

        <p className="login-text">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </form>
    </section>
  );
};

export default Register;