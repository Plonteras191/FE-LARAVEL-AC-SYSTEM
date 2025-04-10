import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaCheckCircle, FaClock, FaChartLine, FaCalendarAlt } from 'react-icons/fa';
import '../styles/AdminReports.css';

const AdminReports = () => {
  const [appointments, setAppointments] = useState([]);
  const [revenueHistory, setRevenueHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    setIsLoading(true);
    // Fetch appointments (all)
    axios.get("http://localhost/AC-SERVICE-FINAL/backend/api/appointments.php")
      .then(response => {
        let data = response.data;
        if (!Array.isArray(data)) data = [data];
        setAppointments(data);
      })
      .catch(error => {
        console.error("Error fetching appointments:", error);
      });

    // Fetch revenue history from backend
    axios.get("http://localhost/AC-SERVICE-FINAL/backend/api/getRevenueHistory.php")
      .then(response => {
        setRevenueHistory(response.data);
      })
      .catch(error => {
        console.error("Error fetching revenue history:", error);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  // Filter appointments based on status.
  const completeAppointments = appointments.filter(appt => 
    appt.status && appt.status.toLowerCase() === 'completed'
  );
  const pendingAppointments = appointments.filter(appt => 
    !appt.status || appt.status.toLowerCase() === 'pending'
  );
  
  // Group revenue history by month (e.g., "2025-04") and sum total revenue.
  const groupRevenueByMonth = (history) => {
    const groups = {};
    history.forEach(entry => {
      // Assume revenue_date is in 'YYYY-MM-DD' format; extract "YYYY-MM"
      const month = entry.revenue_date.substring(0, 7);
      if (!groups[month]) {
        groups[month] = 0;
      }
      groups[month] += parseFloat(entry.total_revenue);
    });
    // Convert the groups object into an array of { month, total } records
    return Object.entries(groups)
      .map(([month, total]) => ({ month, total }))
      .sort((a, b) => a.month.localeCompare(b.month)); // Sort by month
  };

  const revenueByMonth = groupRevenueByMonth(revenueHistory);

  // Helper function to get appointment date.
  const getAppointmentDate = (appt) => {
    const date = appt.date || appt.complete_date || appt.created_at || 'N/A';
    // Format date if it's not N/A
    if (date !== 'N/A') {
      try {
        const formattedDate = new Date(date).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        });
        return formattedDate;
      } catch {
        return date;
      }
    }
    return date;
  };

  // Format month for display (YYYY-MM to Month YYYY)
  const formatMonth = (monthStr) => {
    try {
      const [year, month] = monthStr.split('-');
      const date = new Date(year, parseInt(month) - 1);
      return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    } catch {
      return monthStr;
    }
  };

  // Calculate total revenue
  const totalRevenue = revenueByMonth.reduce((sum, entry) => sum + entry.total, 0);

  if (isLoading) {
    return (
      <div className="admin-reports-container loading">
        <div className="loader"></div>
        <p>Loading reports data...</p>
      </div>
    );
  }

  return (
    <div className="admin-reports-container">
      <div className="admin-header">
        <h2>Admin Dashboard</h2>
        <div className="date-display">
          <FaCalendarAlt /> {new Date().toLocaleDateString('en-US', {
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric'
          })}
        </div>
      </div>

      <div className="dashboard-stats">
        <div className="stat-card">
          <div className="stat-icon completed">
            <FaCheckCircle />
          </div>
          <div className="stat-info">
            <h3>{completeAppointments.length}</h3>
            <p>Completed</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon pending">
            <FaClock />
          </div>
          <div className="stat-info">
            <h3>{pendingAppointments.length}</h3>
            <p>Pending</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon revenue">
            <FaChartLine />
          </div>
          <div className="stat-info">
            <h3>₱{totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
            <p>Total Revenue</p>
          </div>
        </div>
      </div>

      <div className="tab-navigation">
        <button 
          className={activeTab === 'overview' ? 'active' : ''} 
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button 
          className={activeTab === 'completed' ? 'active' : ''} 
          onClick={() => setActiveTab('completed')}
        >
          Completed Appointments
        </button>
        <button 
          className={activeTab === 'pending' ? 'active' : ''} 
          onClick={() => setActiveTab('pending')}
        >
          Pending Appointments
        </button>
        <button 
          className={activeTab === 'revenue' ? 'active' : ''} 
          onClick={() => setActiveTab('revenue')}
        >
          Revenue History
        </button>
      </div>

      <div className="reports-content">
        {activeTab === 'overview' && (
          <div className="reports-grid">
            {/* Completed Appointments */}
            <div className="report-box complete">
              <h3><FaCheckCircle className="report-icon" /> Completed Appointments</h3>
              <div className="scrollable-content">
                {completeAppointments.length > 0 ? (
                  <ul>
                    {completeAppointments.slice(0, 5).map(app => (
                      <li key={app.id} className="appointment-item">
                        <div className="appointment-header">
                          <span className="appointment-id">#{app.id}</span>
                          <span className="appointment-name">{app.name}</span>
                        </div>
                        <div className="appointment-date">
                          <FaCalendarAlt /> {getAppointmentDate(app)}
                        </div>
                      </li>
                    ))}
                    {completeAppointments.length > 5 && (
                      <button className="view-more" onClick={() => setActiveTab('completed')}>
                        View all {completeAppointments.length} appointments
                      </button>
                    )}
                  </ul>
                ) : (
                  <div className="empty-state">No completed appointments.</div>
                )}
              </div>
            </div>

            {/* Pending Appointments */}
            <div className="report-box pending">
              <h3><FaClock className="report-icon" /> Pending Appointments</h3>
              <div className="scrollable-content">
                {pendingAppointments.length > 0 ? (
                  <ul>
                    {pendingAppointments.slice(0, 5).map(app => (
                      <li key={app.id} className="appointment-item">
                        <div className="appointment-header">
                          <span className="appointment-id">#{app.id}</span>
                          <span className="appointment-name">{app.name}</span>
                        </div>
                        <div className="appointment-date">
                          <FaCalendarAlt /> {getAppointmentDate(app)}
                        </div>
                      </li>
                    ))}
                    {pendingAppointments.length > 5 && (
                      <button className="view-more" onClick={() => setActiveTab('pending')}>
                        View all {pendingAppointments.length} appointments
                      </button>
                    )}
                  </ul>
                ) : (
                  <div className="empty-state">No pending appointments.</div>
                )}
              </div>
            </div>

            {/* Recent Revenue */}
            <div className="report-box revenue">
              <h3><FaChartLine className="report-icon" /> Recent Revenue</h3>
              <div className="scrollable-content">
                {revenueByMonth.length > 0 ? (
                  <table className="revenue-history-table">
                    <thead>
                      <tr>
                        <th>Month</th>
                        <th>Revenue (₱)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {revenueByMonth.slice(-5).map((entry, index) => (
                        <tr key={index}>
                          <td>{formatMonth(entry.month)}</td>
                          <td>₱{entry.total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="empty-state">No revenue history available.</div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'completed' && (
          <div className="full-width-section">
            <h3><FaCheckCircle className="report-icon" /> All Completed Appointments</h3>
            {completeAppointments.length > 0 ? (
              <div className="appointment-list">
                {completeAppointments.map(app => (
                  <div key={app.id} className="appointment-card">
                    <div className="appointment-card-header">
                      <span className="appointment-id">#{app.id}</span>
                      <span className="status-badge completed">Completed</span>
                    </div>
                    <div className="appointment-card-body">
                      <h4>{app.name}</h4>
                      <p><FaCalendarAlt /> {getAppointmentDate(app)}</p>
                      {app.service && <p className="service-type">{app.service}</p>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">No completed appointments found.</div>
            )}
          </div>
        )}

        {activeTab === 'pending' && (
          <div className="full-width-section">
            <h3><FaClock className="report-icon" /> All Pending Appointments</h3>
            {pendingAppointments.length > 0 ? (
              <div className="appointment-list">
                {pendingAppointments.map(app => (
                  <div key={app.id} className="appointment-card">
                    <div className="appointment-card-header">
                      <span className="appointment-id">#{app.id}</span>
                      <span className="status-badge pending">Pending</span>
                    </div>
                    <div className="appointment-card-body">
                      <h4>{app.name}</h4>
                      <p><FaCalendarAlt /> {getAppointmentDate(app)}</p>
                      {app.service && <p className="service-type">{app.service}</p>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">No pending appointments found.</div>
            )}
          </div>
        )}

        {activeTab === 'revenue' && (
          <div className="full-width-section">
            <h3><FaChartLine className="report-icon" /> Revenue History</h3>
            {revenueByMonth.length > 0 ? (
              <table className="revenue-history-table full-table">
                <thead>
                  <tr>
                    <th>Month</th>
                    <th>Revenue (₱)</th>
                    <th>% of Total</th>
                  </tr>
                </thead>
                <tbody>
                  {revenueByMonth.map((entry, index) => (
                    <tr key={index}>
                      <td>{formatMonth(entry.month)}</td>
                      <td>₱{entry.total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td>
                        <div className="percentage-bar">
                          <div 
                            className="percentage-fill" 
                            style={{ width: `${(entry.total / totalRevenue * 100).toFixed(1)}%` }}
                          ></div>
                          <span>{(entry.total / totalRevenue * 100).toFixed(1)}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                  <tr className="total-row">
                    <td><strong>Total</strong></td>
                    <td colSpan={2}><strong>₱{totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></td>
                  </tr>
                </tbody>
              </table>
            ) : (
              <div className="empty-state">No revenue history found.</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminReports;