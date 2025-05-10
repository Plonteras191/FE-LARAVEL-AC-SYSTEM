import React, { useState, useEffect, useRef } from 'react';
import PageWrapper from '../components/PageWrapper';
import apiClient, { appointmentsApi } from '../services/api';
import '../styles/index.css';
import { FaCalendarAlt, FaBell, FaChartLine, FaCheck, FaClock, FaTimes, FaUser } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

const Dashboard = () => {
  const [appointments, setAppointments] = useState([]);
  const [revenueHistory, setRevenueHistory] = useState([]);
  const [currentMonthRevenue, setCurrentMonthRevenue] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [processedAppointmentIds, setProcessedAppointmentIds] = useState(new Set());
  const notificationRef = useRef(null);

  // Handle clicks outside notification panel to close it
  useEffect(() => {
    function handleClickOutside(event) {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Load processed appointment IDs from localStorage on component mount
  useEffect(() => {
    try {
      const savedIds = localStorage.getItem('processedAppointmentIds');
      if (savedIds) {
        setProcessedAppointmentIds(new Set(JSON.parse(savedIds)));
      }
    } catch (error) {
      console.error("Error loading processed appointment IDs:", error);
    }
  }, []);

  // Fetch all necessary data when component mounts
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const appointmentsData = await fetchAppointments();
        await fetchRevenueHistory();
        
        // Check for new pending appointments
        checkForNewAppointments(appointmentsData);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      }
    };

    fetchAllData();
    // Refresh data every 2 minutes
    const interval = setInterval(fetchAllData, 120000);
    return () => clearInterval(interval);
  }, []);

  // Check for new appointments and create notifications
  const checkForNewAppointments = (newAppointments) => {
    if (!newAppointments) return;
    
    // Filter for new pending appointments that weren't already processed
    const newPendingAppointments = newAppointments.filter(
      app => app.status && 
      app.status.toLowerCase() === 'pending' && 
      !processedAppointmentIds.has(app.id)
    );
    
    // Create notifications for new pending appointments
    if (newPendingAppointments.length > 0) {
      const newNotifications = newPendingAppointments.map(app => ({
        id: `notif-${app.id}`,
        title: 'New Pending Appointment',
        message: `${app.name} has requested an appointment`,
        time: new Date(),
        appointmentId: app.id,
        read: false
      }));
      
      // Update notifications state - properly merging and deduplicating
      setNotifications(prev => {
        // Remove any duplicates by appointmentId
        const uniqueNotifications = [...prev];
        newNotifications.forEach(newNotif => {
          const existingIndex = uniqueNotifications.findIndex(
            existingNotif => existingNotif.appointmentId === newNotif.appointmentId
          );
          
          if (existingIndex >= 0) {
            uniqueNotifications.splice(existingIndex, 1);
          }
          
          uniqueNotifications.unshift(newNotif); // Add to beginning
        });
        
        return uniqueNotifications;
      });
      
      // Add the processed appointment IDs to avoid duplicates
      const updatedProcessedIds = new Set(processedAppointmentIds);
      newPendingAppointments.forEach(app => updatedProcessedIds.add(app.id));
      setProcessedAppointmentIds(updatedProcessedIds);
      
      // Save processed IDs to localStorage
      localStorage.setItem('processedAppointmentIds', JSON.stringify([...updatedProcessedIds]));
    }
  };

  // Update unread count whenever notifications change
  useEffect(() => {
    const actualUnreadCount = notifications.filter(n => !n.read).length;
    setUnreadCount(actualUnreadCount);
  }, [notifications]);

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
        
        // Calculate current month revenue
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        
        const monthlyRevenue = history.reduce((sum, entry) => {
          const entryDate = new Date(entry.revenue_date);
          if (entryDate.getMonth() === currentMonth && entryDate.getFullYear() === currentYear) {
            return sum + parseFloat(entry.total_revenue);
          }
          return sum;
        }, 0);
        
        setCurrentMonthRevenue(monthlyRevenue);
        return history;
      } else {
        setRevenueHistory([]);
        setCurrentMonthRevenue(0);
        return [];
      }
    } catch (error) {
      console.error("Error fetching revenue history:", error);
      setRevenueHistory([]);
      setCurrentMonthRevenue(0);
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

  // Handle notification click - just mark as read
  const handleNotificationClick = (notification) => {
    // Mark notification as read
    setNotifications(prev => 
      prev.map(n => 
        n.id === notification.id ? {...n, read: true} : n
      )
    );
  };

  // Clear all notifications
  const clearAllNotifications = () => {
    setNotifications([]);
    setUnreadCount(0);
    setShowNotifications(false);
    
    // Note: We don't clear processedAppointmentIds here
    // to prevent the same notifications from appearing again
  };

  // Format time for notifications
  const formatNotificationTime = (date) => {
    const now = new Date();
    const notifDate = new Date(date);
    const diffMinutes = Math.floor((now - notifDate) / (1000 * 60));
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    return notifDate.toLocaleDateString();
  };

  // Get current month name
  const getCurrentMonthName = () => {
    return new Date().toLocaleString('default', { month: 'long' });
  };

  // Sync notifications with pending appointments (one time setup)
  useEffect(() => {
    // This effect runs once when appointments are first loaded
    const hasNotifications = notifications.length > 0;
    
    if (!hasNotifications && appointments.length > 0) {
      // Initial setup - create notifications for existing pending appointments
      // that haven't been processed yet
      const pendingAppointments = appointments.filter(a => 
        a.status && 
        a.status.toLowerCase() === 'pending' && 
        !processedAppointmentIds.has(a.id)
      );
      
      if (pendingAppointments.length > 0) {
        // Create notifications without duplicating the check logic
        checkForNewAppointments(appointments);
      }
    }
  }, [appointments.length]);

  const stats = getAppointmentStats();

  return (
    <PageWrapper>
      <div className="bg-gray-50 min-h-screen">
        {/* Top Navigation Bar */}
        <div className="bg-white shadow-md border-b border-gray-200 sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <h1 className="text-xl font-bold text-gray-800 flex items-center">
                <span className="bg-blue-500 text-white p-2 rounded-lg mr-2 hidden sm:inline-flex">
                  <FaChartLine className="h-5 w-5" />
                </span>
                Admin Dashboard
              </h1>
              
              {/* Right side controls */}
              <div className="flex items-center space-x-4">
                {/* Date display */}
                <div className="hidden md:flex items-center gap-2 text-gray-600">
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
                
                {/* Notification Bell */}
                <div className="relative" ref={notificationRef}>
                  <button 
                    className="p-2 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-300 transition-all relative"
                    onClick={() => setShowNotifications(!showNotifications)}
                  >
                    <FaBell className="text-gray-600 h-5 w-5" />
                    {unreadCount > 0 && (
                      <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-500 rounded-full">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>
                  
                  {/* Notification Panel */}
                  <AnimatePresence>
                    {showNotifications && (
                      <motion.div 
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.2 }}
                        className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl py-2 z-50 border border-gray-200 overflow-hidden"
                      >
                        <div className="px-4 py-2 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                          <h3 className="text-sm font-semibold text-gray-700">Notifications</h3>
                          {notifications.length > 0 && (
                            <button 
                              onClick={clearAllNotifications} 
                              className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                            >
                              Clear all
                            </button>
                          )}
                        </div>
                        
                        <div className="max-h-80 overflow-y-auto">
                          {notifications.length === 0 ? (
                            <div className="px-4 py-6 text-center text-gray-500">
                              <p className="text-sm">No new notifications</p>
                            </div>
                          ) : (
                            notifications.map(notification => (
                              <div 
                                key={notification.id}
                                className={`px-4 py-3 border-b border-gray-100 hover:bg-blue-50 cursor-pointer transition-colors ${!notification.read ? 'bg-blue-50' : ''}`}
                                onClick={() => handleNotificationClick(notification)}
                              >
                                <div className="flex justify-between items-start">
                                  <div>
                                    <p className="text-sm font-medium text-gray-800">{notification.title}</p>
                                    <p className="text-xs text-gray-600 mt-1">{notification.message}</p>
                                  </div>
                                  <span className="text-xs text-gray-500">{formatNotificationTime(notification.time)}</span>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                
                {/* User Profile */}
                <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 text-white flex items-center justify-center font-medium shadow-sm">
                  <FaUser className="h-4 w-4" />
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
            {/* Total Appointments Card */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 hover:shadow-md transition-shadow duration-300"
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-gray-500">Total Appointments</p>
                  <h3 className="mt-2 text-3xl font-bold text-gray-900">{stats.total}</h3>
                </div>
                <div className="p-3 bg-blue-100 rounded-lg">
                  <FaCalendarAlt className="h-5 w-5 text-blue-600" />
                </div>
              </div>
              <div className="mt-4">
                <div className="h-1 w-full bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-1 bg-blue-500 rounded-full" style={{ width: '100%' }}></div>
                </div>
              </div>
            </motion.div>
            
            {/* Pending Card */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
              className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 hover:shadow-md transition-shadow duration-300"
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-gray-500">Pending</p>
                  <h3 className="mt-2 text-3xl font-bold text-amber-600">{stats.pending}</h3>
                </div>
                <div className="p-3 bg-amber-100 rounded-lg">
                  <FaClock className="h-5 w-5 text-amber-600" />
                </div>
              </div>
              <div className="mt-4">
                <div className="h-1 w-full bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-1 bg-amber-500 rounded-full" style={{ width: `${stats.total ? Math.round((stats.pending / stats.total) * 100) : 0}%` }}></div>
                </div>
              </div>
              {stats.pending > 0 && (
                <div className="mt-4 pt-3 border-t border-gray-100">
                  <p className="text-xs text-red-600 flex items-center gap-2 font-medium">
                    <span className="animate-pulse flex h-2 w-2 rounded-full bg-red-500"></span> 
                    Requires attention
                  </p>
                </div>
              )}
            </motion.div>
            
            {/* Accepted Card */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.3 }}
              className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 hover:shadow-md transition-shadow duration-300"
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-gray-500">Accepted</p>
                  <h3 className="mt-2 text-3xl font-bold text-green-600">{stats.accepted}</h3>
                </div>
                <div className="p-3 bg-green-100 rounded-lg">
                  <FaCheck className="h-5 w-5 text-green-600" />
                </div>
              </div>
              <div className="mt-4">
                <div className="h-1 w-full bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-1 bg-green-500 rounded-full" style={{ width: `${stats.total ? Math.round((stats.accepted / stats.total) * 100) : 0}%` }}></div>
                </div>
              </div>
            </motion.div>
            
            {/* Completed Card */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.4 }}
              className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 hover:shadow-md transition-shadow duration-300"
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-gray-500">Completed</p>
                  <h3 className="mt-2 text-3xl font-bold text-purple-600">{stats.completed}</h3>
                </div>
                <div className="p-3 bg-purple-100 rounded-lg">
                  <FaCheck className="h-5 w-5 text-purple-600" />
                </div>
              </div>
              <div className="mt-4">
                <div className="h-1 w-full bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-1 bg-purple-500 rounded-full" style={{ width: `${stats.total ? Math.round((stats.completed / stats.total) * 100) : 0}%` }}></div>
                </div>
              </div>
            </motion.div>
            
            {/* Revenue Card */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.5 }}
              className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 hover:shadow-md transition-shadow duration-300"
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-gray-500">{getCurrentMonthName()} Revenue</p>
                  <h3 className="mt-2 text-3xl font-bold text-sky-600">
                    ₱{currentMonthRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </h3>
                </div>

              </div>
              <div className="mt-4">
                <div className="h-1 w-full bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-1 bg-sky-500 rounded-full" style={{ width: '60%' }}></div>
                </div>
              </div>
            </motion.div>
          </div>
          
          {/* Performance Metrics Section */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.6 }}
            className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 mb-8"
          >
            <h2 className="text-lg font-semibold text-gray-800 mb-6 flex items-center">
              <span className="bg-indigo-100 p-2 rounded-lg mr-2">
                <FaChartLine className="h-4 w-4 text-indigo-600" />
              </span>
              Performance Metrics
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Acceptance Rate */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 font-medium">Acceptance Rate</span>
                  <span className="text-sm font-semibold text-gray-900 bg-blue-50 px-2 py-1 rounded">
                    {stats.total ? Math.round((stats.accepted / stats.total) * 100) : 0}%
                  </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-3">
                  <div 
                    className="bg-blue-600 h-3 rounded-full transition-all duration-500 ease-in-out" 
                    style={{ width: `${stats.total ? Math.round((stats.accepted / stats.total) * 100) : 0}%` }}
                  ></div>
                </div>
              </div>
              
              {/* Completion Rate */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 font-medium">Completion Rate</span>
                  <span className="text-sm font-semibold text-gray-900 bg-green-50 px-2 py-1 rounded">
                    {stats.total ? Math.round((stats.completed / stats.total) * 100) : 0}%
                  </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-3">
                  <div 
                    className="bg-green-600 h-3 rounded-full transition-all duration-500 ease-in-out" 
                    style={{ width: `${stats.total ? Math.round((stats.completed / stats.total) * 100) : 0}%` }}
                  ></div>
                </div>
              </div>
              
              {/* Rejection Rate */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 font-medium">Rejection Rate</span>
                  <span className="text-sm font-semibold text-gray-900 bg-red-50 px-2 py-1 rounded">
                    {stats.total ? Math.round((stats.rejected / stats.total) * 100) : 0}%
                  </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-3">
                  <div 
                    className="bg-red-600 h-3 rounded-full transition-all duration-500 ease-in-out" 
                    style={{ width: `${stats.total ? Math.round((stats.rejected / stats.total) * 100) : 0}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </PageWrapper>
  );
};

export default Dashboard;