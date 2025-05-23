import React, { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import { parseISO, format } from 'date-fns';
import "react-datepicker/dist/react-datepicker.css";
import BookingModal from '../components/bookingModal';
import '../styles/AdminBooking.css';
import apiClient from '../services/api';
import { 
  FaUser, 
  FaPhone, 
  FaEnvelope, 
  FaMapMarkerAlt, 
  FaTools, 
  FaCalendarAlt, 
  FaSnowflake, 
  FaCheckCircle,
  FaClipboardCheck
} from 'react-icons/fa';

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

const AdminBooking = () => {
  const [selectedServices, setSelectedServices] = useState([]);
  const [serviceDates, setServiceDates] = useState({});
  const [serviceAcTypes, setServiceAcTypes] = useState({});
  const [globalAvailableDates, setGlobalAvailableDates] = useState([]);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [bookingRef, setBookingRef] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Fetch available dates using apiClient
    setIsLoading(true);
    apiClient.get('/getAvailableDates', {
      params: { 
        global: 1, 
        start: format(new Date(), 'yyyy-MM-dd'),
        end: format(new Date(new Date().setFullYear(new Date().getFullYear() + 1)), 'yyyy-MM-dd')
      }
    })
      .then(response => {
        const dates = response.data.map(dateStr => parseISO(dateStr));
        setGlobalAvailableDates(dates);
        setIsLoading(false);
      })
      .catch(err => {
        console.error("Error fetching available dates:", err);
        setIsLoading(false);
      });
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

    // Show loading state
    setIsLoading(true);

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

    // Send booking data with apiClient
    apiClient.post('/booking', bookingData)
      .then(response => {
        console.log("Response from backend:", response.data);
        setIsLoading(false);
        if (response.data.bookingId) {
          // Set the booking reference ID and open the confirmation modal
          setBookingRef(response.data.bookingId);
          setIsConfirmModalOpen(true);
          
          // Reset form after successful submission
          resetForm();
        } else {
          alert("Error saving booking: " + response.data.message);
        }
      })
      .catch(error => {
        setIsLoading(false);
        console.error("Error saving booking:", error);
        if (error.response && error.response.data && error.response.data.message) {
          alert("Error: " + error.response.data.message);
        } else {
          alert("Error saving booking. Please try again later.");
        }
      });
  };

  // Reset form to initial state
  const resetForm = () => {
    setSelectedServices([]);
    setServiceDates({});
    setServiceAcTypes({});
    // Reset the form element
    document.getElementById("adminBookingForm").reset();
  };

  // Close the modal
  const handleModalClose = () => {
    setIsConfirmModalOpen(false);
  };
  return (
    <div className="booking-container admin-booking">
      <div className="booking-header">
        <h2>Create New Booking</h2>
        <p className="subtitle">Schedule a new service appointment for a customer</p>
      </div>

      {isLoading && (
        <div className="loading-overlay">
          <div className="loader"></div>
          <p>Processing request...</p>
        </div>
      )}

      <div className="booking-box">
        <form id="adminBookingForm" onSubmit={handleSubmit}>
          <div className="form-section customer-details">
            <div className="section-header">
              <FaUser className="section-icon" />
              <h3>Customer Information</h3>
            </div>
            <div className="input-grid">
              <div className="input-group">
                <label htmlFor="name">
                  <FaUser className="input-icon" />
                  Customer Name<span className="required">*</span>
                </label>
                <input 
                  type="text" 
                  id="name" 
                  name="name" 
                  placeholder="Enter customer name" 
                  required 
                  pattern="[A-Za-z ]+" 
                  title="Name should contain only letters and spaces."
                  disabled={isLoading}
                  className="styled-input"
                />
              </div>
              
              <div className="input-group">
                <label htmlFor="phone">
                  <FaPhone className="input-icon" />
                  Phone Number<span className="required">*</span>
                </label>
                <input 
                  type="tel" 
                  id="phone" 
                  name="phone" 
                  placeholder="Enter 11-digit phone number" 
                  required 
                  pattern="^[0-9]{11}$" 
                  title="Phone number must be exactly 11 digits."
                  disabled={isLoading}
                  className="styled-input"
                />
              </div>
              
              <div className="input-group">
                <label htmlFor="email">
                  <FaEnvelope className="input-icon" />
                  Email Address
                </label>
                <input 
                  type="email" 
                  id="email" 
                  name="email" 
                  placeholder="Enter customer email (optional)"
                  disabled={isLoading}
                  className="styled-input"
                />
              </div>
            </div>
          </div>

          <div className="form-section address-section">
            <div className="section-header">
              <FaMapMarkerAlt className="section-icon" />
              <h3>Service Location</h3>
            </div>
            <div className="input-group">
              <label htmlFor="completeAddress">
                <FaMapMarkerAlt className="input-icon" />
                Complete Address<span className="required">*</span>
              </label>
              <input 
                type="text" 
                id="completeAddress" 
                name="completeAddress" 
                placeholder="Enter customer's complete address" 
                required
                disabled={isLoading}
                className="styled-input full-width"
              />
            </div>
          </div>

          <div className="form-section service-section">
            <div className="section-header">
              <FaTools className="section-icon" />
              <h3>Service Selection</h3>
            </div>
            <p className="section-hint">Select one or more services to book</p>
            <div className="service-options">
              {Object.entries(serviceOptions).map(([key, label]) => (
                <label key={key} className="checkbox-container">
                  <input 
                    type="checkbox" 
                    value={key} 
                    checked={selectedServices.includes(key)} 
                    onChange={handleServiceChange}
                    disabled={isLoading}
                  />
                  <span className="checkbox-label">{label}</span>
                </label>
              ))}
            </div>
            
            {selectedServices.length > 0 && (
              <div className="service-configuration">
                {selectedServices.map(service => (
                  <div key={service} className="service-config-box">
                    <h4>
                      <FaClipboardCheck />
                      {serviceOptions[service]} Service Details
                    </h4>
                    
                    <div className="date-picker-group">
                      <label>
                        <FaCalendarAlt className="input-icon" />
                        Date for {serviceOptions[service]}<span className="required">*</span>
                      </label>
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
                        disabled={isLoading}
                      />
                    </div>
                    
                    <div className="ac-type-group">
                      <label>
                        <FaSnowflake className="input-icon" />
                        AC Types for {serviceOptions[service]}<span className="required">*</span>
                      </label>
                      <div className="ac-type-options">
                        {acTypeOptions.map(acType => (
                          <label key={`${service}-${acType}`} className="checkbox-container">
                            <input 
                              type="checkbox" 
                              checked={serviceAcTypes[service]?.includes(acType) || false}
                              onChange={() => handleACTypeChange(service, acType)}
                              disabled={isLoading}
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
            <button type="submit" disabled={isLoading}>
              <FaCheckCircle />
              {isLoading ? "Processing..." : "Create Booking"}
            </button>
          </div>
        </form>
      </div>
      
      <BookingModal 
        isOpen={isConfirmModalOpen}
        onClose={handleModalClose}
        title="Booking Confirmation"
      >
        <div className="booking-success">
          <h3>
            <FaCheckCircle />
            Booking Created Successfully!
          </h3>
          <p>The booking has been successfully created and saved to the system.</p>
          <div className="booking-reference">
            <FaClipboardCheck />
            Reference ID: <span>{bookingRef}</span>
          </div>
          <div className="booking-success-actions">
            <button onClick={handleModalClose}>
              Close
            </button>
          </div>
        </div>
      </BookingModal>
    </div>
  );
};

export default AdminBooking;