import React, { useState, useEffect } from 'react';
import apiClient from '../services/api';
import '../styles/Revenue.css';

const Revenue = () => {
  const [appointments, setAppointments] = useState([]);
  const [revenueData, setRevenueData] = useState({});
  const [discountData, setDiscountData] = useState({});
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalDiscount, setTotalDiscount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // On mount, load completed appointments from localStorage
  useEffect(() => {
    const storedAppointments = localStorage.getItem('completedAppointments');
    if (storedAppointments) {
      const parsedAppointments = JSON.parse(storedAppointments);
      setAppointments(parsedAppointments);
    }
  }, []);

  // Auto-compute total whenever revenue or discount values change
  useEffect(() => {
    computeTotalRevenue();
  }, [revenueData, discountData]);

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

  const handleDiscountChange = (id, value) => {
    // Prevent negative values and limit percentage to 100
    const numValue = parseFloat(value);
    if (value === '' || (numValue >= 0 && numValue <= 100)) {
      setDiscountData(prev => ({
        ...prev,
        [id]: value,
      }));
    }
  };

  // Calculate discount amount from percentage
  const calculateDiscountAmount = (revenue, discountPercent) => {
    const numRevenue = parseFloat(revenue) || 0;
    const numDiscount = parseFloat(discountPercent) || 0;
    return (numRevenue * numDiscount) / 100;
  };

  // Compute net revenue (revenue - discount) for a specific appointment
  const computeNetRevenue = (appointmentId) => {
    const revenue = parseFloat(revenueData[appointmentId] || 0);
    const discountPercent = parseFloat(discountData[appointmentId] || 0);
    const discountAmount = calculateDiscountAmount(revenue, discountPercent);
    
    return isNaN(revenue) ? 0 : revenue - discountAmount;
  };

  // Get discount amount for display
  const getDiscountAmount = (appointmentId) => {
    const revenue = parseFloat(revenueData[appointmentId] || 0);
    const discountPercent = parseFloat(discountData[appointmentId] || 0);
    return calculateDiscountAmount(revenue, discountPercent);
  };

  // Compute total revenue based on input values
  const computeTotalRevenue = () => {
    let totalRev = 0;
    let totalDisc = 0;

    appointments.forEach(appt => {
      const revenue = parseFloat(revenueData[appt.id] || 0);
      const discountPercent = parseFloat(discountData[appt.id] || 0);
      
      if (!isNaN(revenue)) {
        totalRev += revenue;
        
        if (!isNaN(discountPercent)) {
          const discountAmount = calculateDiscountAmount(revenue, discountPercent);
          totalDisc += discountAmount;
        }
      }
    });

    setTotalRevenue(totalRev - totalDisc);
    setTotalDiscount(totalDisc);
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

    // Create appointment details with service information
    const appointmentDetails = appointments.map(appt => {
      const grossRevenue = parseFloat(revenueData[appt.id] || 0);
      const discountPercent = parseFloat(discountData[appt.id] || 0);
      const discountAmount = getDiscountAmount(appt.id);
      const netRevenue = computeNetRevenue(appt.id);
      const services = getAppointmentServices(appt);
      
      return {
        id: appt.id,
        gross_revenue: grossRevenue,
        discount_percent: discountPercent,
        discount_amount: discountAmount,
        net_revenue: netRevenue,
        service_types: services
      };
    });

    // Create a new revenue record with discount information
    const revenueRecord = {
      revenue_date: new Date().toISOString().slice(0, 10), // Format: 'YYYY-MM-DD'
      total_revenue: totalRevenue, // Net revenue (after discounts)
      total_discount: totalDiscount,
      appointments: appointmentIds,
      appointment_details: appointmentDetails,
      service_types: appointmentDetails.map(d => d.service_types).flat()
    };

    // For debugging - log the data being sent
    console.log("Sending revenue data:", revenueRecord);

    // POST the new revenue record to the Laravel backend API endpoint
    apiClient.post('/revenue-history', revenueRecord)
      .then(response => {
        if (response.data.success) {
          // Clear localStorage for completed appointments and reset component state
          localStorage.removeItem('completedAppointments');
          setSaveSuccess(true);
          setTimeout(() => {
            setAppointments([]);
            setRevenueData({});
            setDiscountData({});
            setTotalRevenue(0);
            setTotalDiscount(0);
            setSaveSuccess(false);
          }, 2000);
        } else {
          alert("Error saving revenue: " + (response.data.error || "Unknown error."));
        }
        setIsLoading(false);
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

  return (
    <div className="revenue-container">
      <div className="revenue-header">
        <h2>Revenue Management</h2>
        <p className="revenue-subtitle">Track and manage completed service appointments</p>
      </div>
      
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
                    <th>Discount (%)</th>
                    <th>Discount Amount</th>
                    <th>Net Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {appointments.map(appt => {
                    const { service, date } = getServiceInfo(appt.services);
                    const netRevenue = computeNetRevenue(appt.id);
                    const discountAmount = getDiscountAmount(appt.id);
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
                        <td className="discount-input-column">
                          <div className="discount-input-wrapper">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              step="0.1"
                              placeholder="0"
                              value={discountData[appt.id] || ''}
                              onChange={(e) => handleDiscountChange(appt.id, e.target.value)}
                            />
                            <span className="percent-symbol">%</span>
                          </div>
                        </td>
                        <td className="discount-amount-column">
                          <div className="discount-amount">₱ {discountAmount.toFixed(2)}</div>
                        </td>
                        <td className="net-amount-column">
                          <div className="net-amount">₱ {netRevenue.toFixed(2)}</div>
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
                {saveSuccess && (
                  <div className="success-message">
                    <span className="success-icon">✅</span>
                    Revenue saved successfully!
                  </div>
                )}
              </div>
              <div className="summary-details">
                <div className="summary-item">
                  <h3>Total Discount:</h3>
                  <div className="total-discount">₱ {totalDiscount.toFixed(2)}</div>
                </div>
                <div className="summary-item">
                  <h3>Net Revenue:</h3>
                  <div className="total-amount">₱ {totalRevenue.toFixed(2)}</div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Revenue;