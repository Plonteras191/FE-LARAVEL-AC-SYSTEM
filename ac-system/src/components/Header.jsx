import React from 'react';
import { NavLink } from 'react-router-dom';
import '../styles/Header.css';

const Header = () => {
  return (
    <header className="header">
      <div className="logo">❄️ EER Aircon Service</div>
      <nav>
        <ul>
          <li>
            <NavLink to="/" end className={({ isActive }) => (isActive ? 'active' : '')}>
              Home
            </NavLink>
          </li>
          <li>
            <NavLink to="/about" className={({ isActive }) => (isActive ? 'active' : '')}>
              About Us
            </NavLink>
          </li>
          <li>
            <NavLink to="/services" className={({ isActive }) => (isActive ? 'active' : '')}>
              Services
            </NavLink>
          </li>
          <li>
            <NavLink to="/booking" className={({ isActive }) => (isActive ? 'active' : '')}>
              Book Appointment
            </NavLink>
          </li>
          <li>
            <NavLink to="/call-us" className={({ isActive }) => (isActive ? 'active' : '')}>
              Call Us
            </NavLink>
          </li>
          <li>
            <NavLink to="/admin/login" className={({ isActive }) => (isActive ? 'active' : '')}>
              Admin
            </NavLink>
          </li>
        </ul>
      </nav>
    </header>
  );
};

export default Header;
