import React, { useState, useEffect } from 'react';
import PageWrapper from '../components/PageWrapper';
import axios from 'axios';
import '../styles/Dashboard.css';
import { 
  FaCalendarAlt, 
  FaMoneyBillWave
} from 'react-icons/fa';

// Base URL for Laravel API
const API_BASE_URL = 'http://localhost:8000/api';

const Dashboard = () => {
  const [appointments, setAppointments] = useState([]);
  const [revenueHistory, setRevenueHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch all necessary data when component mounts
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setLoading(true);
        await fetchAppointments();
        await fetchRevenueHistory();
        setLoading(false);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        setLoading(false);
      }
    };

    fetchAllData();
    // Refresh data every 5 minutes
    const interval = setInterval(fetchAllData, 300000);
    return () => clearInterval(interval);
  }, []);

  // Fetch all appointments
  const fetchAppointments = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/appointments`);
      let data = response.data;
      if (!Array.isArray(data)) data = [data];
      setAppointments(data);
      return data;
    } catch (error) {
      console.error("Error fetching appointments:", error);
      return [];
    }
  };

  // Fetch revenue history
  const fetchRevenueHistory = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/revenue-history`);
      if (response.data && response.data.history) {
        const history = response.data.history;
        setRevenueHistory(history);
        return history;
      } else {
        setRevenueHistory([]);
        return [];
      }
    } catch (error) {
      console.error("Error fetching revenue history:", error);
      setRevenueHistory([]);
      return [];
    }
  };

  // Calculate appointment statistics for the summary cards
  const getAppointmentStats = () => {
    const total = appointments.length;
    const pending = appointments.filter(a => a.status && a.status.toLowerCase() === 'pending').length;
    const accepted = appointments.filter(a => a.status && a.status.toLowerCase() === 'accepted').length;
    const completed = appointments.filter(a => a.status && a.status.toLowerCase() === 'completed').length;
    const rejected = appointments.filter(a => a.status && a.status.toLowerCase() === 'rejected').length;
    
    return { total, pending, accepted, completed, rejected };
  };

  // Calculate total revenue from history
  const calculateTotalRevenue = () => {
    if (!revenueHistory || revenueHistory.length === 0) return 0;
    return revenueHistory.reduce((sum, entry) => sum + parseFloat(entry.total_revenue), 0);
  };

  const stats = getAppointmentStats();
  const totalRevenue = calculateTotalRevenue();

  return (
    <PageWrapper>
      <div className="dashboard-main">
        <h1 className="dashboard-title">Admin Dashboard</h1>
        
        <div className="date-display">
          <FaCalendarAlt /> {new Date().toLocaleDateString('en-US', {
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric'
          })}
        </div>
        
        {/* Summary Cards */}
        <div className="summary-cards">
          <div className="summary-card total">
            <h3>Total Appointments</h3>
            <p className="count">{stats.total}</p>
          </div>
          <div className="summary-card pending">
            <h3>Pending</h3>
            <p className="count">{stats.pending}</p>
          </div>
          <div className="summary-card accepted">
            <h3>Accepted</h3>
            <p className="count">{stats.accepted}</p>
          </div>
          <div className="summary-card completed">
            <h3>Completed</h3>
            <p className="count">{stats.completed}</p>
          </div>
          <div className="summary-card revenue">
            <h3>Total Revenue</h3>
            <p className="count">₱{totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
};

export default Dashboard;