import React from 'react';
import { FaCheckCircle, FaClock, FaChartLine } from 'react-icons/fa';

const ReportStats = ({ 
  completeAppointments, 
  pendingAppointments, 
  acceptedAppointments, 
  totalRevenueAmount,
  formatCurrency 
}) => {
  return (
    <div className="dashboard-stats">
      <div className="stat-card">
        <div className="stat-icon completed">
          <FaCheckCircle />
        </div>
        <div className="stat-info">
          <h3>{completeAppointments.length}</h3>
          <p>Completed</p>
        </div>
      </div>
      <div className="stat-card">
        <div className="stat-icon pending">
          <FaClock />
        </div>
        <div className="stat-info">
          <h3>{pendingAppointments.length + acceptedAppointments.length}</h3>
          <p>Pending/Accepted</p>
        </div>
      </div>
      <div className="stat-card">
        <div className="stat-icon revenue">
          <FaChartLine />
        </div>
        <div className="stat-info">
          <h3>{formatCurrency(totalRevenueAmount)}</h3>
          <p>Total Revenue</p>
        </div>
      </div>
    </div>
  );
};

export default ReportStats;
