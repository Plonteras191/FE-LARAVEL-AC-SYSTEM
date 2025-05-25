import React from 'react';

const ReportTabs = ({ activeTab, setActiveTab }) => {
  return (
    <div className="tab-navigation">
      <button 
        className={activeTab === 'overview' ? 'active' : ''} 
        onClick={() => setActiveTab('overview')}
      >
        Overview
      </button>
      <button 
        className={activeTab === 'completed' ? 'active' : ''} 
        onClick={() => setActiveTab('completed')}
      >
        Completed Appointments
      </button>
      <button 
        className={activeTab === 'pending' ? 'active' : ''} 
        onClick={() => setActiveTab('pending')}
      >
        Pending/Accepted Appointments
      </button>
      <button 
        className={activeTab === 'rejected' ? 'active' : ''} 
        onClick={() => setActiveTab('rejected')}
      >
        Rejected Appointments
      </button>
      <button 
        className={activeTab === 'revenue' ? 'active' : ''} 
        onClick={() => setActiveTab('revenue')}
      >
        Revenue History
      </button>
    </div>
  );
};

export default ReportTabs;
