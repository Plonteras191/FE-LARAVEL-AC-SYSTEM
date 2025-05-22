import React, { useState, useEffect } from 'react';
import apiClient from '../services/api';
import BookingModal from '../components/bookingModal';
import '../styles/Revenue.css';

const Revenue = () => {
  // State for active tab
  const [activeTab, setActiveTab] = useState('revenue');
  
  // Revenue management states
  const [appointments, setAppointments] = useState([]);
  const [revenueData, setRevenueData] = useState({});
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Revenue history states
  const [history, setHistory] = useState([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [historyLoading, setHistoryLoading] = useState(true);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  // On mount, load completed appointments from localStorage for revenue tab
  useEffect(() => {
    if (activeTab === 'revenue') {
      const storedAppointments = localStorage.getItem('completedAppointments');
      if (storedAppointments) {
        const parsedAppointments = JSON.parse(storedAppointments);
        setAppointments(parsedAppointments);
      }
    }
  }, [activeTab]);

  // Auto-compute total whenever revenue values change
  useEffect(() => {
    computeTotalRevenue();
  }, [revenueData]);

  // Load revenue history when history tab is active
  useEffect(() => {
    if (activeTab === 'history') {
      loadRevenueHistory();
    }
  }, [activeTab, currentPage, itemsPerPage]);

  // Calculate pagination
  useEffect(() => {
    if (history.length > 0) {
      setTotalPages(Math.ceil(history.length / itemsPerPage));
    } else {
      setTotalPages(1);
    }
  }, [history, itemsPerPage]);

  // REVENUE MANAGEMENT FUNCTIONS

  const handleRevenueChange = (id, value) => {
    // Prevent negative values
    const numValue = parseFloat(value);
    if (value === '' || (numValue >= 0)) {
      setRevenueData(prev => ({
        ...prev,
        [id]: value,
      }));
    }
  };

  // Compute total revenue based on input values
  const computeTotalRevenue = () => {
    let totalRev = 0;

    appointments.forEach(appt => {
      const revenue = parseFloat(revenueData[appt.id] || 0);
      
      if (!isNaN(revenue)) {
        totalRev += revenue;
      }
    });

    setTotalRevenue(totalRev);
  };

  // Extract service info for each appointment
  const getAppointmentServices = (appt) => {
    if (!appt.services) return [];
    
    try {
      const services = JSON.parse(appt.services);
      return services.map(s => s.type);
    } catch (error) {
      console.error("Error parsing services:", error);
      return [];
    }
  };

  // Handle closing the success modal
  const closeSuccessModal = () => {
    setShowSuccessModal(false);
    // Reset component state after closing modal
    setAppointments([]);
    setRevenueData({});
    setTotalRevenue(0);
    setSaveSuccess(false);
    // Switch to history tab to see the newly added record
    setActiveTab('history');
    loadRevenueHistory();
  };

  // Save computed revenue to revenue history via the Laravel backend API
  const saveRevenue = () => {
    // Validate that every appointment has a revenue amount
    const missingInput = appointments.some(appt => {
      const value = revenueData[appt.id];
      return !value || value.toString().trim() === "";
    });

    if (missingInput) {
      alert("Please input revenue amount for all appointments before saving.");
      return;
    }

    setIsLoading(true);
    setSaveSuccess(false);

    // Create an array of appointment IDs for the revenue record
    const appointmentIds = appointments.map(appt => appt.id);

    // Create appointment details with revenue information
    const appointmentDetails = appointments.map(appt => {
      const revenue = parseFloat(revenueData[appt.id] || 0);
      const services = getAppointmentServices(appt);
      
      return {
        id: appt.id,
        net_revenue: revenue, // This aligns with your controller's expected structure
        service_types: services
      };
    });

    // Create a new revenue record
    const revenueRecord = {
      revenue_date: new Date().toISOString().slice(0, 10), // Format: 'YYYY-MM-DD'
      total_revenue: totalRevenue,
      appointments: appointmentIds,
      appointment_details: appointmentDetails
    };

    // For debugging - log the data being sent
    console.log("Sending revenue data:", revenueRecord);

    // POST the new revenue record to the Laravel backend API endpoint
    apiClient.post('/revenue-history', revenueRecord)
      .then(response => {
        if (response.data.success) {
          // Clear localStorage for completed appointments and set success state
          localStorage.removeItem('completedAppointments');
          setSaveSuccess(true);
          // Show success modal instead of just the inline message
          setShowSuccessModal(true);
          setIsLoading(false);
        } else {
          alert("Error saving revenue: " + (response.data.error || "Unknown error."));
          setIsLoading(false);
        }
      })
      .catch(error => {
        console.error("Error saving revenue:", error);
        alert("Error saving revenue. Please try again.");
        setIsLoading(false);
      });
  };

  // Helper function: extract service info from the services JSON string
  const getServiceInfo = (servicesStr) => {
    if (!servicesStr) return { service: "N/A", date: "N/A" };
    try {
      const services = JSON.parse(servicesStr);
      if (services.length > 0) {
        const serviceNames = services.map(s => s.type).join(', ');
        const serviceDates = services.map(s => s.date).join(', ');
        return { service: serviceNames, date: serviceDates };
      }
    } catch (error) {
      console.error("Error parsing services:", error);
    }
    return { service: "N/A", date: "N/A" };
  };

  // REVENUE HISTORY FUNCTIONS

  // Load revenue history from the Laravel backend API
  const loadRevenueHistory = () => {
    setHistoryLoading(true);
    
    apiClient.get('/revenue-history', {
      params: {
        page: currentPage,
        perPage: itemsPerPage
      }
    })
      .then(response => {
        if (response.data.history) {
          // Ensure we have valid data
          const validHistory = response.data.history.map(entry => ({
            ...entry,
            total_revenue: parseFloat(entry.total_revenue) || 0
          }));
          setHistory(validHistory);
          setTotalAmount(parseFloat(response.data.totalAmount) || 0);
        } else {
          setHistory([]);
          setTotalAmount(0);
        }
        setHistoryLoading(false);
      })
      .catch(error => {
        console.error("Error fetching revenue history:", error);
        setHistory([]);
        setTotalAmount(0);
        setHistoryLoading(false);
      });
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

  // Pagination handlers
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (e) => {
    setItemsPerPage(parseInt(e.target.value));
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  // Calculate current page items for pagination
  const getCurrentPageItems = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return history.slice(startIndex, endIndex);
  };

  // Render pagination controls
  const renderPagination = () => {
    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
      pages.push(
        <button
          key={i}
          className={`pagination-button ${currentPage === i ? 'active' : ''}`}
          onClick={() => handlePageChange(i)}
        >
          {i}
        </button>
      );
    }

    return (
      <div className="pagination-controls">
        <button 
          className="pagination-button"
          onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
        >
          &lt;
        </button>
        {pages}
        <button 
          className="pagination-button"
          onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
        >
          &gt;
        </button>
        <div className="items-per-page">
          <span>Items per page:</span>
          <select value={itemsPerPage} onChange={handleItemsPerPageChange}>
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </div>
      </div>
    );
  };

  // RENDER UI COMPONENTS

  // Render Revenue Management Tab
  const renderRevenueTab = () => {
    return (
      <div className="revenue-box">
        {appointments.length === 0 ? (
          <div className="no-data-message">
            <div className="empty-state-icon">💼</div>
            <p>No completed appointments available for revenue calculation.</p>
            <p className="empty-state-hint">Completed appointments will appear here for revenue tracking.</p>
          </div>
        ) : (
          <>
            <div className="table-container">
              <table className="revenue-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Customer</th>
                    <th>Service</th>
                    <th>Date</th>
                    <th>Revenue (Php)</th>
                  </tr>
                </thead>
                <tbody>
                  {appointments.map(appt => {
                    const { service, date } = getServiceInfo(appt.services);
                    const revenue = parseFloat(revenueData[appt.id] || 0);
                    
                    return (
                      <tr key={appt.id}>
                        <td className="id-column">{appt.id}</td>
                        <td>{appt.name}</td>
                        <td className="service-column">{service}</td>
                        <td>{date}</td>
                        <td className="revenue-input-column">
                          <div className="revenue-input-wrapper">
                            <span className="currency-symbol">₱</span>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              placeholder="0.00"
                              value={revenueData[appt.id] || ''}
                              onChange={(e) => handleRevenueChange(appt.id, e.target.value)}
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            
            <div className="revenue-summary">
              <div className="actions-group">
                <button 
                  className="save-button" 
                  onClick={saveRevenue} 
                  disabled={isLoading}
                >
                  <span className="button-icon">💾</span>
                  {isLoading ? 'Saving...' : 'Save Record'}
                </button>
              </div>
              <div className="summary-details">
                <div className="summary-item">
                  <h3>Total Revenue:</h3>
                  <div className="total-amount">₱ {totalRevenue.toFixed(2)}</div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    );
  };

  // Render Revenue History Tab
  const renderHistoryTab = () => {
    return (
      <div className="revenue-history-box">
        {historyLoading ? (
          <div className="loading-message">
            <p>Loading revenue history...</p>
          </div>
        ) : history.length === 0 ? (
          <div className="no-data-message">
            <div className="empty-state-icon">📊</div>
            <p>No revenue history available.</p>
            <p className="empty-state-hint">Revenue records you save will appear here.</p>
          </div>
        ) : (
          <>
            <div className="table-container">
              <table className="revenue-history-table">
                <thead>
                  <tr>
                    <th>Date Recorded</th>
                    <th>Customer Name</th>
                    <th>Service Type</th>
                    <th>Booking ID</th>
                    <th>Total Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {getCurrentPageItems().map((entry, index) => (
                    <tr key={`${entry.revenue_id || entry.booking_id || index}`}>
                      <td className="date-column">{entry.revenue_date}</td>
                      <td className="customer-column">{entry.customer_name || 'N/A'}</td>
                      <td className="service-column">{entry.service_types || 'N/A'}</td>
                      <td className="booking-column">{entry.booking_id || 'N/A'}</td>
                      <td className="amount-column">{formatCurrency(entry.total_revenue)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan="4" className="total-label">All-time Total</td>
                    <td className="total-value">{formatCurrency(totalAmount)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
            
            {renderPagination()}
            
            <div className="history-summary">
              <div className="summary-card">
                <div className="summary-title">Total Records</div>
                <div className="summary-value">{history.length}</div>
              </div>
              <div className="summary-card">
                <div className="summary-title">All-time Revenue</div>
                <div className="summary-value revenue-total">{formatCurrency(totalAmount)}</div>
              </div>
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <div className="revenue-container">
      {/* Tabs Navigation */}
      <div className="revenue-tabs">
        <button 
          className={`tab-button ${activeTab === 'revenue' ? 'active' : ''}`}
          onClick={() => setActiveTab('revenue')}
        >
          Revenue Management
        </button>
        <button 
          className={`tab-button ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          Revenue History
        </button>
      </div>

      {/* Tab Headers */}
      {activeTab === 'revenue' ? (
        <div className="revenue-header">
          <h2>Revenue Management</h2>
          <p className="revenue-subtitle">Track and manage completed service appointments</p>
        </div>
      ) : (
        <div className="revenue-history-header">
          <h2>Revenue History</h2>
          <p className="revenue-history-subtitle">View and track your historical revenue records</p>
        </div>
      )}
      
      {/* Tab Content */}
      {activeTab === 'revenue' ? renderRevenueTab() : renderHistoryTab()}

      {/* Success Modal */}
      <BookingModal
        isOpen={showSuccessModal}
        onClose={closeSuccessModal}
        title="Revenue Saved"
      >
        <div className="success-modal-content">
          <div className="success-icon-container">
            <span className="success-icon">✅</span>
          </div>
          <h3>Revenue Record Saved Successfully!</h3>
          <p>Your revenue record has been successfully saved to the system.</p>
          <p>Total Revenue: ₱ {totalRevenue.toFixed(2)}</p>
          <div className="modal-actions">
            <button className="modal-button modal-confirm-button" onClick={closeSuccessModal}>
              OK
            </button>
          </div>
        </div>
      </BookingModal>
    </div>
  );
};

export default Revenue;