import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  FaCheckCircle, 
  FaClock, 
  FaChartLine, 
  FaCalendarAlt, 
  FaBan, 
  FaMoneyBillWave,
  FaDownload,
  FaFileExcel,
  FaFileCsv
} from 'react-icons/fa';
import '../styles/AdminReports.css';
import * as XLSX from 'xlsx';

// Base URL for Laravel API
const API_BASE_URL = 'http://localhost:8000/api';

const AdminReports = () => {
  const [appointments, setAppointments] = useState([]);
  const [revenueHistory, setRevenueHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [revenueFilter, setRevenueFilter] = useState('monthly'); // 'weekly', 'monthly'
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    setIsLoading(true);
    
    // Fetch all appointments
    axios.get(`${API_BASE_URL}/appointments`)
      .then(response => {
        let data = response.data;
        if (!Array.isArray(data)) data = [data];
        setAppointments(data);
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

  // Group revenue history by week or month
  const groupRevenueByPeriod = (history, periodType) => {
    if (!history || history.length === 0) return [];

    const groups = {};
    history.forEach(entry => {
      let periodKey;
      const entryDate = new Date(entry.revenue_date);
      
      if (periodType === 'weekly') {
        // Get the week number and year
        const firstDayOfYear = new Date(entryDate.getFullYear(), 0, 1);
        const pastDaysOfYear = (entryDate - firstDayOfYear) / 86400000;
        const weekNumber = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
        periodKey = `${entryDate.getFullYear()}-W${weekNumber}`;
      } else {
        // Monthly grouping (YYYY-MM)
        periodKey = entry.revenue_date.substring(0, 7);
      }
      
      if (!groups[periodKey]) {
        groups[periodKey] = 0;
      }
      groups[periodKey] += parseFloat(entry.total_revenue);
    });
    
    // Convert to array and sort
    return Object.entries(groups)
      .map(([period, total]) => ({ period, total }))
      .sort((a, b) => a.period.localeCompare(b.period));
  };

  // Revenue data based on current filter
  const filteredRevenueData = groupRevenueByPeriod(revenueHistory, revenueFilter);
  
  // Calculate total revenue
  const totalRevenue = filteredRevenueData.reduce((sum, entry) => sum + entry.total, 0);

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

  // Format period for display
  const formatPeriod = (periodStr) => {
    try {
      if (revenueFilter === 'weekly') {
        // Format: 2023-W12 => Week 12, 2023
        const [year, week] = periodStr.split('-W');
        return `Week ${week}, ${year}`;
      } else {
        // Format: YYYY-MM => Month YYYY
        const [year, month] = periodStr.split('-');
        const date = new Date(year, parseInt(month) - 1);
        return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      }
    } catch {
      return periodStr;
    }
  };

  // Export data to CSV
  const exportToCSV = (data, filename) => {
    const csvData = [];
    
    // Add headers
    if (activeTab === 'revenue') {
      csvData.push(['Period', 'Revenue (₱)', 'Percentage of Total']);
      
      // Add data rows
      data.forEach(entry => {
        csvData.push([
          formatPeriod(entry.period),
          entry.total.toFixed(2),
          (entry.total / totalRevenue * 100).toFixed(1) + '%'
        ]);
      });
      
      // Add total row
      csvData.push(['Total', totalRevenue.toFixed(2), '100%']);
    } else {
      // Add appointment headers
      csvData.push(['ID', 'Name', 'Status', 'Contact', 'Email', 'Address', 'Services']);
      
      // Add appointment data
      data.forEach(app => {
        const services = parseServices(app.services);
        const servicesText = services.map(service => 
          `${service.type} on ${new Date(service.date).toLocaleDateString()}${
            service.ac_types && service.ac_types.length > 0 ? 
            ` | AC Types: ${service.ac_types.join(', ')}` : ''
          }`
        ).join('; ');
        
        csvData.push([
          app.id,
          app.name,
          app.status || 'Pending',
          app.phone,
          app.email || 'N/A',
          app.complete_address,
          servicesText
        ]);
      });
    }
    
    // Create CSV string
    const csvString = csvData.map(row => row.join(',')).join('\n');
    
    // Create a blob and download
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export data to Excel
  const exportToExcel = (data, filename) => {
    const workbook = XLSX.utils.book_new();
    let worksheet;
    
    if (activeTab === 'revenue') {
      // Format revenue data for Excel
      const excelData = data.map(entry => ({
        'Period': formatPeriod(entry.period),
        'Revenue (₱)': entry.total.toFixed(2),
        'Percentage of Total': (entry.total / totalRevenue * 100).toFixed(1) + '%'
      }));
      
      // Add total row
      excelData.push({
        'Period': 'Total',
        'Revenue (₱)': totalRevenue.toFixed(2),
        'Percentage of Total': '100%'
      });
      
      worksheet = XLSX.utils.json_to_sheet(excelData);
    } else {
      // Format appointment data for Excel
      const excelData = data.map(app => {
        const services = parseServices(app.services);
        const servicesText = services.map(service => 
          `${service.type} on ${new Date(service.date).toLocaleDateString()}${
            service.ac_types && service.ac_types.length > 0 ? 
            ` | AC Types: ${service.ac_types.join(', ')}` : ''
          }`
        ).join('; ');
        
        return {
          'ID': app.id,
          'Name': app.name,
          'Status': app.status || 'Pending',
          'Contact': app.phone,
          'Email': app.email || 'N/A',
          'Address': app.complete_address,
          'Services': servicesText
        };
      });
      
      worksheet = XLSX.utils.json_to_sheet(excelData);
    }
    
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
    XLSX.writeFile(workbook, `${filename}.xlsx`);
  };

  // Export current active tab data
  const exportData = (format) => {
    let data;
    let filename;
    
    switch (activeTab) {
      case 'completed':
        data = completeAppointments;
        filename = 'completed-appointments';
        break;
      case 'pending':
        data = [...pendingAppointments, ...acceptedAppointments];
        filename = 'pending-appointments';
        break;
      case 'rejected':
        data = rejectedAppointments;
        filename = 'rejected-appointments';
        break;
      case 'revenue':
        data = filteredRevenueData;
        filename = `revenue-history-${revenueFilter}`;
        break;
      default:
        data = appointments;
        filename = 'all-appointments';
    }
    
    if (format === 'csv') {
      exportToCSV(data, filename);
    } else if (format === 'excel') {
      exportToExcel(data, filename);
    }
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
            <p>Pending/Accepted</p>
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
          Pending/Accepted Appointments
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

      {/* Export buttons for all tabs except overview */}
      {activeTab !== 'overview' && (
        <div className="export-controls">
          <div className="export-buttons">
            <button 
              className="export-btn csv" 
              onClick={() => exportData('csv')}
              title="Download as CSV"
            >
              <FaFileCsv /> Export CSV
            </button>
            <button 
              className="export-btn excel" 
              onClick={() => exportData('excel')}
              title="Download as Excel"
            >
              <FaFileExcel /> Export Excel
            </button>
          </div>
          
          {/* Revenue filtering controls */}
          {activeTab === 'revenue' && (
            <div className="revenue-filter-controls">
              <div className="filter-group">
                <label>View by:</label>
                <div className="filter-toggle">
                  <button 
                    className={revenueFilter === 'weekly' ? 'active' : ''} 
                    onClick={() => setRevenueFilter('weekly')}
                  >
                    Weekly
                  </button>
                  <button 
                    className={revenueFilter === 'monthly' ? 'active' : ''} 
                    onClick={() => setRevenueFilter('monthly')}
                  >
                    Monthly
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

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
              <h3><FaClock className="report-icon" /> Pending/Accepted Appointments</h3>
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
                  <div className="empty-state">No Pending/Accepted appointments.</div>
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
            <h3>
              <FaMoneyBillWave className="report-icon" /> 
              Revenue History ({revenueFilter === 'weekly' ? 'Weekly' : 'Monthly'})
            </h3>
            
            {filteredRevenueData.length > 0 ? (
              <table className="revenue-history-table full-table">
                <thead>
                  <tr>
                    <th>{revenueFilter === 'weekly' ? 'Week' : 'Month'}</th>
                    <th>Revenue (₱)</th>
                    <th>% of Total</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRevenueData.map((entry, index) => (
                    <tr key={index}>
                      <td>{formatPeriod(entry.period)}</td>
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