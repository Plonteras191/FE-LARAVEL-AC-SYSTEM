import React, { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import axios from 'axios';
import { FaCalendarAlt, FaClock, FaTools, FaUser, FaTimes, FaMapMarkerAlt } from 'react-icons/fa';
import '../styles/AdminCalendar.css';

// Base URL for Laravel API
const API_BASE_URL = 'http://localhost:8000/api';

const AdminCalendar = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [serviceTypes, setServiceTypes] = useState([]);
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = () => {
    setLoading(true);
    axios.get(`${API_BASE_URL}/appointments`)
      .then(response => {
        let appointments = response.data;
        if (!Array.isArray(appointments)) appointments = [appointments];
        
        // Extract unique service types from all appointments
        const allServiceTypes = new Set();
        appointments.forEach(appt => {
          try {
            const services = JSON.parse(appt.services || '[]');
            services.forEach(service => {
              if (service.type) allServiceTypes.add(service.type);
            });
          } catch (error) {
            console.error("Error parsing services:", error);
          }
        });
        setServiceTypes([...allServiceTypes]);
        
        // Map each appointment service into a FullCalendar event
        const calendarEvents = [];
        appointments.forEach(appt => {
          try {
            const services = JSON.parse(appt.services || '[]');
            
            services.forEach(service => {
              // Determine color based on service type and status
              const serviceColors = {
                'Cleaning': '#4e73df',
                'Repair': '#e74a3b',
                'Installation': '#1cc88a',
                'Maintenance': '#f6c23e',
                'Checkup': '#808080'
              };
              
              // Status modifiers (make events slightly transparent based on status)
              const statusOpacity = {
                'Pending': '0.7',
                'Accepted': '1',
                'Completed': '0.5',
                'Revenue Processed': '0.3',
              };
              
              const defaultColor = '#6c757d';
              const backgroundColor = serviceColors[service.type] || defaultColor;
              const opacity = statusOpacity[appt.status] || '1';
              
              calendarEvents.push({
                id: `${appt.id}-${service.type}`,
                title: `${service.type} (ID: ${appt.id})`,
                start: service.date, // Assuming date format is compatible with FullCalendar
                allDay: true, // Set to false if you add specific time
                backgroundColor: backgroundColor,
                borderColor: backgroundColor,
                textColor: '#ffffff',
                opacity: opacity,
                extendedProps: { 
                  bookingId: appt.id,
                  service: service.type,
                  customer: appt.name || 'Customer',
                  phone: appt.phone,
                  email: appt.email,
                  address: appt.complete_address,
                  status: appt.status || 'Pending',
                  acTypes: service.acTypes || [],
                  date: service.date
                }
              });
            });
          } catch (error) {
            console.error("Error creating events:", error);
          }
        });
        
        setEvents(calendarEvents);
      })
      .catch(error => {
        console.error("Error fetching appointments:", error);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  // Handle event click to show details
  const handleEventClick = (clickInfo) => {
    setSelectedEvent(clickInfo.event);
  };

  // Close event detail modal
  const closeEventModal = () => {
    setSelectedEvent(null);
  };

  // Filter events by service type and status
  const filteredEvents = events.filter(event => {
    const serviceMatch = filterType === 'all' || event.extendedProps.service === filterType;
    const statusMatch = filterStatus === 'all' || event.extendedProps.status === filterStatus;
    return serviceMatch && statusMatch;
  });

  // Format date for display in the modal
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="admin-calendar-container">
      <div className="calendar-header">
        <div className="calendar-title">
          <FaCalendarAlt className="calendar-icon" />
          <h2>Service Appointment Calendar</h2>
        </div>
        <div className="calendar-filters">
          <div className="filter-control">
            <label htmlFor="serviceFilter">Service:</label>
            <select 
              id="serviceFilter" 
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="service-filter"
            >
              <option value="all">All Services</option>
              {serviceTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
          <div className="filter-control">
            <label htmlFor="statusFilter">Status:</label>
            <select 
              id="statusFilter" 
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="status-filter"
            >
              <option value="all">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Accepted">Accepted</option>
              <option value="Completed">Completed</option>
              <option value="Revenue Processed">Revenue Processed</option>
            </select>
          </div>
          <button onClick={fetchAppointments} className="refresh-button">
            Refresh Calendar
          </button>
        </div>
      </div>
      
      <div className="calendar-view-legend">
        <div className="calendar-legend">
          <div className="legend-title">Service Types:</div>
          <div className="legend-items">
            <div className="legend-item">
              <span className="color-box" style={{backgroundColor: '#4e73df'}}></span>
              <span>Cleaning</span>
            </div>
            <div className="legend-item">
              <span className="color-box" style={{backgroundColor: '#e74a3b'}}></span>
              <span>Repair</span>
            </div>
            <div className="legend-item">
              <span className="color-box" style={{backgroundColor: '#1cc88a'}}></span>
              <span>Installation</span>
            </div>
            <div className="legend-item">
              <span className="color-box" style={{backgroundColor: '#808080'}}></span>
              <span>Maintenance</span>
            </div>
          </div>
        </div>
      </div>
      
      {loading ? (
        <div className="calendar-loading">
          <div className="loader"></div>
          <p>Loading appointments...</p>
        </div>
      ) : (
        <div className="calendar-wrapper">
          <FullCalendar 
            plugins={[dayGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'dayGridMonth'
            }}
            events={filteredEvents}
            eventTimeFormat={{
              hour: '2-digit',
              minute: '2-digit',
              hour12: true
            }}
            height="auto"
            eventClick={handleEventClick}
            nowIndicator={true}
            dayMaxEvents={true}
            eventDisplay="block"
            eventContent={(eventInfo) => {
              return (
                <div className="custom-event-content" style={{opacity: eventInfo.event.extendedProps.opacity}}>
                  <div className="event-title">{eventInfo.event.title}</div>
                  <div className="event-customer">
                    <FaUser size="0.8em" /> {eventInfo.event.extendedProps.customer}
                  </div>
                </div>
              );
            }}
          />
        </div>
      )}
      
      {/* Event Details Modal */}
      {selectedEvent && (
        <div className="event-modal-overlay" onClick={closeEventModal}>
          <div className="event-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="event-modal-header" style={{backgroundColor: selectedEvent.backgroundColor}}>
              <h3>{selectedEvent.extendedProps.service}</h3>
              <button className="close-modal" onClick={closeEventModal}>
                <FaTimes />
              </button>
            </div>
            <div className="event-modal-body">
              <div className="event-detail">
                <FaCalendarAlt /> 
                <span>{formatDate(selectedEvent.extendedProps.date)}</span>
              </div>
              <div className="event-detail">
                <FaTools /> 
                <span>Service: {selectedEvent.extendedProps.service}</span>
              </div>
              {selectedEvent.extendedProps.acTypes && selectedEvent.extendedProps.acTypes.length > 0 && (
                <div className="event-detail">
                  <span>AC Types: {selectedEvent.extendedProps.acTypes.join(', ')}</span>
                </div>
              )}
              <div className="event-detail">
                <FaUser /> 
                <span>Customer: {selectedEvent.extendedProps.customer}</span>
              </div>
              <div className="event-detail">
                <span>Phone: {selectedEvent.extendedProps.phone}</span>
              </div>
              {selectedEvent.extendedProps.email && (
                <div className="event-detail">
                  <span>Email: {selectedEvent.extendedProps.email}</span>
                </div>
              )}
              <div className="event-detail">
                <FaMapMarkerAlt /> 
                <span>Address: {selectedEvent.extendedProps.address}</span>
              </div>
              <div className="event-detail booking-id">
                <span>Booking ID: #{selectedEvent.extendedProps.bookingId}</span>
              </div>
              <div className="event-status">
                <span className={`status-badge ${selectedEvent.extendedProps.status.toLowerCase().replace(' ', '-')}`}>
                  {selectedEvent.extendedProps.status}
                </span>
              </div>
            </div>
            <div className="event-modal-footer">
              <button className="action-button" onClick={closeEventModal}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCalendar;