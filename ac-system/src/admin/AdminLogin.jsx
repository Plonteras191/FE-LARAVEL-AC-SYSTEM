import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

import '../styles/AdminLogin.css';

const AdminLogin = () => {
  const { adminLogin } = useContext(AuthContext);
  const navigate = useNavigate();
  const [credentials, setCredentials] = useState({ email: '', password: '' });

  const handleChange = e => setCredentials({ ...credentials, [e.target.name]: e.target.value });

  const handleSubmit = e => {
    e.preventDefault();
    adminLogin(credentials);
    navigate('/admin/dashboard'); 
  };

  return (
    <div className="admin-login">
      <h2>Admin Login</h2>
      <form onSubmit={handleSubmit}>
        <label>Email:</label>
        <input type="email" name="email" value={credentials.email} onChange={handleChange} required />

        <label>Password:</label>
        <input type="password" name="password" value={credentials.password} onChange={handleChange} required />

        <button type="submit">Login as Admin</button>
      </form>
    </div>
  );
};

export default AdminLogin;