import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/Revenue.css';

// Base URL for Laravel API
const API_BASE_URL = 'http://localhost:8000/api';

const Revenue = () => {
  const [appointments, setAppointments] = useState([]);
  const [revenueData, setRevenueData] = useState({});
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // On mount, load completed appointments from localStorage
  useEffect(() => {
    const storedAppointments = localStorage.getItem('completedAppointments');
    if (storedAppointments) {
      const parsedAppointments = JSON.parse(storedAppointments);
      setAppointments(parsedAppointments);
    }
  }, []);

  const handleInputChange = (id, value) => {
    setRevenueData(prev => ({
      ...prev,
      [id]: value,
    }));
  };

  // Compute total revenue based on input values
  const computeTotalRevenue = () => {
    let total = 0;
    Object.values(revenueData).forEach(val => {
      const amount = parseFloat(val);
      if (!isNaN(amount)) {
        total += amount;
      }
    });
    setTotalRevenue(total);
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

    // Create an array of appointment IDs for the revenue record
    const appointmentIds = appointments.map(appt => appt.id);

    // Create a new revenue record
    const revenueRecord = {
      revenue_date: new Date().toISOString().slice(0, 10), // Format: 'YYYY-MM-DD'
      total_revenue: totalRevenue,
      appointments: appointmentIds
    };

    // POST the new revenue record to the Laravel backend API endpoint
    axios.post(`${API_BASE_URL}/revenue-history`, revenueRecord)
      .then(response => {
        if (response.data.success) {
          alert("Revenue record saved successfully!");
          
          // Clear localStorage for completed appointments and reset component state
          localStorage.removeItem('completedAppointments');
          setAppointments([]);
          setRevenueData({});
          setTotalRevenue(0);
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
                  </tr>
                </thead>
                <tbody>
                  {appointments.map(appt => {
                    const { service, date } = getServiceInfo(appt.services);
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
                              placeholder="0.00"
                              value={revenueData[appt.id] || ''}
                              onChange={(e) => handleInputChange(appt.id, e.target.value)}
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
                  className="compute-button" 
                  onClick={computeTotalRevenue} 
                  disabled={isLoading}
                >
                  <span className="button-icon">📊</span>
                  Compute
                </button>
                <button 
                  className="save-button" 
                  onClick={saveRevenue} 
                  disabled={isLoading}
                >
                  <span className="button-icon">💾</span>
                  {isLoading ? 'Saving...' : 'Save Record'}
                </button>
              </div>
              <div className="total-display">
                <h3>Total Revenue:</h3>
                <div className="total-amount">₱ {totalRevenue.toFixed(2)}</div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Revenue;