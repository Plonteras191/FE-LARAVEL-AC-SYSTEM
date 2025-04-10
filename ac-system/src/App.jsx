import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';

import Header from './components/Header';
import Home from './pages/Home';
import About from './pages/About';
import Services from './pages/Services';
import CallUs from './pages/CallUs';
import Booking from './pages/Booking';
import Confirmation from './pages/Confirmation';

// Admin Pages
import AdminLogin from './admin/AdminLogin';
import Dashboard from './admin/Dashboard';
import AdminAppointments from './admin/AdminAppointments';
import AdminReports from './admin/AdminReports';
import AdminCalendar from './admin/AdminCalendar';
import Revenue from './admin/Revenue';
import RevenueHistory from './admin/RevenueHistory';
import AdminBooking from './admin/AdminBooking';
import AdminLayout from './admin/AdminLayout';

import PageWrapper from './components/PageWrapper';

const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Public Routes */}
        <Route path="/" element={<PageWrapper><Home /></PageWrapper>} />
        <Route path="/about" element={<PageWrapper><About /></PageWrapper>} />
        <Route path="/services" element={<PageWrapper><Services /></PageWrapper>} />
        <Route path="/call-us" element={<PageWrapper><CallUs /></PageWrapper>} />
        <Route path="/booking" element={<PageWrapper><Booking /></PageWrapper>} />
        <Route path="/confirmation" element={<PageWrapper><Confirmation /></PageWrapper>} />

        {/* Admin Login */}
        <Route path="/admin/login" element={<PageWrapper><AdminLogin /></PageWrapper>} />

        {/* Admin Routes nested under AdminLayout */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route path="dashboard" element={<PageWrapper><Dashboard /></PageWrapper>} />
          <Route path="appointments" element={<PageWrapper><AdminAppointments /></PageWrapper>} />
          {/* Admin Booking route (unique path) */}
          <Route path="admin-booking" element={<PageWrapper><AdminBooking /></PageWrapper>} />
          <Route path="reports" element={<PageWrapper><AdminReports /></PageWrapper>} />
          <Route path="calendar" element={<PageWrapper><AdminCalendar /></PageWrapper>} />
          <Route path="revenue" element={<PageWrapper><Revenue /></PageWrapper>} />
          <Route path="revenue-history" element={<PageWrapper><RevenueHistory /></PageWrapper>} />
        </Route>
      </Routes>
    </AnimatePresence>
  );
};

const App = () => {
  return (
    <>
      <Header />
      <AnimatedRoutes />
    </>
  );
};

export default App;