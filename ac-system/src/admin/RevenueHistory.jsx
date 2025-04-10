import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/RevenueHistory.css';

const RevenueHistory = () => {
  const [history, setHistory] = useState([]);
  const [totalAmount, setTotalAmount] = useState(0);

  // Load revenue history from the backend API on component mount
  useEffect(() => {
    axios.get("http://localhost/AC-SERVICE-FINAL/backend/api/getRevenueHistory.php")
      .then(response => {
        setHistory(response.data);
        
        // Calculate total amount
        const total = response.data.reduce((sum, entry) => {
          return sum + parseFloat(entry.total_revenue);
        }, 0);
        setTotalAmount(total);
      })
      .catch(error => {
        console.error("Error fetching revenue history:", error);
        setHistory([]);
      });
  }, []);

  return (
    <div className="revenue-history-container">
      <div className="revenue-history-header">
        <h2>Revenue History</h2>
        <p className="revenue-history-subtitle">View and track your historical revenue records</p>
      </div>
      
      <div className="revenue-history-box">
        {history.length === 0 ? (
          <div className="no-data-message">
            <div className="empty-state-icon">📊</div>
            <p>No revenue history available.</p>
            <p className="empty-state-hint">Revenue records you save will appear here.</p>
          </div>
        ) : (
          <>
            <div className="table-container">
              <table className="revenue-history-table">
                <thead>
                  <tr>
                    <th>Date Recorded</th>
                    <th>Total Revenue (Php)</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((entry, index) => (
                    <tr key={index}>
                      <td className="date-column">{entry.revenue_date}</td>
                      <td className="amount-column">₱ {parseFloat(entry.total_revenue).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td className="total-label">All-time Total</td>
                    <td className="total-value">₱ {totalAmount.toFixed(2)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
            
            <div className="history-summary">
              <div className="summary-card">
                <div className="summary-title">Total Records</div>
                <div className="summary-value">{history.length}</div>
              </div>
              <div className="summary-card">
                <div className="summary-title">All-time Revenue</div>
                <div className="summary-value revenue-total">₱ {totalAmount.toFixed(2)}</div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default RevenueHistory;