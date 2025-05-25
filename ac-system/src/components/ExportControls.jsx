import React from 'react';
import { FaFileCsv, FaFileExcel } from 'react-icons/fa';

const ExportControls = ({
  activeTab,
  exportData,
  selectedDate,
  handleDateChange,
  clearDateFilter
}) => {
  if (activeTab === 'overview') return null;

  return (
    <div className="export-controls">
      <div className="export-buttons">
        <button 
          className="export-btn csv" 
          onClick={() => exportData('csv')}
          title="Download as CSV"
        >
          <FaFileCsv /> Export CSV
        </button>
        <button 
          className="export-btn excel" 
          onClick={() => exportData('excel')}
          title="Download as Excel"
        >
          <FaFileExcel /> Export Excel
        </button>
      </div>
      
      {/* Revenue date filter */}
      {activeTab === 'revenue' && (
        <div className="revenue-filter-controls">
          <div className="filter-group">
            <label>Filter by date:</label>
            <div className="date-filter">
              <input 
                type="date" 
                className="date-picker"
                value={selectedDate}
                onChange={handleDateChange}
              />
              {selectedDate && (
                <button 
                  className="clear-filter-btn"
                  onClick={clearDateFilter}
                  title="Clear date filter"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExportControls;
