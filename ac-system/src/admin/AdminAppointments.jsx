import React, { useState, useEffect } from 'react';
import Modal from '../components/Modal';
import { useNavigate } from 'react-router-dom';
import '../styles/AdminAppointments.css';
import PageWrapper from '../components/PageWrapper';
import { appointmentsApi } from '../services/api';
import { toast } from 'react-toastify'; // Import toast if you're using react-toastify

const AdminAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [acceptedAppointments, setAcceptedAppointments] = useState([]);
  const [rescheduleInputs, setRescheduleInputs] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  
  // Modal states
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isAcceptModalOpen, setIsAcceptModalOpen] = useState(false);
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState(null);
  const [modalType, setModalType] = useState(''); // To track which action we're confirming
  
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch all appointments from Laravel backend
    fetchAppointments();
  }, []);

  const fetchAppointments = () => {
    setIsLoading(true);
    appointmentsApi.getAll()
      .then(response => {
        let data = response.data;
        if (!Array.isArray(data)) data = [data];
        
        // Filter to show only pending appointments
        const pending = data.filter(appt => !appt.status || appt.status.toLowerCase() === 'pending');
        setAppointments(pending);
        
        // Filter to show only accepted appointments (pending for completion)
        const accepted = data.filter(appt => 
          appt.status && appt.status.toLowerCase() === 'accepted'
        );
        setAcceptedAppointments(accepted);
      })
      .catch(error => {
        console.error("Error fetching appointments:", error);
        toast.error("Failed to load appointments");
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  // Delete (reject) appointment
  const handleCancelAppointment = async (id) => {
    try {
      setIsLoading(true);
      await appointmentsApi.delete(id);
      setAppointments(prev => prev.filter(appt => appt.id !== id));
      toast.success("Appointment rejected successfully and notification email sent");
    } catch (error) {
      console.error("Error deleting appointment:", error);
      toast.error("Failed to reject appointment");
    } finally {
      setIsLoading(false);
    }
  };

  // Open modal to confirm rejection
  const openRejectModal = (id) => {
    setSelectedAppointmentId(id);
    setModalType('reject');
    setIsConfirmModalOpen(true);
  };

  // Open modal to confirm acceptance
  const openAcceptModal = (id) => {
    setSelectedAppointmentId(id);
    setModalType('accept');
    setIsAcceptModalOpen(true);
  };

  // Open modal to confirm completion
  const openCompleteModal = (id) => {
    setSelectedAppointmentId(id);
    setModalType('complete');
    setIsCompleteModalOpen(true);
  };

  // Confirm rejection and delete appointment
  const handleConfirmReject = () => {
    handleCancelAppointment(selectedAppointmentId);
    setIsConfirmModalOpen(false);
    setSelectedAppointmentId(null);
  };

  // Close any modal without action
  const handleCancelModal = () => {
    setIsConfirmModalOpen(false);
    setIsAcceptModalOpen(false);
    setIsCompleteModalOpen(false);
    setSelectedAppointmentId(null);
    setModalType('');
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
      setIsLoading(true);
      const response = await appointmentsApi.reschedule(appointmentId, payload);
      if (response.data && !response.data.error) {
        setAppointments(prev =>
          prev.map(appt => (appt.id === appointmentId ? response.data : appt))
        );
        setRescheduleInputs(prev => {
          const newState = { ...prev };
          delete newState[key];
          return newState;
        });
        toast.success("Service rescheduled successfully");
      } else {
        console.error("Backend error:", response.data.error);
        toast.error(response.data.error || "Failed to reschedule service");
      }
    } catch (error) {
      console.error("Error rescheduling service:", error);
      toast.error("Failed to reschedule service");
    } finally {
      setIsLoading(false);
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
      setIsLoading(true);
      const response = await appointmentsApi.accept(id);
      if (
        response.data &&
        response.data.status &&
        response.data.status.toLowerCase() === 'accepted'
      ) {
        // If appointment accepted successfully, refresh data
        fetchAppointments();
        toast.success("Appointment accepted and confirmation email sent.");
      }
    } catch (error) {
      console.error("Error accepting appointment:", error);
      if (error.response && error.response.data && error.response.data.error) {
        toast.error(error.response.data.error);
      } else {
        toast.error("Failed to accept appointment");
      }
    } finally {
      setIsLoading(false);
      setIsAcceptModalOpen(false);
      setSelectedAppointmentId(null);
    }
  };

  // Complete appointment: update its status to "Completed"
  const completeAppointment = (id) => {
    setIsLoading(true);
    appointmentsApi.complete(id)
      .then(response => {
        const updatedAppointment = response.data;
        
        // Store the completed appointment in localStorage for later processing in Revenue component
        const stored = localStorage.getItem('completedAppointments');
        const completedAppointments = stored ? JSON.parse(stored) : [];
        
        // Check if this appointment is already in the completed list
        const exists = completedAppointments.some(app => app.id === updatedAppointment.id);
        if (!exists) {
          completedAppointments.push(updatedAppointment);
          localStorage.setItem('completedAppointments', JSON.stringify(completedAppointments));
        }

        // Refresh appointments
        fetchAppointments();
        toast.success("Appointment marked as completed");
      })
      .catch(error => {
        console.error("Error completing appointment:", error);
        toast.error("Failed to complete appointment");
      })
      .finally(() => {
        setIsLoading(false);
        setIsCompleteModalOpen(false);
        setSelectedAppointmentId(null);
      });
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

  // Utility function to parse services JSON string with numbering
  const parseServicesFormatted = (servicesStr) => {
    try {
      const services = JSON.parse(servicesStr);
      return services.map((s, index) => `${index + 1}. ${s.type} on ${s.date}`).join(' | ');
    } catch (error) {
      console.error("Error parsing services:", error);
      return 'N/A';
    }
  };

  // Utility function to parse AC types from the services JSON string with proper numbering per service
  const parseAcTypes = (servicesStr) => {
    try {
      const services = JSON.parse(servicesStr);
      return services.map((s, index) => {
        if (s.ac_types && s.ac_types.length > 0) {
          // Prefix each AC type with the service number
          return s.ac_types.map(ac => `${index + 1}. ${ac}`).join(', ');
        } else {
          return 'N/A';
        }
      }).join(' | ');
    } catch (error) {
      console.error("Error parsing AC types:", error);
      return 'N/A';
    }
  };

  return (
    <PageWrapper>
      <div className="admin-appointments-container">
        <h2>Admin Appointments</h2>
        {isLoading && <div className="loading-spinner">Loading...</div>}
        {appointments.length === 0 && !isLoading ? (
          <p>No pending appointments available.</p>
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
                                    disabled={!rescheduleInputs[key] || isLoading}
                                  >
                                    Confirm
                                  </button>
                                  <button
                                    className="cancel-button"
                                    onClick={() => handleRescheduleCancel(appt.id, s.type, index)}
                                    disabled={isLoading}
                                  >
                                    Cancel
                                  </button>
                                </div>
                              ) : (
                                <button
                                  className="reschedule-button"
                                  onClick={() => toggleRescheduleInput(appt.id, s.type, index)}
                                  disabled={isLoading}
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
                      <button 
                        className="reject-button" 
                        onClick={() => openRejectModal(appt.id)}
                        disabled={isLoading}
                      >
                        Reject
                      </button>
                      <button 
                        className="accept-button" 
                        onClick={() => openAcceptModal(appt.id)}
                        disabled={isLoading}
                      >
                        Accept
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {/* Dashboard's Accepted Appointments Section (transferred from Dashboard.jsx) */}
        <h2 className="dashboard-section-title">Accepted Appointments</h2>
        <div className="dashboard-section">
          <div className="appointment-box">
            {acceptedAppointments.length > 0 ? (
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
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {acceptedAppointments.map((appointment) => (
                    <tr key={appointment.id}>
                      <td>{appointment.id}</td>
                      <td>{appointment.name}</td>
                      <td>{appointment.phone}</td>
                      <td>{appointment.email || 'N/A'}</td>
                      <td>
                        {appointment.services 
                          ? parseServicesFormatted(appointment.services)
                          : 'N/A'}
                      </td>
                      <td>
                        {appointment.services 
                          ? parseAcTypes(appointment.services)
                          : 'N/A'}
                      </td>
                      <td>{appointment.complete_address}</td>
                      <td>{appointment.status || 'Pending'}</td>
                      <td>
                        <button
                          className="complete-button"
                          onClick={() => openCompleteModal(appointment.id)}
                          disabled={isLoading}
                        >
                          Complete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p>No accepted appointments available.</p>
            )}
          </div>
        </div>

        {/* Reject Modal */}
        <Modal
          isOpen={isConfirmModalOpen}
          title="Confirm Rejection"
          message="Are you sure you want to reject this appointment? A notification email will be sent to the customer."
          onConfirm={handleConfirmReject}
          onCancel={handleCancelModal}
          actionType="reject"
        />

        {/* Accept Modal */}
        <Modal
          isOpen={isAcceptModalOpen}
          title="Confirm Acceptance"
          message="Are you sure you want to accept this appointment? A confirmation email will be sent to the customer."
          onConfirm={() => handleAcceptAppointment(selectedAppointmentId)}
          onCancel={handleCancelModal}
          actionType="accept"
        />

        {/* Complete Modal */}
        <Modal
          isOpen={isCompleteModalOpen}
          title="Confirm Completion"
          message="Are you sure you want to mark this appointment as completed?"
          onConfirm={() => completeAppointment(selectedAppointmentId)}
          onCancel={handleCancelModal}
          actionType="complete"
        />
      </div>
    </PageWrapper>
  );
};

export default AdminAppointments;