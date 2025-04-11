import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import { parseISO, format } from 'date-fns';
import "react-datepicker/dist/react-datepicker.css";
import '../styles/Booking.css';
import axios from 'axios';

// Base URL for Laravel API
const API_BASE_URL = 'http://localhost:8000/api';

const serviceOptions = {
  cleaning: "Cleaning",
  repair: "Repair",
  installation: "Installation",
  maintenance: "Checkup and Maintenance",
};

const acTypeOptions = [
  "Windows",
  "Split"
];

const Booking = () => {
  const [selectedServices, setSelectedServices] = useState([]);
  const [serviceDates, setServiceDates] = useState({});
  const [serviceAcTypes, setServiceAcTypes] = useState({});
  const [globalAvailableDates, setGlobalAvailableDates] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch available dates from Laravel backend
    axios.get(`${API_BASE_URL}/getAvailableDates`, {
      params: { 
        global: 1, 
        start: '2025-01-01', 
        end: '2025-12-31'
      }
    })
      .then(response => {
        const dates = response.data.map(dateStr => parseISO(dateStr));
        setGlobalAvailableDates(dates);
      })
      .catch(err => console.error("Error fetching available dates:", err));
  }, []);

  const handleServiceChange = (e) => {
    const { value, checked } = e.target;
    if (checked) {
      setSelectedServices(prev => [...prev, value]);
      setServiceDates(prev => ({ ...prev, [value]: null }));
      setServiceAcTypes(prev => ({ ...prev, [value]: [] }));
    } else {
      setSelectedServices(prev => prev.filter(service => service !== value));
      setServiceDates(prev => {
        const newDates = { ...prev };
        delete newDates[value];
        return newDates;
      });
      setServiceAcTypes(prev => {
        const newAcTypes = { ...prev };
        delete newAcTypes[value];
        return newAcTypes;
      });
    }
  };

  const handleACTypeChange = (service, acType) => {
    setServiceAcTypes(prev => {
      const currentTypes = prev[service] || [];
      if (currentTypes.includes(acType)) {
        // Remove the AC type if it's already selected
        return {
          ...prev,
          [service]: currentTypes.filter(type => type !== acType)
        };
      } else {
        // Add the AC type if it's not already selected
        return {
          ...prev,
          [service]: [...currentTypes, acType]
        };
      }
    });
  };

  const handleServiceDateChange = (service, date) => {
    setServiceDates(prev => ({ ...prev, [service]: date }));
  };

  const isDateGloballyAvailable = (date) => {
    if (globalAvailableDates.length === 0) return true;
    return globalAvailableDates.some(avDate =>
      avDate.toDateString() === date.toDateString()
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validation
    for (const service of selectedServices) {
      const selectedDate = serviceDates[service];
      if (!selectedDate) {
        alert(`Please select a date for ${serviceOptions[service]}.`);
        return;
      }
      if (!isDateGloballyAvailable(selectedDate)) {
        alert(`The selected date for ${serviceOptions[service]} is no longer available. Please select another date.`);
        return;
      }
      if (!serviceAcTypes[service] || serviceAcTypes[service].length === 0) {
        alert(`Please select at least one AC type for ${serviceOptions[service]}.`);
        return;
      }
    }

    const formData = new FormData(e.target);
    const bookingData = {
      name: formData.get('name'),
      phone: formData.get('phone'),
      email: formData.get('email'),
      completeAddress: formData.get('completeAddress'),
      services: selectedServices.map(service => ({
        type: serviceOptions[service],
        date: serviceDates[service] ? format(serviceDates[service], 'yyyy-MM-dd') : null,
        acTypes: serviceAcTypes[service] || []
      }))
    };

    // Send booking data to Laravel backend
    axios.post(`${API_BASE_URL}/booking`, bookingData)
      .then(response => {
        console.log("Response from backend:", response.data);
        if (response.data.bookingId) {
          navigate('/confirmation', { state: bookingData });
        } else {
          alert("Error saving booking: " + response.data.message);
        }
      })
      .catch(error => {
        console.error("Error saving booking:", error);
        alert("Error saving booking. Please try again later.");
      });
  };

  return (
    <div className="booking-container">
      <h2>Book Your Appointment</h2>
      <div className="booking-box">
        <form onSubmit={handleSubmit}>
          <div className="form-section customer-details">
            <h3>Personal Information</h3>
            <div className="input-group">
              <label htmlFor="name">Full Name<span className="required">*</span></label>
              <input 
                type="text" 
                id="name" 
                name="name" 
                placeholder="Enter your name" 
                required 
                pattern="[A-Za-z ]+" 
                title="Name should contain only letters and spaces." 
              />
            </div>
            
            <div className="input-group">
              <label htmlFor="phone">Phone Number<span className="required">*</span></label>
              <input 
                type="tel" 
                id="phone" 
                name="phone" 
                placeholder="Enter 11-digit phone number" 
                required 
                pattern="^[0-9]{11}$" 
                title="Phone number must be exactly 11 digits." 
              />
            </div>
            
            <div className="input-group">
              <label htmlFor="email">Email Address</label>
              <input 
                type="email" 
                id="email" 
                name="email" 
                placeholder="Enter your email (optional)" 
              />
            </div>
          </div>

          <div className="form-section address-section">
            <h3>Service Location</h3>
            <div className="input-group">
              <label htmlFor="completeAddress">Complete Address<span className="required">*</span></label>
              <input 
                type="text" 
                id="completeAddress" 
                name="completeAddress" 
                placeholder="Enter your complete address" 
                required 
              />
            </div>
          </div>

          <div className="form-section service-section">
            <h3>Service Selection</h3>
            <p className="section-hint">Select one or more services that you need</p>
            <div className="service-options">
              {Object.entries(serviceOptions).map(([key, label]) => (
                <label key={key} className="checkbox-container">
                  <input 
                    type="checkbox" 
                    value={key} 
                    checked={selectedServices.includes(key)} 
                    onChange={handleServiceChange} 
                  />
                  <span className="checkbox-label">{label}</span>
                </label>
              ))}
            </div>
            
            {selectedServices.length > 0 && (
              <div className="service-configuration">
                {selectedServices.map(service => (
                  <div key={service} className="service-config-box">
                    <h4>{serviceOptions[service]} Service Details</h4>
                    
                    <div className="date-picker-group">
                      <label>Date for {serviceOptions[service]}<span className="required">*</span></label>
                      <DatePicker
                        selected={serviceDates[service]}
                        onChange={(date) => handleServiceDateChange(service, date)}
                        minDate={new Date()}
                        filterDate={isDateGloballyAvailable}
                        placeholderText="Select available date"
                        required
                        dateFormat="yyyy-MM-dd"
                        calendarClassName="custom-calendar"
                        className="date-input"
                      />
                    </div>
                    
                    <div className="ac-type-group">
                      <label>AC Types for {serviceOptions[service]}<span className="required">*</span></label>
                      <div className="ac-type-options">
                        {acTypeOptions.map(acType => (
                          <label key={`${service}-${acType}`} className="checkbox-container">
                            <input 
                              type="checkbox" 
                              checked={serviceAcTypes[service]?.includes(acType) || false}
                              onChange={() => handleACTypeChange(service, acType)} 
                            />
                            <span className="checkbox-label">{acType}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="form-submit">
            <button type="submit">Schedule Appointment</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Booking;