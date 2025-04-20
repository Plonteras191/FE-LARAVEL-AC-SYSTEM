import React, { useState, useEffect } from 'react';
import PageWrapper from '../components/PageWrapper';
import apiClient, { appointmentsApi } from '../services/api';
import '../styles/index.css';
import { FaCalendarAlt } from 'react-icons/fa';

const Dashboard = () => {
  const [appointments, setAppointments] = useState([]);
  const [revenueHistory, setRevenueHistory] = useState([]);

  // Fetch all necessary data when component mounts
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        await fetchAppointments();
        await fetchRevenueHistory();
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
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
      const response = await appointmentsApi.getAll();
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
      const response = await apiClient.get('/revenue-history');
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
      <div className="bg-white min-h-screen p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header Section */}
          <div className="flex flex-col md:flex-row justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>
            <div className="flex items-center gap-2 text-blue-600 mt-4 md:mt-0">
              <FaCalendarAlt className="text-blue-500" />
              <span className="font-medium">
                {new Date().toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </span>
            </div>
          </div>
          
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
            {/* Total Appointments Card */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl shadow-sm p-6 border border-blue-200">
              <div className="flex flex-col">
                <h3 className="text-sm font-medium text-blue-800 mb-1">Total Appointments</h3>
                <p className="text-3xl font-bold text-blue-900">{stats.total}</p>
              </div>
            </div>
            
            {/* Pending Card */}
            <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl shadow-sm p-6 border border-amber-200">
              <div className="flex flex-col">
                <h3 className="text-sm font-medium text-amber-800 mb-1">Pending</h3>
                <p className="text-3xl font-bold text-amber-900">{stats.pending}</p>
              </div>
            </div>
            
            {/* Accepted Card */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl shadow-sm p-6 border border-green-200">
              <div className="flex flex-col">
                <h3 className="text-sm font-medium text-green-800 mb-1">Accepted</h3>
                <p className="text-3xl font-bold text-green-900">{stats.accepted}</p>
              </div>
            </div>
            
            {/* Completed Card */}
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl shadow-sm p-6 border border-purple-200">
              <div className="flex flex-col">
                <h3 className="text-sm font-medium text-purple-800 mb-1">Completed</h3>
                <p className="text-3xl font-bold text-purple-900">{stats.completed}</p>
              </div>
            </div>
            
            {/* Revenue Card */}
            <div className="bg-gradient-to-br from-sky-50 to-sky-100 rounded-xl shadow-sm p-6 border border-sky-200">
              <div className="flex flex-col">
                <h3 className="text-sm font-medium text-sky-800 mb-1">Total Revenue</h3>
                <p className="text-3xl font-bold text-sky-900">
                  ₱{totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </div>
          
          {/* Quick Stats Section */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Quick Stats</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Acceptance Rate */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Acceptance Rate</span>
                  <span className="font-medium">
                    {stats.total ? Math.round((stats.accepted / stats.total) * 100) : 0}%
                  </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full" 
                    style={{ width: `${stats.total ? Math.round((stats.accepted / stats.total) * 100) : 0}%` }}
                  ></div>
                </div>
              </div>
              
              {/* Completion Rate */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Completion Rate</span>
                  <span className="font-medium">
                    {stats.total ? Math.round((stats.completed / stats.total) * 100) : 0}%
                  </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full" 
                    style={{ width: `${stats.total ? Math.round((stats.completed / stats.total) * 100) : 0}%` }}
                  ></div>
                </div>
              </div>
              
              {/* Rejection Rate */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Rejection Rate</span>
                  <span className="font-medium">
                    {stats.total ? Math.round((stats.rejected / stats.total) * 100) : 0}%
                  </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div 
                    className="bg-red-500 h-2 rounded-full" 
                    style={{ width: `${stats.total ? Math.round((stats.rejected / stats.total) * 100) : 0}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
};

export default Dashboard;