import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import { parseISO, format } from 'date-fns';
import "react-datepicker/dist/react-datepicker.css";
import '../styles/index.css';
import apiClient from '../services/api';

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
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    apiClient.get('/getAvailableDates', {
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
        return {
          ...prev,
          [service]: currentTypes.filter(type => type !== acType)
        };
      } else {
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
    setFormError(''); // Clear previous form-level errors

    let newErrors = { services: {} };
    let hasErrors = false;

    for (const service of selectedServices) {
      const serviceErrors = {};

      if (!serviceDates[service]) {
        serviceErrors.date = `Please select a date for ${serviceOptions[service]}.`;
        hasErrors = true;
      } else if (!isDateGloballyAvailable(serviceDates[service])) {
        serviceErrors.date = `The selected date for ${serviceOptions[service]} is no longer available. Please select another date.`;
        hasErrors = true;
      }

      if (!serviceAcTypes[service] || serviceAcTypes[service].length === 0) {
        serviceErrors.acTypes = `Please select at least one AC type for ${serviceOptions[service]}.`;
        hasErrors = true;
      }

      if (Object.keys(serviceErrors).length > 0) {
        newErrors.services[service] = serviceErrors;
      }
    }

    setErrors(newErrors);

    if (hasErrors) {
      return;
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

    apiClient.post('/booking', bookingData)
      .then(response => {
        console.log("Response from backend:", response.data);
        if (response.data.bookingId) {
          navigate('/confirmation', { state: bookingData });
        } else {
          setFormError("Error saving booking: " + response.data.message);
        }
      })
      .catch(error => {
        console.error("Error saving booking:", error);
        setFormError("Error saving booking. Please try again later.");
      });
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-12 bg-gray-50">
      <h2 className="text-4xl font-bold text-center text-sky-700 mb-8">Book Your Appointment</h2>
      <div className="bg-white rounded-xl shadow-xl overflow-hidden">
        <div className="bg-sky-50 p-6 border-b border-sky-100">
          <div className="flex items-center space-x-3">
            <div className="bg-sky-700 rounded-full p-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-sky-800">Schedule your service</h3>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {formError && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
              <span className="block sm:inline">{formError}</span>
            </div>
          )}
          <div className="space-y-8">
            <div>
              <h3 className="text-xl font-semibold text-sky-700 mb-3 flex items-center">
                <span className="bg-sky-100 text-sky-700 rounded-full w-7 h-7 inline-flex items-center justify-center mr-2">1</span>
                Service Selection
              </h3>
              <p className="text-gray-600 mb-4">Select one or more services that you need</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(serviceOptions).map(([key, label]) => (
                  <label 
                    key={key} 
                    className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all
                      ${selectedServices.includes(key) 
                          ? 'border-sky-500 bg-sky-50 shadow-sm' 
                          : 'border-gray-200 hover:border-sky-200'}`}
                  >
                    <input 
                      type="checkbox" 
                      value={key} 
                      checked={selectedServices.includes(key)} 
                      onChange={handleServiceChange}
                      className="w-5 h-5 text-sky-600 rounded focus:ring-sky-500" 
                    />
                    <div className="ml-3">
                      <span className="font-medium text-gray-800">{label}</span>
                    </div>
                  </label>
                ))}
              </div>
              
              {selectedServices.length > 0 && (
                <div className="mt-8 space-y-8">
                  {selectedServices.map(service => (
                    <div key={service} className="bg-white p-5 rounded-lg border border-sky-100 shadow-sm">
                      <h4 className="text-lg font-medium text-sky-700 mb-4 pb-2 border-b border-sky-50">{serviceOptions[service]} Service Details</h4>
                      
                      <div className="mb-5">
                        <label className="block text-gray-700 font-medium mb-2">
                          Date for {serviceOptions[service]}<span className="text-red-500 ml-1">*</span>
                        </label>
                        <DatePicker
                          selected={serviceDates[service]}
                          onChange={(date) => handleServiceDateChange(service, date)}
                          minDate={new Date()}
                          filterDate={isDateGloballyAvailable}
                          placeholderText="Select available date"
                          required
                          dateFormat="yyyy-MM-dd"
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                        />
                        {errors.services?.[service]?.date && (
                          <p className="text-red-500 text-sm mt-1">{errors.services[service].date}</p>
                        )}
                      </div>
                      
                      <div>
                        <label className="block text-gray-700 font-medium mb-2">
                          AC Types for {serviceOptions[service]}<span className="text-red-500 ml-1">*</span>
                        </label>
                        <div className="flex flex-wrap gap-3">
                          {acTypeOptions.map(acType => (
                            <label 
                              key={`${service}-${acType}`} 
                              className={`flex items-center px-4 py-2 border-2 rounded-lg cursor-pointer transition-all
                                ${serviceAcTypes[service]?.includes(acType) 
                                    ? 'border-sky-500 bg-sky-50 shadow-sm' 
                                    : 'border-gray-200 hover:border-sky-200'}`}
                            >
                              <input 
                                type="checkbox" 
                                checked={serviceAcTypes[service]?.includes(acType) || false}
                                onChange={() => handleACTypeChange(service, acType)}
                                className="w-4 h-4 text-sky-600 rounded focus:ring-sky-500" 
                              />
                              <span className="ml-2 font-medium text-gray-800">{acType}</span>
                            </label>
                          ))}
                        </div>
                        {errors.services?.[service]?.acTypes && (
                          <p className="text-red-500 text-sm mt-2">{errors.services[service].acTypes}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {selectedServices.length > 0 && (
              <div>
                <h3 className="text-xl font-semibold text-sky-700 mb-3 flex items-center">
                  <span className="bg-sky-100 text-sky-700 rounded-full w-7 h-7 inline-flex items-center justify-center mr-2">2</span>
                  Personal Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                  <div>
                    <label htmlFor="name" className="block text-gray-700 font-medium mb-2">
                      Full Name<span className="text-red-500 ml-1">*</span>
                    </label>
                    <input 
                      type="text" 
                      id="name" 
                      name="name" 
                      placeholder="Enter your name" 
                      required 
                      pattern="[A-Za-z ]+" 
                      title="Name should contain only letters and spaces."
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500" 
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="phone" className="block text-gray-700 font-medium mb-2">
                      Phone Number<span className="text-red-500 ml-1">*</span>
                    </label>
                    <input 
                      type="tel" 
                      id="phone" 
                      name="phone" 
                      placeholder="Enter 11-digit phone number" 
                      required 
                      pattern="^[0-9]{11}$" 
                      title="Phone number must be exactly 11 digits."
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500" 
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label htmlFor="email" className="block text-gray-700 font-medium mb-2">
                      Email Address
                    </label>
                    <input 
                      type="email" 
                      id="email" 
                      name="email" 
                      placeholder="Enter your email (optional)"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500" 
                    />
                  </div>
                </div>
              </div>
            )}

            {selectedServices.length > 0 && (
              <div>
                <h3 className="text-xl font-semibold text-sky-700 mb-3 flex items-center">
                  <span className="bg-sky-100 text-sky-700 rounded-full w-7 h-7 inline-flex items-center justify-center mr-2">3</span>
                  Service Location
                </h3>
                <div className="mt-4">
                  <label htmlFor="completeAddress" className="block text-gray-700 font-medium mb-2">
                    Complete Address<span className="text-red-500 ml-1">*</span>
                  </label>
                  <textarea 
                    id="completeAddress" 
                    name="completeAddress" 
                    placeholder="Enter your complete address" 
                    required
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 h-24" 
                  ></textarea>
                </div>
              </div>
            )}

            {selectedServices.length > 0 && (
              <div className="mt-8 pt-6 border-t border-gray-100">
                <button 
                  type="submit"
                  className="w-full md:w-auto bg-sky-600 hover:bg-sky-700 text-white font-medium py-3 px-8 rounded-lg transition-colors focus:outline-none focus:ring-4 focus:ring-sky-300 shadow-md hover:shadow-lg flex items-center justify-center mx-auto"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Schedule Appointment
                </button>
              </div>
            )}
          </div>
        </form>
      </div>  
    </div>
  );
};

export default Booking;