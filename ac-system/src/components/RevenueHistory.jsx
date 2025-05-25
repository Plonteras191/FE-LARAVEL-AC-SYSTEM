import React from 'react';
import { FaMoneyBillWave } from 'react-icons/fa';
import Pagination from './PaginationControls';

const RevenueHistory = ({
  selectedDate,
  filteredRevenueHistory,
  paginatedRevenueHistory,
  clearDateFilter,
  formatCurrency,
  filteredTotalRevenue,
  currentPage,
  getTotalPages,
  handlePageChange
}) => {
  return (
    <div className="revenue-history-container">
      <div className="revenue-history-header">
        <h3><FaMoneyBillWave className="report-icon" /> Revenue History</h3>
        <p className="revenue-history-subtitle">
          {selectedDate 
            ? `Viewing revenue for: ${new Date(selectedDate).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}`
            : 'View and track your historical revenue records'
          }
        </p>
      </div>
      
      <div className="revenue-history-box">
        {filteredRevenueHistory.length === 0 ? (
          <div className="no-data-message">
            <div className="empty-state-icon">📊</div>
            <p>{selectedDate ? 'No revenue records found for the selected date.' : 'No revenue history available.'}</p>
            {selectedDate && <button className="clear-filter-btn" onClick={clearDateFilter}>Clear Filter</button>}
            {!selectedDate && <p className="empty-state-hint">Revenue records you save will appear here.</p>}
          </div>
        ) : (
          <>
            <div className="table-container">
              <table className="revenue-history-table">
                <thead>
                  <tr>
                    <th>Date Recorded</th>
                    <th>Customer</th>
                    <th>Status</th>
                    <th>Service Types</th>
                    <th>Appointment Dates</th>
                    <th>Total Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedRevenueHistory.map((entry, index) => (
                    <tr key={index} className="revenue-row">
                      <td className="date-column">{entry.revenue_date}</td>
                      <td className="customer-column">
                        <div className="customer-info">
                          <div>{entry.customer_name}</div>
                          <div className="customer-contact">
                            {entry.customer_phone}
                            {entry.customer_email && <span> | {entry.customer_email}</span>}
                          </div>
                        </div>
                      </td>
                      <td className={`status-column ${entry.status_name.toLowerCase()}`}>
                        {entry.status_name}
                      </td>
                      <td className="service-column">
                        {entry.service_types.split(', ').map((service, i) => (
                          <span key={i} className="service-tag">{service}</span>
                        ))}
                      </td>
                      <td className="dates-column">
                        {entry.appointment_dates.split(', ').map((date, i) => (
                          <div key={i} className="appointment-date">
                            {new Date(date).toLocaleDateString()}
                          </div>
                        ))}
                      </td>
                      <td className="amount-column">{formatCurrency(entry.total_revenue)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan="3" className="total-label">
                      {selectedDate ? 'Selected Date Total' : 'All-time Total'}
                    </td>
                    <td className="total-value">{formatCurrency(filteredTotalRevenue)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
            
            <div className="history-summary">
              <div className="summary-card">
                <div className="summary-title">
                  {selectedDate ? 'Filtered Records' : 'Total Records'}
                </div>
                <div className="summary-value">{filteredRevenueHistory.length}</div>
              </div>
              <div className="summary-card">
                <div className="summary-title">
                  {selectedDate ? 'Filtered Revenue' : 'All-time Revenue'}
                </div>
                <div className="summary-value revenue-total">
                  {formatCurrency(filteredTotalRevenue)}
                </div>
              </div>
            </div>
            
            {getTotalPages(filteredRevenueHistory.length) > 1 && (
              <Pagination 
                currentPage={currentPage.revenue}
                totalPages={getTotalPages(filteredRevenueHistory.length)}
                onPageChange={handlePageChange}
                section="revenue"
              />
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default RevenueHistory;
