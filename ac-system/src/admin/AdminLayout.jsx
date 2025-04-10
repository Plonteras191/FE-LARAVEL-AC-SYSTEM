// src/components/AdminLayout.jsx
import React, { useContext } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import PageWrapper from '../components/PageWrapper';
import { AuthContext } from '../context/AuthContext';
import '../styles/AdminLayout.css';

const AdminLayout = () => {
  const { logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  return (
    <div className="admin-dashboard">
      <aside className="sidebar">
        <ul>
          <li>
            <NavLink to="/admin/dashboard" className={({ isActive }) => isActive ? 'active' : ''}>
              Dashboard Home
            </NavLink>
          </li>
          <li>
            <NavLink to="/admin/appointments" className={({ isActive }) => isActive ? 'active' : ''}>
              Appointments
            </NavLink>
          </li>
          <li>
            <NavLink to="/admin/admin-booking" className={({ isActive }) => isActive ? 'active' : ''}>
              Admin Booking
            </NavLink>
          </li>
          <li>
            <NavLink to="/admin/reports" className={({ isActive }) => isActive ? 'active' : ''}>
              Reports
            </NavLink>
          </li>
          <li>
            <NavLink to="/admin/calendar" className={({ isActive }) => isActive ? 'active' : ''}>
              Calendar
            </NavLink>
          </li>
          <li>
            <NavLink to="/admin/revenue" className={({ isActive }) => isActive ? 'active' : ''}>
              Revenue
            </NavLink>
          </li>
          <li>
            <NavLink to="/admin/revenue-history" className={({ isActive }) => isActive ? 'active' : ''}>
              Revenue History
            </NavLink>
          </li>
        </ul>
        <div className="sidebar-footer">
          <button className="logout-button" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </aside>
      <main className="dashboard-main">
        <PageWrapper>
          <Outlet />
        </PageWrapper>
      </main>
    </div>
  );
};

export default AdminLayout;
