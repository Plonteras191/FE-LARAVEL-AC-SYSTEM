import React from 'react';
import '../styles/Services.css';

const Services = () => {
  const services = [
    {
      title: 'Routine Maintenance and Cleaning',
      description: 'Regular check-ups and cleaning to keep your AC running efficiently and prevent unexpected breakdowns.',
      price: 'Price range from ₱500 - 2500',
      icon: '🧹' // Added icons for visual appeal
    },
    {
      title: 'Repair',
      description: 'Quick and reliable repairs to fix any issues with your air conditioning system, ensuring maximum comfort.',
      price: 'Price range from ₱1000 - 3000',
      icon: '🔧'
    },
    {
      title: 'Installation',
      description: 'Professional installation services for new air conditioning units with expert advice and support.',
      price: 'Price range from ₱1500 - 5000',
      icon: '⚙️'
    },
  ];

  return (
    <section className="services-section" id="services">
      <div className="services-container">
        <div className="services-header">
          <h2>Our Services</h2>
          <div className="accent-line"></div>
          <p className="services-subtitle">Professional air conditioning solutions for your home and business</p>
        </div>
        
        <div className="services-grid">
          {services.map((service, index) => (
            <div key={index} className="service-box">
              <div className="service-icon">{service.icon}</div>
              <h3>{service.title}</h3>
              <p className="service-description">{service.description}</p>
              {service.price && <p className="service-price">{service.price}</p>}
              
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Services;