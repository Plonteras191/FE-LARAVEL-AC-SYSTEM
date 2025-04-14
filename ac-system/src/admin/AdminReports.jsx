import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  FaCheckCircle, 
  FaClock, 
  FaChartLine, 
  FaCalendarAlt, 
  FaBan, 
  FaMoneyBillWave,
  FaChartBar,
  FaChartPie
} from 'react-icons/fa';
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import '../styles/AdminReports.css';

// Base URL for Laravel API
const API_BASE_URL = 'http://localhost:8000/api';

// Chart colors
const CHART_COLORS = {
  primary: '#3498db', // light blue
  secondary: '#2980b9',
  accent: '#1abc9c',
  lightBlue: '#87CEFA',
  lightGray: '#f8f9fa',
  white: '#ffffff',
};

const pieColors = ['#3498db', '#2980b9', '#1abc9c', '#16a085', '#87CEFA'];

const AdminReports = () => {
  const [appointments, setAppointments] = useState([]);
  const [revenueHistory, setRevenueHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [weeklyReport, setWeeklyReport] = useState([]);
  const [monthlyReport, setMonthlyReport] = useState([]);
  const [appointmentTypes, setAppointmentTypes] = useState([]);

  useEffect(() => {
    setIsLoading(true);
    
    // Fetch all appointments
    axios.get(`${API_BASE_URL}/appointments`)
      .then(response => {
        let data = response.data;
        if (!Array.isArray(data)) data = [data];
        setAppointments(data);
        
        // Process appointment types for pie chart
        processAppointmentTypes(data);
      })
      .catch(error => {
        console.error("Error fetching appointments:", error);
      });

    // Fetch revenue history from backend
    axios.get(`${API_BASE_URL}/revenue-history`)
      .then(response => {
        if (response.data && response.data.history) {
          const history = response.data.history;
          setRevenueHistory(history);
          
          // Process data for weekly and monthly reports
          processWeeklyData(history);
          processMonthlyData(history);
        } else {
          setRevenueHistory([]);
        }
      })
      .catch(error => {
        console.error("Error fetching revenue history:", error);
        setRevenueHistory([]);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  // Process appointment types for pie chart
  const processAppointmentTypes = (appointmentData) => {
    const typeCount = {};
    
    appointmentData.forEach(app => {
      if (app.services) {
        try {
          const services = JSON.parse(app.services);
          services.forEach(service => {
            if (service.type) {
              if (!typeCount[service.type]) {
                typeCount[service.type] = 0;
              }
              typeCount[service.type]++;
            }
          });
        } catch (error) {
          console.error("Error parsing services:", error);
        }
      }
    });
    
    const typeData = Object.keys(typeCount).map(key => ({
      name: key,
      value: typeCount[key]
    }));
    
    setAppointmentTypes(typeData);
  };

  // Process weekly revenue data
  const processWeeklyData = (history) => {
    // Get the last 8 weeks
    const now = new Date();
    const weeklyData = Array(8).fill().map((_, i) => {
      const endDate = new Date(now);
      endDate.setDate(now.getDate() - (i * 7));
      
      const startDate = new Date(endDate);
      startDate.setDate(endDate.getDate() - 6);
      
      // Format dates for display
      const weekLabel = `${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
      
      // Calculate total revenue for this week
      const weekRevenue = history.filter(entry => {
        const entryDate = new Date(entry.revenue_date);
        return entryDate >= startDate && entryDate <= endDate;
      }).reduce((sum, entry) => sum + parseFloat(entry.total_revenue), 0);
      
      return {
        name: weekLabel,
        revenue: weekRevenue
      };
    }).reverse(); // Reverse to show oldest to newest
    
    setWeeklyReport(weeklyData);
  };

  // Process monthly revenue data
  const processMonthlyData = (history) => {
    const monthlyGroups = {};
    
    history.forEach(entry => {
      // Extract "YYYY-MM" from the date
      const month = entry.revenue_date.substring(0, 7);
      if (!monthlyGroups[month]) {
        monthlyGroups[month] = 0;
      }
      monthlyGroups[month] += parseFloat(entry.total_revenue);
    });
    
    // Convert to array and sort by month
    const monthlyData = Object.entries(monthlyGroups)
      .map(([month, total]) => {
        // Convert YYYY-MM to Month YYYY format for display
        const [year, monthNum] = month.split('-');
        const date = new Date(year, parseInt(monthNum) - 1);
        const monthName = date.toLocaleDateString('en-US', { month: 'short' });
        
        return {
          name: `${monthName} ${year}`,
          revenue: total
        };
      })
      .sort((a, b) => a.month - b.month);
    
    setMonthlyReport(monthlyData);
  };

  // Filter appointments based on status
  const completeAppointments = appointments.filter(appt => 
    appt.status && appt.status.toLowerCase() === 'completed'
  );
  
  const pendingAppointments = appointments.filter(appt => 
    !appt.status || appt.status.toLowerCase() === 'pending'
  );
  
  const acceptedAppointments = appointments.filter(appt => 
    appt.status && appt.status.toLowerCase() === 'accepted'
  );
  
  const rejectedAppointments = appointments.filter(appt => 
    appt.status && appt.status.toLowerCase() === 'rejected'
  );

  // Group revenue history by month and sum total revenue
  const groupRevenueByMonth = (history) => {
    const groups = {};
    history.forEach(entry => {
      // Extract "YYYY-MM" from the date
      const month = entry.revenue_date.substring(0, 7);
      if (!groups[month]) {
        groups[month] = 0;
      }
      groups[month] += parseFloat(entry.total_revenue);
    });
    
    // Convert to array and sort by month
    return Object.entries(groups)
      .map(([month, total]) => ({ month, total }))
      .sort((a, b) => a.month.localeCompare(b.month));
  };

  const revenueByMonth = groupRevenueByMonth(revenueHistory);
  
  // Calculate total revenue
  const totalRevenue = revenueByMonth.reduce((sum, entry) => sum + entry.total, 0);

  // Helper function to parse services JSON string
  const parseServices = (servicesStr) => {
    try {
      return JSON.parse(servicesStr);
    } catch (error) {
      console.error("Error parsing services:", error);
      return [];
    }
  };

  // Helper function to get appointment date from services
  const getAppointmentDate = (appt) => {
    if (!appt.services) return 'N/A';
    
    try {
      const services = parseServices(appt.services);
      if (services.length > 0 && services[0].date) {
        return new Date(services[0].date).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        });
      }
      return 'N/A';
    } catch {
      return 'N/A';
    }
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

  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip">
          <p className="label">{`${label}`}</p>
          <p className="value">{`Revenue: ₱${payload[0].value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}</p>
        </div>
      );
    }
    return null;
  };

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
        <h2>Admin Reports</h2>
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
            <h3>{pendingAppointments.length + acceptedAppointments.length}</h3>
            <p>Active</p>
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
          className={activeTab === 'charts' ? 'active' : ''} 
          onClick={() => setActiveTab('charts')}
        >
          Sales Charts
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
          Active Appointments
        </button>
        <button 
          className={activeTab === 'rejected' ? 'active' : ''} 
          onClick={() => setActiveTab('rejected')}
        >
          Rejected Appointments
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

            {/* Active Appointments (Pending + Accepted) */}
            <div className="report-box pending">
              <h3><FaClock className="report-icon" /> Active Appointments</h3>
              <div className="scrollable-content">
                {pendingAppointments.length + acceptedAppointments.length > 0 ? (
                  <ul>
                    {[...pendingAppointments, ...acceptedAppointments].slice(0, 5).map(app => (
                      <li key={app.id} className="appointment-item">
                        <div className="appointment-header">
                          <span className="appointment-id">#{app.id}</span>
                          <span className="appointment-name">{app.name}</span>
                          <span className="appointment-status">{app.status || 'Pending'}</span>
                        </div>
                        <div className="appointment-date">
                          <FaCalendarAlt /> {getAppointmentDate(app)}
                        </div>
                      </li>
                    ))}
                    {pendingAppointments.length + acceptedAppointments.length > 5 && (
                      <button className="view-more" onClick={() => setActiveTab('pending')}>
                        View all {pendingAppointments.length + acceptedAppointments.length} appointments
                      </button>
                    )}
                  </ul>
                ) : (
                  <div className="empty-state">No active appointments.</div>
                )}
              </div>
            </div>

            {/* Rejected Appointments */}
            <div className="report-box rejected">
              <h3><FaBan className="report-icon" /> Rejected Appointments</h3>
              <div className="scrollable-content">
                {rejectedAppointments.length > 0 ? (
                  <ul>
                    {rejectedAppointments.slice(0, 5).map(app => (
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
                    {rejectedAppointments.length > 5 && (
                      <button className="view-more" onClick={() => setActiveTab('rejected')}>
                        View all {rejectedAppointments.length} appointments
                      </button>
                    )}
                  </ul>
                ) : (
                  <div className="empty-state">No rejected appointments.</div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'charts' && (
          <div className="charts-container">
            <div className="chart-section">
              <h3><FaChartBar className="report-icon" /> Weekly Sales</h3>
              <div className="chart-wrapper">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={weeklyReport} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="name" 
                      angle={-45} 
                      textAnchor="end" 
                      height={70} 
                      tick={{ fill: '#333', fontSize: 12 }}
                    />
                    <YAxis 
                      tickFormatter={(value) => `₱${value.toLocaleString()}`}
                      tick={{ fill: '#333', fontSize: 12 }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar dataKey="revenue" name="Revenue" fill={CHART_COLORS.primary} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="chart-section">
              <h3><FaChartLine className="report-icon" /> Monthly Sales</h3>
              <div className="chart-wrapper">
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={monthlyReport} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="name" 
                      angle={-45} 
                      textAnchor="end" 
                      height={70} 
                      tick={{ fill: '#333', fontSize: 12 }}
                    />
                    <YAxis 
                      tickFormatter={(value) => `₱${value.toLocaleString()}`}
                      tick={{ fill: '#333', fontSize: 12 }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="revenue" 
                      name="Revenue" 
                      stroke={CHART_COLORS.secondary} 
                      strokeWidth={2} 
                      dot={{ stroke: CHART_COLORS.secondary, strokeWidth: 2, r: 4 }}
                      activeDot={{ stroke: CHART_COLORS.primary, strokeWidth: 2, r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="chart-section">
              <h3><FaChartPie className="report-icon" /> Service Types Distribution</h3>
              <div className="chart-wrapper">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={appointmentTypes}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {appointmentTypes.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value} appointments`, 'Count']} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="chart-section">
              <h3><FaMoneyBillWave className="report-icon" /> Revenue Distribution</h3>
              <div className="chart-wrapper">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart 
                    data={revenueByMonth.map(item => ({ 
                      name: formatMonth(item.month), 
                      revenue: item.total 
                    }))} 
                    margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="name" 
                      angle={-45} 
                      textAnchor="end" 
                      height={70} 
                      tick={{ fill: '#333', fontSize: 12 }}
                    />
                    <YAxis 
                      tickFormatter={(value) => `₱${value.toLocaleString()}`}
                      tick={{ fill: '#333', fontSize: 12 }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar dataKey="revenue" name="Revenue" fill={CHART_COLORS.accent} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'completed' && (
          <div className="full-width-section">
            <h3><FaCheckCircle className="report-icon" /> All Completed Appointments</h3>
            {completeAppointments.length > 0 ? (
              <div className="appointment-list">
                {completeAppointments.map(app => {
                  const services = parseServices(app.services);
                  return (
                    <div key={app.id} className="appointment-card">
                      <div className="appointment-card-header">
                        <span className="appointment-id">#{app.id}</span>
                        <span className="status-badge completed">Completed</span>
                      </div>
                      <div className="appointment-card-body">
                        <h4>{app.name}</h4>
                        <p><strong>Contact:</strong> {app.phone} | {app.email || 'N/A'}</p>
                        <p><strong>Address:</strong> {app.complete_address}</p>
                        <div className="services-list">
                          <p><strong>Services:</strong></p>
                          {services.length > 0 ? (
                            <ul>
                              {services.map((service, idx) => (
                                <li key={idx}>
                                  {service.type} on {new Date(service.date).toLocaleDateString()} 
                                  {service.ac_types && service.ac_types.length > 0 && (
                                    <span> | AC Types: {service.ac_types.join(', ')}</span>
                                  )}
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p>No service details available</p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="empty-state">No completed appointments found.</div>
            )}
          </div>
        )}

        {activeTab === 'pending' && (
          <div className="full-width-section">
            <h3><FaClock className="report-icon" /> All Active Appointments</h3>
            {pendingAppointments.length + acceptedAppointments.length > 0 ? (
              <div className="appointment-list">
                {[...pendingAppointments, ...acceptedAppointments].map(app => {
                  const services = parseServices(app.services);
                  return (
                    <div key={app.id} className="appointment-card">
                      <div className="appointment-card-header">
                        <span className="appointment-id">#{app.id}</span>
                        <span className={`status-badge ${app.status?.toLowerCase() || 'pending'}`}>
                          {app.status || 'Pending'}
                        </span>
                      </div>
                      <div className="appointment-card-body">
                        <h4>{app.name}</h4>
                        <p><strong>Contact:</strong> {app.phone} | {app.email || 'N/A'}</p>
                        <p><strong>Address:</strong> {app.complete_address}</p>
                        <div className="services-list">
                          <p><strong>Services:</strong></p>
                          {services.length > 0 ? (
                            <ul>
                              {services.map((service, idx) => (
                                <li key={idx}>
                                  {service.type} on {new Date(service.date).toLocaleDateString()} 
                                  {service.ac_types && service.ac_types.length > 0 && (
                                    <span> | AC Types: {service.ac_types.join(', ')}</span>
                                  )}
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p>No service details available</p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="empty-state">No active appointments found.</div>
            )}
          </div>
        )}

        {activeTab === 'rejected' && (
          <div className="full-width-section">
            <h3><FaBan className="report-icon" /> All Rejected Appointments</h3>
            {rejectedAppointments.length > 0 ? (
              <div className="appointment-list">
                {rejectedAppointments.map(app => {
                  const services = parseServices(app.services);
                  return (
                    <div key={app.id} className="appointment-card">
                      <div className="appointment-card-header">
                        <span className="appointment-id">#{app.id}</span>
                        <span className="status-badge rejected">Rejected</span>
                      </div>
                      <div className="appointment-card-body">
                        <h4>{app.name}</h4>
                        <p><strong>Contact:</strong> {app.phone} | {app.email || 'N/A'}</p>
                        <p><strong>Address:</strong> {app.complete_address}</p>
                        <div className="services-list">
                          <p><strong>Services:</strong></p>
                          {services.length > 0 ? (
                            <ul>
                              {services.map((service, idx) => (
                                <li key={idx}>
                                  {service.type} on {new Date(service.date).toLocaleDateString()} 
                                  {service.ac_types && service.ac_types.length > 0 && (
                                    <span> | AC Types: {service.ac_types.join(', ')}</span>
                                  )}
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p>No service details available</p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="empty-state">No rejected appointments found.</div>
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