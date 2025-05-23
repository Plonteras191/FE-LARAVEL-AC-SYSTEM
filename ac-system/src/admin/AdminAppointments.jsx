import React, { useState, useEffect } from 'react';
import Modal from '../components/Modal';
import { useNavigate } from 'react-router-dom';
import { FaCalendar } from 'react-icons/fa';
import '../styles/AdminAppointments.css';
import PageWrapper from '../components/PageWrapper';
import { appointmentsApi } from '../services/api';
import { toast } from 'react-toastify';

const AdminAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [acceptedAppointments, setAcceptedAppointments] = useState([]);
  const [rescheduleInputs, setRescheduleInputs] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [availableTechnicians, setAvailableTechnicians] = useState([]);
  
  // Modal states
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isAcceptModalOpen, setIsAcceptModalOpen] = useState(false);
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
  const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState(null);
  const [selectedService, setSelectedService] = useState(null);
  const [modalType, setModalType] = useState('');
  const [newServiceDate, setNewServiceDate] = useState('');
  
  // Technician assignment states
  const [selectedTechnicians, setSelectedTechnicians] = useState([]);
  const [customTechnicianInput, setCustomTechnicianInput] = useState('');
  
  // Tab and pagination states
  const [activeTab, setActiveTab] = useState('pending');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch all appointments and technicians from Laravel backend
    fetchAppointments();
    fetchTechnicians();
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

  const fetchTechnicians = async () => {
    try {
      const response = await appointmentsApi.getTechnicians();
      setAvailableTechnicians(response.data);
    } catch (error) {
      console.error("Error fetching technicians:", error);
    }
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
    setSelectedTechnicians([]);
    setCustomTechnicianInput('');
    setIsAcceptModalOpen(true);
  };

  // Open modal to confirm completion
  const openCompleteModal = (id) => {
    setSelectedAppointmentId(id);
    setModalType('complete');
    setIsCompleteModalOpen(true);
  };  // Open modal to reschedule a service
  const openRescheduleModal = (id, service) => {
    setSelectedAppointmentId(id);
    setSelectedService(service.type);
    // Format the date to YYYY-MM-DD, handling both date-only and datetime formats
    const serviceDate = service.date ? new Date(service.date) : new Date();
    const formattedDate = serviceDate.toISOString().split('T')[0];
    setNewServiceDate(formattedDate);
    setIsRescheduleModalOpen(true);
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
    setIsRescheduleModalOpen(false);
    setSelectedAppointmentId(null);
    setModalType('');
    setSelectedTechnicians([]);
    setCustomTechnicianInput('');
  };

  // Handle technician selection from dropdown
  const handleTechnicianSelect = (e) => {
    const technicianName = e.target.value;
    if (technicianName && !selectedTechnicians.includes(technicianName)) {
      setSelectedTechnicians(prev => [...prev, technicianName]);
    }
    e.target.value = ''; // Reset dropdown
  };

  // Remove selected technician
  const removeTechnician = (technicianName) => {
    setSelectedTechnicians(prev => prev.filter(name => name !== technicianName));
  };

  // Add custom technician
  const addCustomTechnician = () => {
    const name = customTechnicianInput.trim();
    if (name && !selectedTechnicians.includes(name)) {
      setSelectedTechnicians(prev => [...prev, name]);
      setCustomTechnicianInput('');
    }
  };

  // Handle Enter key for custom technician input
  const handleCustomTechnicianKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addCustomTechnician();
    }
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
      const payload = {
        technician_names: selectedTechnicians
      };
      const response = await appointmentsApi.accept(id, payload);
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
      setSelectedTechnicians([]);
      setCustomTechnicianInput('');
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
  // Confirm reschedule of a service
  const confirmReschedule = async () => {
    if (!selectedAppointmentId || !selectedService || !newServiceDate) {
      toast.error('Please select a new date');
      return;
    }

    const formattedDate = new Date(newServiceDate).toISOString().split('T')[0];
    const payload = { 
      service_name: selectedService, 
      new_date: formattedDate // Send date in YYYY-MM-DD format
    };
    
    try {
      setIsLoading(true);
      const response = await appointmentsApi.reschedule(selectedAppointmentId, payload);
      if (response.data && !response.data.error) {
        setAppointments(prev =>
          prev.map(appt => (appt.id === selectedAppointmentId ? response.data : appt))
        );
        toast.success("Service rescheduled successfully");
      } else {
        toast.error(response.data.error || "Failed to reschedule service");
      }
    } catch (error) {
      console.error("Error rescheduling service:", error);
      toast.error("Failed to reschedule service");
    } finally {
      setIsLoading(false);
      setIsRescheduleModalOpen(false);
      setSelectedAppointmentId(null);
      setSelectedService(null);
      setNewServiceDate('');
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

  // Pagination handlers
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const handleItemsPerPageChange = (e) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  // Calculate pagination for current view
  const getPaginatedData = () => {
    const currentData = activeTab === 'pending' ? appointments : acceptedAppointments;
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    return currentData.slice(indexOfFirstItem, indexOfLastItem);
  };

  // Calculate total pages
  const totalPages = Math.ceil(
    (activeTab === 'pending' ? appointments.length : acceptedAppointments.length) / itemsPerPage
  );

  return (
    <PageWrapper>
      <div className="admin-appointments-container">
        <h2>Admin Appointments</h2>
        {isLoading && <div className="loading-spinner">Loading...</div>}
        
        {/* Tabs */}
        <div className="appointment-tabs">
          <button 
            className={`tab-button ${activeTab === 'pending' ? 'active' : ''}`}
            onClick={() => setActiveTab('pending')}
          >
            Pending Appointments ({appointments.length})
          </button>
          <button 
            className={`tab-button ${activeTab === 'accepted' ? 'active' : ''}`}
            onClick={() => setActiveTab('accepted')}
          >
            Accepted Appointments ({acceptedAppointments.length})
          </button>
        </div>

        {/* Pagination Controls */}
        <div className="pagination-controls">
          <div className="items-per-page">
            <label htmlFor="itemsPerPage">Items per page: </label>
            <select 
              id="itemsPerPage" 
              value={itemsPerPage} 
              onChange={handleItemsPerPageChange}
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
            </select>
          </div>
        </div>

        {/* Pending Appointments Table */}
        {activeTab === 'pending' && (
          <>
            {appointments.length === 0 && !isLoading ? (
              <p>No pending appointments available.</p>
            ) : (
              <div className="appointments-list">
                {getPaginatedData().map((appt) => {
                  const services = parseServices(appt.services);
                  return (
                    <div key={appt.id} className="appointment-card">
                      <div className="appointment-info">
                        <div className="appointment-field"><strong>ID:</strong> {appt.id}</div>
                        <div className="appointment-field"><strong>Customer:</strong> {appt.name}</div>
                        <div className="appointment-field"><strong>Phone:</strong> {appt.phone}</div>
                        <div className="appointment-field"><strong>Email:</strong> {appt.email || 'N/A'}</div>
                        <div className="appointment-field">
                          <strong>Service(s):</strong> 
                          {services.length > 0 ? (
                            services.map((s, index) => (
                              <div key={`${appt.id}-${s.type}-${index}`}>
                                {index + 1}. {s.type} on {s.date}
                              </div>
                            ))
                          ) : (
                            'N/A'
                          )}
                        </div>
                        <div className="appointment-field">
                          <strong>AC Type(s):</strong> 
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
                        </div>
                        <div className="appointment-field"><strong>Address:</strong> {appt.complete_address}</div>
                      </div>
                      <div className="appointment-actions">
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
                        </button>                        {services.map((service, index) => (
                          <button
                            key={`reschedule-${appt.id}-${index}`}
                            onClick={() => openRescheduleModal(appt.id, service)}
                            className="reschedule-btn"
                            title={`Reschedule ${service.type}`}
                          >
                            <FaCalendar />
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* Accepted Appointments Table */}
        {activeTab === 'accepted' && (
          <>
            {acceptedAppointments.length === 0 && !isLoading ? (
              <p>No accepted appointments available.</p>
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
                    <th>Technician(s)</th>
                    <th>Address</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {getPaginatedData().map((appointment) => (
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
                      <td>
                        {appointment.technicians && appointment.technicians.length > 0
                          ? appointment.technicians.join(', ')
                          : 'Not assigned'}
                      </td>
                      <td>{appointment.complete_address}</td>
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
            )}
          </>
        )}

        {/* Pagination Navigation */}
        {totalPages > 1 && (
          <div className="pagination-nav">
            <button 
              onClick={() => handlePageChange(1)}
              disabled={currentPage === 1}
              className="pagination-button"
            >
              First
            </button>
            <button 
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="pagination-button"
            >
              Previous
            </button>
            <span className="page-info">
              Page {currentPage} of {totalPages}
            </span>
            <button 
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="pagination-button"
            >
              Next
            </button>
            <button 
              onClick={() => handlePageChange(totalPages)}
              disabled={currentPage === totalPages}
              className="pagination-button"
            >
              Last
            </button>
          </div>
        )}

        {/* Reject Modal */}
        <Modal
          isOpen={isConfirmModalOpen}
          title="Confirm Rejection"
          message="Are you sure you want to reject this appointment? A notification email will be sent to the customer."
          onConfirm={handleConfirmReject}
          onCancel={handleCancelModal}
          actionType="reject"
        />

        {/* Accept Modal with Technician Assignment */}
        {isAcceptModalOpen && (
          <div className="modal-overlay">
            <div className="modal-content accept-modal">
              <h3>Accept Appointment</h3>
              <p>Are you sure you want to accept this appointment? A confirmation email will be sent to the customer.</p>
              
              <div className="technician-assignment-section">
                <h4>Assign Technicians (Optional)</h4>
                
                {/* Dropdown for existing technicians */}
                <div className="technician-dropdown">
                  <label htmlFor="technician-select">Select from existing technicians:</label>
                  <select 
                    id="technician-select"
                    onChange={handleTechnicianSelect}
                    defaultValue=""
                  >
                    <option value="">-- Select a technician --</option>
                    {availableTechnicians.map(tech => (
                      <option key={tech.id} value={tech.name}>
                        {tech.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Custom technician input */}
                <div className="custom-technician-input">
                  <label htmlFor="custom-technician">Add new technician:</label>
                  <div className="input-group">
                    <input
                      id="custom-technician"
                      type="text"
                      value={customTechnicianInput}
                      onChange={(e) => setCustomTechnicianInput(e.target.value)}
                      onKeyPress={handleCustomTechnicianKeyPress}
                      placeholder="Enter technician name"
                    />
                    <button 
                      type="button"
                      onClick={addCustomTechnician}
                      disabled={!customTechnicianInput.trim()}
                      className="add-technician-button"
                    >
                      Add
                    </button>
                  </div>
                </div>

                {/* Selected technicians display */}
                {selectedTechnicians.length > 0 && (
                  <div className="selected-technicians">
                    <h5>Selected Technicians:</h5>
                    <div className="technician-tags">
                      {selectedTechnicians.map((name, index) => (
                        <span key={index} className="technician-tag">
                          {name}
                          <button 
                            type="button"
                            onClick={() => removeTechnician(name)}
                            className="remove-technician"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="modal-actions">
                <button 
                  className="modal-confirm-button"
                  onClick={() => handleAcceptAppointment(selectedAppointmentId)}
                  disabled={isLoading}
                >
                  {isLoading ? 'Processing...' : 'Accept Appointment'}
                </button>
                <button 
                  className="modal-cancel-button"
                  onClick={handleCancelModal}
                  disabled={isLoading}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Complete Modal */}
        <Modal
          isOpen={isCompleteModalOpen}
          title="Confirm Completion"
          message="Are you sure you want to mark this appointment as completed?"
          onConfirm={() => completeAppointment(selectedAppointmentId)}
          onCancel={handleCancelModal}
          actionType="complete"
        />

        {/* Reschedule Modal */}
        {isRescheduleModalOpen && (
          <div className="modal-overlay">
            <div className="modal-content reschedule-modal">
              <h3>Reschedule Service</h3>
              <p>Are you sure you want to reschedule this service to the new date? A notification email will be sent to the customer.</p>
              <div className="reschedule-details">
                <p><strong>Appointment ID:</strong> {selectedAppointmentId}</p>
                <p><strong>Service:</strong> {selectedService}</p>
                
                <div className="new-date-input">
                  <label htmlFor="newServiceDate">New Date:</label>
                  <div className="input-group">
                    <input
                      id="newServiceDate"
                      type="date"
                      value={newServiceDate}
                      onChange={(e) => setNewServiceDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      required
                      className="datetime-input"
                    />
                  </div>
                </div>
              </div>

              <div className="modal-actions">
                <button 
                  className="modal-confirm-button"
                  onClick={confirmReschedule}
                  disabled={isLoading}
                >
                  {isLoading ? 'Processing...' : 'Confirm Reschedule'}
                </button>
                <button 
                  className="modal-cancel-button"
                  onClick={handleCancelModal}
                  disabled={isLoading}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageWrapper>
  );
};

export default AdminAppointments;