import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

import '../styles/AdminLogin.css';

const AdminLogin = () => {
  const { adminLogin, isAuthenticated, loading } = useContext(AuthContext);
  const navigate = useNavigate();
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && !loading) {
      navigate('/admin/dashboard');
    }
  }, [isAuthenticated, loading, navigate]);

  const handleChange = e => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value });
    // Clear error when user types
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    
    try {
      const result = await adminLogin(credentials);
      
      if (result.success) {
        navigate('/admin/dashboard');
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('Login failed. Please try again.');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <div className="admin-login">Loading...</div>;
  }

  return (
    <div className="admin-login">
      <h2>Admin Login</h2>
      {error && <div className="error-message">{error}</div>}
      <form onSubmit={handleSubmit}>
        <label>Email:</label>
        <input 
          type="text" 
          name="email" 
          value={credentials.email} 
          onChange={handleChange} 
          required 
          disabled={isSubmitting}
        />

        <label>Password:</label>
        <input 
          type="password" 
          name="password" 
          value={credentials.password} 
          onChange={handleChange} 
          required 
          disabled={isSubmitting}
        />

        <button 
          type="submit" 
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Logging in...' : 'Login as Admin'}
        </button>
      </form>
    </div>
  );
};

export default AdminLogin;