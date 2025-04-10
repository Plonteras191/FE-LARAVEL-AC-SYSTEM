import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import '../styles/Confirmation.css';

const Confirmation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const bookingData = location.state || {};

  return (
    <div className="confirmation-container">
      <div className="confirmation-box">
        <h2>Appointment Pending!</h2>
        <div className="confirmation-message">
          <p>Thank you for booking your appointment with our AC service!</p>
          <p>Your appointment details have been received and are being processed.</p>
         
        </div>

        <div className="booking-summary">
          <h3>Booking Summary</h3>
          
          <div className="summary-section personal-info">
            <h4>Personal Information</h4>
            <ul>
              <li><span>Name:</span> {bookingData.name}</li>
              <li><span>Phone:</span> {bookingData.phone}</li>
              {bookingData.email && <li><span>Email:</span> {bookingData.email}</li>}
            </ul>
          </div>

          <div className="summary-section location-info">
            <h4>Service Location</h4>
            <p>{bookingData.completeAddress}</p>
          </div>

          <div className="summary-section services-info">
            <h4>Requested Services</h4>
            {bookingData.services && bookingData.services.length > 0 ? (
              <div className="service-list">
                {bookingData.services.map((service, index) => (
                  <div key={index} className="service-item">
                    <div className="service-header">
                      <span className="service-type">{service.type}</span>
                      <span className="service-date">{service.date}</span>
                    </div>
                    <div className="service-ac-types">
                      <span>AC Types:</span> {service.acTypes.join(', ')}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p>No services selected</p>
            )}
          </div>
        </div>

        <div className="actions">
          <button className="primary-button" onClick={() => navigate('/')}>
            Return to Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default Confirmation;