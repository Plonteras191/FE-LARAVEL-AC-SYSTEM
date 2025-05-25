import React from 'react';
import AppointmentCard from './AppointmentCard';
import { FaCalendar } from 'react-icons/fa';

const AppointmentList = ({ 
  activeTab, 
  appointments, 
  acceptedAppointments, 
  getPaginatedData, 
  isLoading, 
  openRejectModal, 
  openAcceptModal, 
  openRescheduleModal, 
  openCompleteModal,
  parseServices,
  parseServicesFormatted,
  parseAcTypes
}) => {
  return (
    <>
      {/* Pending Appointments Table */}
      {activeTab === 'pending' && (
        <>
          {appointments.length === 0 && !isLoading ? (
            <p>No pending appointments available.</p>
          ) : (
            <div className="appointments-list">
              {getPaginatedData().map((appt) => (
                <AppointmentCard
                  key={appt.id}
                  appointment={appt}
                  services={parseServices(appt.services)}
                  openRejectModal={openRejectModal}
                  openAcceptModal={openAcceptModal}
                  openRescheduleModal={openRescheduleModal}
                  isLoading={isLoading}
                />
              ))}
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
    </>
  );
};

export default AppointmentList;
