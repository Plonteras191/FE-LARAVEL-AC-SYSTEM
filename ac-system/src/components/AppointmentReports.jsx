import React from 'react';
import { FaCheckCircle, FaClock, FaBan, FaCalendarAlt } from 'react-icons/fa';
import TechniciansList from './TechniciansList';
import Pagination from './PaginationControls';

const AppointmentReports = ({
  activeTab,
  completeAppointments,
  pendingAppointments,
  acceptedAppointments,
  rejectedAppointments,
  paginatedCompletedAppointments,
  paginatedPendingAppointments,
  paginatedRejectedAppointments,
  parseServices,
  getAppointmentDate,
  currentPage,
  getTotalPages,
  handlePageChange,
  setActiveTab
}) => {
  return (
    <>
      {activeTab === 'overview' && (
        <div className="reports-grid">
          {/* Completed Appointments */}
          <div className="report-box complete">
            <h3><FaCheckCircle className="report-icon" /> Completed Appointments</h3>
            <div className="scrollable-content">
              {completeAppointments.length > 0 ? (
                <ul>
                  {completeAppointments.slice(0, 5).map(app => (
                    <li key={app.id} className="appointment-item">
                      <div className="appointment-header">
                        <span className="appointment-id">#{app.id}</span>
                        <span className="appointment-name">{app.name}</span>
                      </div>
                      <div className="appointment-date">
                        <FaCalendarAlt /> {getAppointmentDate(app)}
                      </div>
                    </li>
                  ))}
                  {completeAppointments.length > 5 && (
                    <button className="view-more" onClick={() => setActiveTab('completed')}>
                      View all {completeAppointments.length} appointments
                    </button>
                  )}
                </ul>
              ) : (
                <div className="empty-state">No completed appointments.</div>
              )}
            </div>
          </div>

          {/* Active Appointments */}
          <div className="report-box pending">
            <h3><FaClock className="report-icon" /> Pending/Accepted Appointments</h3>
            <div className="scrollable-content">
              {pendingAppointments.length + acceptedAppointments.length > 0 ? (
                <ul>
                  {[...pendingAppointments, ...acceptedAppointments].slice(0, 5).map(app => (
                    <li key={app.id} className="appointment-item">
                      <div className="appointment-header">
                        <span className="appointment-id">#{app.id}</span>
                        <span className="appointment-name">{app.name}</span>
                        <span className="appointment-status">{app.status || 'Pending'}</span>
                      </div>
                      <div className="appointment-date">
                        <FaCalendarAlt /> {getAppointmentDate(app)}
                      </div>
                    </li>
                  ))}
                  {pendingAppointments.length + acceptedAppointments.length > 5 && (
                    <button className="view-more" onClick={() => setActiveTab('pending')}>
                      View all {pendingAppointments.length + acceptedAppointments.length} appointments
                    </button>
                  )}
                </ul>
              ) : (
                <div className="empty-state">No Pending/Accepted appointments.</div>
              )}
            </div>
          </div>

          {/* Rejected Appointments */}
          <div className="report-box rejected">
            <h3><FaBan className="report-icon" /> Rejected Appointments</h3>
            <div className="scrollable-content">
              {rejectedAppointments.length > 0 ? (
                <ul>
                  {rejectedAppointments.slice(0, 5).map(app => (
                    <li key={app.id} className="appointment-item">
                      <div className="appointment-header">
                        <span className="appointment-id">#{app.id}</span>
                        <span className="appointment-name">{app.name}</span>
                      </div>
                      <div className="appointment-date">
                        <FaCalendarAlt /> {getAppointmentDate(app)}
                      </div>
                    </li>
                  ))}
                  {rejectedAppointments.length > 5 && (
                    <button className="view-more" onClick={() => setActiveTab('rejected')}>
                      View all {rejectedAppointments.length} appointments
                    </button>
                  )}
                </ul>
              ) : (
                <div className="empty-state">No rejected appointments.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Detailed views for each appointment type */}
      {activeTab === 'completed' && (
        <AppointmentSection
          title="All Completed Appointments"
          icon={<FaCheckCircle className="report-icon" />}
          appointments={paginatedCompletedAppointments}
          totalAppointments={completeAppointments.length}
          statusBadge="completed"
          currentPage={currentPage.completed}
          getTotalPages={getTotalPages}
          handlePageChange={handlePageChange}
          section="completed"
          parseServices={parseServices}
        />
      )}

      {activeTab === 'pending' && (
        <AppointmentSection
          title="All Active Appointments"
          icon={<FaClock className="report-icon" />}
          appointments={paginatedPendingAppointments}
          totalAppointments={pendingAppointments.length + acceptedAppointments.length}
          currentPage={currentPage.pending}
          getTotalPages={getTotalPages}
          handlePageChange={handlePageChange}
          section="pending"
          parseServices={parseServices}
        />
      )}

      {activeTab === 'rejected' && (
        <AppointmentSection
          title="All Rejected Appointments"
          icon={<FaBan className="report-icon" />}
          appointments={paginatedRejectedAppointments}
          totalAppointments={rejectedAppointments.length}
          statusBadge="rejected"
          currentPage={currentPage.rejected}
          getTotalPages={getTotalPages}
          handlePageChange={handlePageChange}
          section="rejected"
          parseServices={parseServices}
        />
      )}
    </>
  );
};

const AppointmentSection = ({
  title,
  icon,
  appointments,
  totalAppointments,
  statusBadge,
  currentPage,
  getTotalPages,
  handlePageChange,
  section,
  parseServices
}) => {
  return (
    <div className="full-width-section">
      <h3>{icon} {title}</h3>
      {appointments.length > 0 ? (
        <>
          <div className="appointment-list">
            {appointments.map(app => {
              const services = parseServices(app.services);
              return (
                <div key={app.id} className="appointment-card">
                  <div className="appointment-card-header">
                    <span className="appointment-id">#{app.id}</span>
                    <span className={`status-badge ${app.status?.toLowerCase() || statusBadge}`}>
                      {app.status || statusBadge}
                    </span>
                  </div>
                  <div className="appointment-card-body">
                    <h4>{app.name}</h4>
                    <p><strong>Contact:</strong> {app.phone} | {app.email || 'N/A'}</p>
                    <p><strong>Address:</strong> {app.complete_address}</p>
                    <div className="services-list">
                      <p><strong>Services:</strong></p>
                      {services.length > 0 ? (
                        <ul>
                          {services.map((service, idx) => (
                            <li key={idx}>
                              {service.type} on {new Date(service.date).toLocaleDateString()} 
                              {service.ac_types && service.ac_types.length > 0 && (
                                <span> | AC Types: {service.ac_types.join(', ')}</span>
                              )}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p>No service details available</p>
                      )}
                    </div>
                    <TechniciansList technicians={app.technicians} />
                  </div>
                </div>
              );
            })}
          </div>
          
          {getTotalPages(totalAppointments) > 1 && (
            <Pagination 
              currentPage={currentPage}
              totalPages={getTotalPages(totalAppointments)}
              onPageChange={handlePageChange}
              section={section}
            />
          )}
        </>
      ) : (
        <div className="empty-state">No {section} appointments found.</div>
      )}
    </div>
  );
};

export default AppointmentReports;
