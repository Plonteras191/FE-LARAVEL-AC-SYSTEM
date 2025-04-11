import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Modal from '../components/Modal';
import { useNavigate } from 'react-router-dom';
import '../styles/AdminAppointments.css';

// Base URL for Laravel API
const API_BASE_URL = 'http://localhost:8000/api';

const AdminAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [rescheduleInputs, setRescheduleInputs] = useState({});
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch appointments from Laravel backend
    axios.get(`${API_BASE_URL}/appointments`)
      .then(response => {
        let data = response.data;
        if (!Array.isArray(data)) data = [data];
        // Filter to show only pending appointments
        const pending = data.filter(appt => !appt.status || appt.status.toLowerCase() === 'pending');
        setAppointments(pending);
      })
      .catch(error => console.error("Error fetching appointments:", error));
  }, []);

  // Delete (reject) appointment
  const handleCancelAppointment = async (id) => {
    try {
      await axios.delete(`${API_BASE_URL}/appointments/${id}`);
      setAppointments(prev => prev.filter(appt => appt.id !== id));
    } catch (error) {
      console.error("Error deleting appointment:", error);
    }
  };

  // Open modal to confirm rejection
  const openRejectModal = (id) => {
    setSelectedAppointmentId(id);
    setIsConfirmModalOpen(true);
  };

  // Confirm rejection and delete appointment
  const handleConfirmReject = () => {
    handleCancelAppointment(selectedAppointmentId);
    setIsConfirmModalOpen(false);
    setSelectedAppointmentId(null);
  };

  const handleCancelModal = () => {
    setIsConfirmModalOpen(false);
    setSelectedAppointmentId(null);
  };

  // Toggle inline reschedule input for a given appointment service
  const toggleRescheduleInput = (appointmentId, serviceType, index) => {
    const key = `${appointmentId}-${serviceType}-${index}`;
    setRescheduleInputs(prev => {
      const newState = { ...prev };
      if (newState[key] !== undefined) {
        delete newState[key];
      } else {
        newState[key] = "";
      }
      return newState;
    });
  };

  // Handle change for inline reschedule input
  const handleRescheduleInputChange = (appointmentId, serviceType, index, value) => {
    const key = `${appointmentId}-${serviceType}-${index}`;
    setRescheduleInputs(prev => ({ ...prev, [key]: value }));
  };

  // Confirm reschedule for a specific service in an appointment
  const handleServiceRescheduleConfirm = async (appointmentId, serviceType, index) => {
    const key = `${appointmentId}-${serviceType}-${index}`;
    const newDate = rescheduleInputs[key];
    if (!newDate) return;
    const payload = { service_name: serviceType, new_date: newDate };
    try {
      const response = await axios.put(`${API_BASE_URL}/appointments/${appointmentId}?action=reschedule`, payload);
      if (response.data && !response.data.error) {
        setAppointments(prev =>
          prev.map(appt => (appt.id === appointmentId ? response.data : appt))
        );
        setRescheduleInputs(prev => {
          const newState = { ...prev };
          delete newState[key];
          return newState;
        });
      } else {
        console.error("Backend error:", response.data.error);
      }
    } catch (error) {
      console.error("Error rescheduling service:", error);
    }
  };

  // Cancel inline reschedule input for a specific service
  const handleRescheduleCancel = (appointmentId, serviceType, index) => {
    const key = `${appointmentId}-${serviceType}-${index}`;
    setRescheduleInputs(prev => {
      const newState = { ...prev };
      delete newState[key];
      return newState;
    });
  };

  // Accept appointment by sending a POST request with action=accept
  const handleAcceptAppointment = async (id) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/appointments/${id}/accept`);
      if (
        response.data &&
        response.data.status &&
        response.data.status.toLowerCase() === 'accepted'
      ) {
        // If appointment accepted successfully, remove from the list
        setAppointments(prev => prev.filter(appt => appt.id !== id));
      }
    } catch (error) {
      console.error("Error accepting appointment:", error);
    }
  };

  // Utility function to parse services JSON string
  const parseServices = (servicesStr) => {
    try {
      return JSON.parse(servicesStr);
    } catch (error) {
      console.error("Error parsing services:", error);
      return [];
    }
  };

  return (
    <div className="admin-appointments-container">
      <h2>Admin Appointments</h2>
      {appointments.length === 0 ? (
        <p>No appointments available.</p>
      ) : (
        <table className="appointments-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Customer</th>
              <th>Phone</th>
              <th>Email</th>
              <th>Service(s)</th>
              <th>AC Type(s)</th>
              <th>Address</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {appointments.map((appt) => {
              const services = parseServices(appt.services);
              return (
                <tr key={appt.id}>
                  <td>{appt.id}</td>
                  <td>{appt.name}</td>
                  <td>{appt.phone}</td>
                  <td>{appt.email || 'N/A'}</td>
                  <td>
                    {services.length > 0 ? (
                      services.map((s, index) => {
                        const key = `${appt.id}-${s.type}-${index}`;
                        return (
                          <div key={key}>
                            <span>
                              {index + 1}. {s.type} on {s.date}
                            </span>
                            {rescheduleInputs[key] !== undefined ? (
                              <div className="reschedule-input-container">
                                <input
                                  type="date"
                                  value={rescheduleInputs[key]}
                                  onChange={(e) =>
                                    handleRescheduleInputChange(appt.id, s.type, index, e.target.value)
                                  }
                                  className="reschedule-date-input"
                                />
                                <button
                                  className="confirm-button"
                                  onClick={() => handleServiceRescheduleConfirm(appt.id, s.type, index)}
                                  disabled={!rescheduleInputs[key]}
                                >
                                  Confirm
                                </button>
                                <button
                                  className="cancel-button"
                                  onClick={() => handleRescheduleCancel(appt.id, s.type, index)}
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <button
                                className="reschedule-button"
                                onClick={() => toggleRescheduleInput(appt.id, s.type, index)}
                              >
                                Reschedule
                              </button>
                            )}
                          </div>
                        );
                      })
                    ) : (
                      'N/A'
                    )}
                  </td>
                  <td>
                    {services.length > 0 ? (
                      services.map((s, sIndex) => (
                        <div key={`ac-${appt.id}-${sIndex}`}>
                          {s.ac_types && s.ac_types.length > 0
                            ? s.ac_types.map((ac, acIndex) => `${sIndex + 1}. ${ac}`).join(', ')
                            : 'N/A'}
                        </div>
                      ))
                    ) : (
                      'N/A'
                    )}
                  </td>
                  <td>{appt.complete_address}</td>
                  <td>{appt.status || 'Pending'}</td>
                  <td>
                    <button className="reject-button" onClick={() => openRejectModal(appt.id)}>
                      Reject
                    </button>
                    <button className="accept-button" onClick={() => handleAcceptAppointment(appt.id)}>
                      Accept
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
      <Modal
        isOpen={isConfirmModalOpen}
        title="Confirm Rejection"
        message="Are you sure you want to reject this appointment?"
        onConfirm={handleConfirmReject}
        onCancel={handleCancelModal}
      />
    </div>
  );
};

export default AdminAppointments;