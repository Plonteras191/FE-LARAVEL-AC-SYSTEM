import React from 'react';
import Modal from './Modal';

const AppointmentModals = ({
  isConfirmModalOpen,
  isAcceptModalOpen,
  isCompleteModalOpen,
  isRescheduleModalOpen,
  selectedAppointmentId,
  selectedService,
  newServiceDate,
  setNewServiceDate,
  customTechnicianInput,
  setCustomTechnicianInput,
  selectedTechnicians,
  availableTechnicians,
  isLoading,
  handleConfirmReject,
  handleCancelModal,
  handleAcceptAppointment,
  handleTechnicianSelect,
  handleCustomTechnicianKeyPress,
  addCustomTechnician,
  removeTechnician,
  confirmReschedule,
  completeAppointment
}) => {
  return (
    <>
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
      )}      {/* Complete Modal */}
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
    </>
  );
};

export default AppointmentModals;
