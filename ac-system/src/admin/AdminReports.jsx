import React, { useState, useEffect } from 'react';
import { 
  FaCheckCircle, 
  FaClock, 
  FaChartLine, 
  FaCalendarAlt, 
  FaBan, 
  FaMoneyBillWave,
  FaDownload,
  FaFileExcel,
  FaFileCsv,
  FaAngleLeft,
  FaAngleRight,
  FaUserCog
} from 'react-icons/fa';
import '../styles/AdminReports.css';
import * as XLSX from 'xlsx';
import apiClient, { appointmentsApi } from '../services/api';

// Technicians List Component
const TechniciansList = ({ technicians }) => {
  if (!technicians || technicians.length === 0) {
    return null;
  }

  return (
    <div className="technicians-section">
      <p className="technicians-header">
        <FaUserCog className="icon" /> <strong>Assigned Technicians:</strong>
      </p>
      <ul className="technicians-list">
        {technicians.map((tech, index) => (
          <li key={index} className="technician-item">
            {tech}
          </li>
        ))}
      </ul>
    </div>
  );
};

const AdminReports = () => {
  const [appointments, setAppointments] = useState([]);
  const [revenueHistory, setRevenueHistory] = useState([]);
  const [filteredRevenueHistory, setFilteredRevenueHistory] = useState([]);
  const [totalRevenueAmount, setTotalRevenueAmount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedDate, setSelectedDate] = useState('');
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState({
    completed: 1,
    pending: 1,
    rejected: 1,
    revenue: 1
  });
  const itemsPerPage = 6;

  useEffect(() => {
    setIsLoading(true);
    
    // Fetch all appointments using the appointments API service
    appointmentsApi.getAll()
      .then(response => {
        let data = response.data;
        if (!Array.isArray(data)) data = [data];
        setAppointments(data);
      })
      .catch(error => {
        console.error("Error fetching appointments:", error);
      });

    // Fetch revenue history from backend
    apiClient.get('/revenue-history')
      .then(response => {
        if (response.data && response.data.history) {
          // Ensure we have valid data
          const validHistory = response.data.history.map(entry => ({
            ...entry,
            total_revenue: parseFloat(entry.total_revenue) || 0
          }));
          setRevenueHistory(validHistory);
          setFilteredRevenueHistory(validHistory); // Initialize with all history
          setTotalRevenueAmount(parseFloat(response.data.totalAmount) || 0);
        } else {
          setRevenueHistory([]);
          setFilteredRevenueHistory([]);
          setTotalRevenueAmount(0);
        }
      })
      .catch(error => {
        console.error("Error fetching revenue history:", error);
        setRevenueHistory([]);
        setFilteredRevenueHistory([]);
        setTotalRevenueAmount(0);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  // Reset pagination when tab changes
  useEffect(() => {
    setCurrentPage({
      completed: 1,
      pending: 1,
      rejected: 1,
      revenue: 1
    });
  }, [activeTab]);

  // Filter revenue history when date changes
  useEffect(() => {
    if (!selectedDate) {
      // If no date is selected, show all revenue history
      setFilteredRevenueHistory(revenueHistory);
      return;
    }

    // Filter revenue history based on selected date
    const filtered = revenueHistory.filter(entry => {
      // Extract just the date part for comparison (not time)
      const entryDate = entry.revenue_date.split(' ')[0];
      return entryDate === selectedDate;
    });

    setFilteredRevenueHistory(filtered);
    // Reset revenue pagination when filter changes
    setCurrentPage(prev => ({ ...prev, revenue: 1 }));
  }, [selectedDate, revenueHistory]);

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

  // Get paginated data
  const getPaginatedData = (data, page) => {
    const startIndex = (page - 1) * itemsPerPage;
    return data.slice(startIndex, startIndex + itemsPerPage);
  };

  // Get total pages
  const getTotalPages = (totalItems) => {
    return Math.ceil(totalItems / itemsPerPage);
  };

  // Handle page change
  const handlePageChange = (section, newPage) => {
    setCurrentPage(prev => ({ ...prev, [section]: newPage }));
  };

  // Calculate total filtered revenue
  const filteredTotalRevenue = filteredRevenueHistory.reduce(
    (sum, entry) => sum + parseFloat(entry.total_revenue || 0), 
    0
  );

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

  // Format currency properly with error handling
  const formatCurrency = (amount) => {
    // Ensure amount is a number before using toFixed
    const numAmount = Number(amount);
    if (isNaN(numAmount)) {
      return '₱ 0.00'; // Return default value if conversion fails
    }
    return `₱ ${numAmount.toFixed(2)}`;
  };

  // Handle date selection
  const handleDateChange = (e) => {
    setSelectedDate(e.target.value);
  };

  // Clear date filter
  const clearDateFilter = () => {
    setSelectedDate('');
  };

  // Pagination component
  const Pagination = ({ currentPage, totalPages, onPageChange, section }) => {
    return (
      <div className="pagination-controls">
        <button 
          onClick={() => onPageChange(section, 1)} 
          disabled={currentPage === 1}
          className="pagination-button"
        >
          First
        </button>
        <button 
          onClick={() => onPageChange(section, currentPage - 1)} 
          disabled={currentPage === 1}
          className="pagination-button"
        >
          <FaAngleLeft />
        </button>
        <span className="pagination-info">
          Page {currentPage} of {totalPages}
        </span>
        <button 
          onClick={() => onPageChange(section, currentPage + 1)} 
          disabled={currentPage === totalPages}
          className="pagination-button"
        >
          <FaAngleRight />
        </button>
        <button 
          onClick={() => onPageChange(section, totalPages)} 
          disabled={currentPage === totalPages}
          className="pagination-button"
        >
          Last
        </button>
      </div>
    );
  };

  // Export data to CSV
  const exportToCSV = (data, filename) => {
    const csvData = [];
    
    // Add headers
    if (activeTab === 'revenue') {
      csvData.push(['Date Recorded', 'Service Type', 'Booking ID', 'Total Revenue']);
      
      // Add data rows - export filtered data
      filteredRevenueHistory.forEach(entry => {
        csvData.push([
          entry.revenue_date,
          entry.service_types || 'N/A',
          entry.booking_id || 'N/A',
          formatCurrency(entry.total_revenue)
        ]);
      });
      
      // Add total row
      csvData.push(['Total', '', '', formatCurrency(filteredTotalRevenue)]);
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
      // Format revenue data for Excel - use filtered data
      const excelData = filteredRevenueHistory.map(entry => ({
        'Date Recorded': entry.revenue_date,
        'Service Type': entry.service_types || 'N/A',
        'Booking ID': entry.booking_id || 'N/A',
        'Total Revenue': formatCurrency(entry.total_revenue)
      }));
      
      // Add total row
      excelData.push({
        'Date Recorded': 'Total',
        'Service Type': '',
        'Booking ID': '',
        'Total Revenue': formatCurrency(filteredTotalRevenue)
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
        data = filteredRevenueHistory;
        filename = `revenue-history${selectedDate ? '-' + selectedDate : ''}`;
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

  // Get paginated data for each section
  const paginatedCompletedAppointments = getPaginatedData(
    completeAppointments, 
    currentPage.completed
  );
  
  const paginatedPendingAppointments = getPaginatedData(
    [...pendingAppointments, ...acceptedAppointments], 
    currentPage.pending
  );
  
  const paginatedRejectedAppointments = getPaginatedData(
    rejectedAppointments, 
    currentPage.rejected
  );
  
  const paginatedRevenueHistory = getPaginatedData(
    filteredRevenueHistory, 
    currentPage.revenue
  );

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
            <h3>{formatCurrency(totalRevenueAmount)}</h3>
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
          
          {/* Revenue date filter */}
          {activeTab === 'revenue' && (
            <div className="revenue-filter-controls">
              <div className="filter-group">
                <label>Filter by date:</label>
                <div className="date-filter">
                  <input 
                    type="date" 
                    className="date-picker"
                    value={selectedDate}
                    onChange={handleDateChange}
                  />
                  {selectedDate && (
                    <button 
                      className="clear-filter-btn"
                      onClick={clearDateFilter}
                      title="Clear date filter"
                    >
                      Clear
                    </button>
                  )}
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
              <>
                <div className="appointment-list">
                  {paginatedCompletedAppointments.map(app => {
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
                          <TechniciansList technicians={app.technicians} />
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                {/* Pagination controls */}
                {getTotalPages(completeAppointments.length) > 1 && (
                  <Pagination 
                    currentPage={currentPage.completed}
                    totalPages={getTotalPages(completeAppointments.length)}
                    onPageChange={handlePageChange}
                    section="completed"
                  />
                )}
              </>
            ) : (
              <div className="empty-state">No completed appointments found.</div>
            )}
          </div>
        )}

        {activeTab === 'pending' && (
          <div className="full-width-section">
            <h3><FaClock className="report-icon" /> All Active Appointments</h3>
            {pendingAppointments.length + acceptedAppointments.length > 0 ? (
              <>
                <div className="appointment-list">
                  {paginatedPendingAppointments.map(app => {
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
                          <TechniciansList technicians={app.technicians} />
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                {/* Pagination controls */}
                {getTotalPages(pendingAppointments.length + acceptedAppointments.length) > 1 && (
                  <Pagination 
                    currentPage={currentPage.pending}
                    totalPages={getTotalPages(pendingAppointments.length + acceptedAppointments.length)}
                    onPageChange={handlePageChange}
                    section="pending"
                  />
                )}
              </>
            ) : (
              <div className="empty-state">No active appointments found.</div>
            )}
          </div>
        )}

        {activeTab === 'rejected' && (
          <div className="full-width-section">
            <h3><FaBan className="report-icon" /> All Rejected Appointments</h3>
            {rejectedAppointments.length > 0 ? (
              <>
                <div className="appointment-list">
                  {paginatedRejectedAppointments.map(app => {
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
                          <TechniciansList technicians={app.technicians} />
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                {/* Pagination controls */}
                {getTotalPages(rejectedAppointments.length) > 1 && (
                  <Pagination 
                    currentPage={currentPage.rejected}
                    totalPages={getTotalPages(rejectedAppointments.length)}
                    onPageChange={handlePageChange}
                    section="rejected"
                  />
                )}
              </>
            ) : (
              <div className="empty-state">No rejected appointments found.</div>
            )}
          </div>
        )}

{activeTab === 'revenue' && (
  <div className="revenue-history-container">
    <div className="revenue-history-header">
      <h3><FaMoneyBillWave className="report-icon" /> Revenue History</h3>
      <p className="revenue-history-subtitle">
        {selectedDate 
          ? `Viewing revenue for: ${new Date(selectedDate).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}`
          : 'View and track your historical revenue records'
        }
      </p>
    </div>
    
    <div className="revenue-history-box">
      {filteredRevenueHistory.length === 0 ? (
        <div className="no-data-message">
          <div className="empty-state-icon">📊</div>
          <p>{selectedDate ? 'No revenue records found for the selected date.' : 'No revenue history available.'}</p>
          {selectedDate && <button className="clear-filter-btn" onClick={clearDateFilter}>Clear Filter</button>}
          {!selectedDate && <p className="empty-state-hint">Revenue records you save will appear here.</p>}
        </div>
      ) : (
        <>
          <div className="table-container">            <table className="revenue-history-table">
              <thead>
                <tr>
                  <th>Date Recorded</th>
                  <th>Customer</th>
                  <th>Status</th>
                  <th>Service Types</th>
                  <th>Appointment Dates</th>
                  <th>Total Revenue</th>
                </tr>
              </thead>
              <tbody>
                {paginatedRevenueHistory.map((entry, index) => (
                  <tr key={index} className="revenue-row">
                    <td className="date-column">{entry.revenue_date}</td>
                    <td className="customer-column">
                      <div className="customer-info">
                        <div>{entry.customer_name}</div>
                        <div className="customer-contact">
                          {entry.customer_phone}
                          {entry.customer_email && <span> | {entry.customer_email}</span>}
                        </div>
                      </div>
                    </td>
                    <td className={`status-column ${entry.status_name.toLowerCase()}`}>
                      {entry.status_name}
                    </td>
                    <td className="service-column">
                      {entry.service_types.split(', ').map((service, i) => (
                        <span key={i} className="service-tag">{service}</span>
                      ))}
                    </td>
                    <td className="dates-column">
                      {entry.appointment_dates.split(', ').map((date, i) => (
                        <div key={i} className="appointment-date">
                          {new Date(date).toLocaleDateString()}
                        </div>
                      ))}
                    </td>
                    <td className="amount-column">{formatCurrency(entry.total_revenue)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan="3" className="total-label">
                    {selectedDate ? 'Selected Date Total' : 'All-time Total'}
                  </td>
                  <td className="total-value">{formatCurrency(filteredTotalRevenue)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
          
          <div className="history-summary">
            <div className="summary-card">
              <div className="summary-title">
                {selectedDate ? 'Filtered Records' : 'Total Records'}
              </div>
              <div className="summary-value">{filteredRevenueHistory.length}</div>
            </div>
            <div className="summary-card">
              <div className="summary-title">
                {selectedDate ? 'Filtered Revenue' : 'All-time Revenue'}
              </div>
              <div className="summary-value revenue-total">{formatCurrency(filteredTotalRevenue)}</div>
            </div>
          </div>
          
          {/* Pagination controls for revenue */}
          {getTotalPages(filteredRevenueHistory.length) > 1 && (
            <Pagination 
              currentPage={currentPage.revenue}
              totalPages={getTotalPages(filteredRevenueHistory.length)}
              onPageChange={handlePageChange}
              section="revenue"
            />
          )}
        </>
      )}
    </div>
  </div>
)}
</div>
</div>
);
};

export default AdminReports;