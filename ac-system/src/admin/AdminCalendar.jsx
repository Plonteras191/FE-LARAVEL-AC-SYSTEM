import React, { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import axios from 'axios';
import { FaCalendarAlt, FaClock, FaTools, FaUser, FaTimes } from 'react-icons/fa';
import '../styles/AdminCalendar.css';

const AdminCalendar = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [serviceTypes, setServiceTypes] = useState([]);
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = () => {
    setLoading(true);
    axios.get("http://localhost/AC-SERVICE-FINAL/backend/api/getServiceAppointments.php")
      .then(response => {
        const appointments = response.data;
        // Extract unique service types
        const types = [...new Set(appointments.map(appt => appt.service))];
        setServiceTypes(types);
        // Map each appointment into a FullCalendar event
        const calendarEvents = appointments.map(appt => {
          const start = (appt.time && appt.time.trim() !== "")
            ? `${appt.date}T${convertTimeTo24(appt.time)}`
            : appt.date;
            
          // Determine color based on service type
          const serviceColors = {
            'Cleaning': '#4e73df',
            'Repair': '#e74a3b',
            'Installation': '#1cc88a',
            'Maintenance': '#f6c23e'
          };
          const defaultColor = '#6c757d';
          const backgroundColor = serviceColors[appt.service] || defaultColor;
          
          return {
            id: `${appt.bookingId}-${appt.service}`,
            title: `${appt.service} (ID: ${appt.bookingId})`,
            start: start,
            allDay: !(appt.time && appt.time.trim() !== ""),
            backgroundColor: backgroundColor,
            borderColor: backgroundColor,
            textColor: '#ffffff',
            extendedProps: { 
              bookingId: appt.bookingId,
              service: appt.service,
              time: appt.time,
              customer: appt.name || 'Customer',
              status: appt.status || 'Scheduled'
            }
          };
        });
        setEvents(calendarEvents);
      })
      .catch(error => {
        console.error("Error fetching service appointments:", error);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  // Utility function: convert 12-hour time (e.g., "02:00 PM") to 24-hour time (e.g., "14:00:00")
  const convertTimeTo24 = (timeStr) => {
    if (!timeStr) return "00:00:00";
    
    const [time, modifier] = timeStr.split(' ');
    let [hours, minutes] = time.split(':');
    hours = parseInt(hours, 10);
    if (modifier === "PM" && hours !== 12) {
      hours += 12;
    }
    if (modifier === "AM" && hours === 12) {
      hours = 0;
    }
    return `${hours.toString().padStart(2, '0')}:${minutes}:00`;
  };

  // Handle event click to show details
  const handleEventClick = (clickInfo) => {
    setSelectedEvent(clickInfo.event);
  };

  // Close event detail modal
  const closeEventModal = () => {
    setSelectedEvent(null);
  };

  // Filter events by service type
  const filteredEvents = filterType === 'all' 
    ? events 
    : events.filter(event => event.extendedProps.service === filterType);

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
            <label htmlFor="serviceFilter">Filter by service:</label>
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
              <span>Checkup and Maintenance  </span>
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
              right: ''
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
                <div className="custom-event-content">
                  <div className="event-title">{eventInfo.event.title}</div>
                  {eventInfo.event.extendedProps.time && (
                    <div className="event-time">
                      <FaClock size="0.8em" /> {eventInfo.event.extendedProps.time}
                    </div>
                  )}
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
                <span>{formatDate(selectedEvent.start)}</span>
              </div>
              {selectedEvent.extendedProps.time && (
                <div className="event-detail">
                  <FaClock /> 
                  <span>{selectedEvent.extendedProps.time}</span>
                </div>
              )}
              <div className="event-detail">
                <FaTools /> 
                <span>Service: {selectedEvent.extendedProps.service}</span>
              </div>
              <div className="event-detail">
                <FaUser /> 
                <span>Customer: {selectedEvent.extendedProps.customer}</span>
              </div>
              <div className="event-detail booking-id">
                <span>Booking ID: #{selectedEvent.extendedProps.bookingId}</span>
              </div>
              <div className="event-status">
                <span className={`status-badge ${selectedEvent.extendedProps.status.toLowerCase()}`}>
                  {selectedEvent.extendedProps.status}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCalendar;
