import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import PageWrapper from '../components/PageWrapper';
import axios from 'axios';
import '../styles/Dashboard.css';

// Base URL for Laravel API
const API_BASE_URL = 'http://localhost:8000/api';

// Updated color palette with light blue and white theme
const COLORS = ['#0088FE', '#4FB3FF', '#90CDF4', '#BEE3F8', '#EBF8FF'];
const STATUS_COLORS = {
  pending: '#BEE3F8',  // Light blue
  accepted: '#4FB3FF', // Medium blue
  completed: '#0088FE', // Darker blue
  rejected: '#F7FAFC'  // Almost white
};

const Dashboard = () => {
  const [appointments, setAppointments] = useState([]);
  const [serviceCounts, setServiceCounts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch all necessary data when component mounts
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setLoading(true);
        await fetchAppointments();
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

  // Process service types when appointments are loaded
  useEffect(() => {
    if (appointments.length > 0) {
      processServiceCounts();
    }
  }, [appointments]);

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

  // Process service types and counts
  const processServiceCounts = () => {
    const serviceTypes = {};
    
    appointments.forEach(appointment => {
      if (appointment.services) {
        try {
          const services = JSON.parse(appointment.services);
          services.forEach(service => {
            if (service.type) {
              if (!serviceTypes[service.type]) {
                serviceTypes[service.type] = 0;
              }
              serviceTypes[service.type]++;
            }
          });
        } catch (error) {
          console.error("Error parsing services:", error);
        }
      }
    });
    
    // Convert to array format for charts
    const serviceCountsArray = Object.keys(serviceTypes).map(type => ({
      name: type,
      value: serviceTypes[type]
    }));
    
    setServiceCounts(serviceCountsArray);
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

  const stats = getAppointmentStats();

  // Calculate percentage for appointment status distribution pie chart
  const getStatusDistribution = () => {
    const { total, pending, accepted, completed, rejected } = stats;
    if (total === 0) return [];
    
    return [
      { name: 'Pending', value: pending },
      { name: 'Accepted', value: accepted },
      { name: 'Completed', value: completed },
      { name: 'Rejected', value: rejected }
    ];
  };

  const statusDistribution = getStatusDistribution();

  return (
    <PageWrapper>
      <div className="dashboard-main">
        <h1 className="dashboard-title">Admin Dashboard</h1>
        
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
        </div>
        
        {/* Charts Section */}
        <div className="charts-section">
          {/* Appointment Status Distribution */}
          <div className="chart-container">
            <h2>Appointment Status</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  nameKey="name"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {statusDistribution.map((entry) => (
                    <Cell 
                      key={`cell-${entry.name}`} 
                      fill={STATUS_COLORS[entry.name.toLowerCase()] || '#8884d8'} 
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          {/* Service Type Distribution */}
          <div className="chart-container">
            <h2>Service Type Distribution</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={serviceCounts}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  nameKey="name"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {serviceCounts.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
};

export default Dashboard;