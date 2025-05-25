import React, { useState, useEffect } from 'react';
import { FaCalendarAlt } from 'react-icons/fa';
import '../styles/AdminReports.css';
import * as XLSX from 'xlsx';
import apiClient, { appointmentsApi } from '../services/api';
import ReportStats from '../components/ReportStats';
import ReportTabs from '../components/ReportTabs';
import RevenueHistory from '../components/RevenueHistory';
import AppointmentReports from '../components/AppointmentReports';
import ExportControls from '../components/ExportControls';

const AdminReports = () => {
  const [appointments, setAppointments] = useState([]);
  const [revenueHistory, setRevenueHistory] = useState([]);
  const [filteredRevenueHistory, setFilteredRevenueHistory] = useState([]);
  const [totalRevenueAmount, setTotalRevenueAmount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedDate, setSelectedDate] = useState('');
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState({
    completed: 1,
    pending: 1,
    rejected: 1,
    revenue: 1
  });
  const itemsPerPage = 6;

  useEffect(() => {
    setIsLoading(true);
    
    // Fetch all appointments using the appointments API service
    appointmentsApi.getAll()
      .then(response => {
        let data = response.data;
        if (!Array.isArray(data)) data = [data];
        setAppointments(data);
      })
      .catch(error => {
        console.error("Error fetching appointments:", error);
      });

    // Fetch revenue history from backend
    apiClient.get('/revenue-history')
      .then(response => {
        if (response.data && response.data.history) {
          // Ensure we have valid data
          const validHistory = response.data.history.map(entry => ({
            ...entry,
            total_revenue: parseFloat(entry.total_revenue) || 0
          }));
          setRevenueHistory(validHistory);
          setFilteredRevenueHistory(validHistory); // Initialize with all history
          setTotalRevenueAmount(parseFloat(response.data.totalAmount) || 0);
        } else {
          setRevenueHistory([]);
          setFilteredRevenueHistory([]);
          setTotalRevenueAmount(0);
        }
      })
      .catch(error => {
        console.error("Error fetching revenue history:", error);
        setRevenueHistory([]);
        setFilteredRevenueHistory([]);
        setTotalRevenueAmount(0);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  // Reset pagination when tab changes
  useEffect(() => {
    setCurrentPage({
      completed: 1,
      pending: 1,
      rejected: 1,
      revenue: 1
    });
  }, [activeTab]);

  // Filter revenue history when date changes
  useEffect(() => {
    if (!selectedDate) {
      // If no date is selected, show all revenue history
      setFilteredRevenueHistory(revenueHistory);
      return;
    }

    // Filter revenue history based on selected date
    const filtered = revenueHistory.filter(entry => {
      // Extract just the date part for comparison (not time)
      const entryDate = entry.revenue_date.split(' ')[0];
      return entryDate === selectedDate;
    });

    setFilteredRevenueHistory(filtered);
    // Reset revenue pagination when filter changes
    setCurrentPage(prev => ({ ...prev, revenue: 1 }));
  }, [selectedDate, revenueHistory]);

  // Filter appointments based on status
  const completeAppointments = appointments.filter(appt => 
    appt.status && appt.status.toLowerCase() === 'completed'
  );
  
  const pendingAppointments = appointments.filter(appt => 
    !appt.status || appt.status.toLowerCase() === 'pending'
  );
  
  const acceptedAppointments = appointments.filter(appt => 
    appt.status && appt.status.toLowerCase() === 'accepted'
  );
  
  const rejectedAppointments = appointments.filter(appt => 
    appt.status && appt.status.toLowerCase() === 'rejected'
  );

  // Get paginated data
  const getPaginatedData = (data, page) => {
    const startIndex = (page - 1) * itemsPerPage;
    return data.slice(startIndex, startIndex + itemsPerPage);
  };

  // Get total pages
  const getTotalPages = (totalItems) => {
    return Math.ceil(totalItems / itemsPerPage);
  };

  // Handle page change
  const handlePageChange = (section, newPage) => {
    setCurrentPage(prev => ({ ...prev, [section]: newPage }));
  };

  // Calculate total filtered revenue
  const filteredTotalRevenue = filteredRevenueHistory.reduce(
    (sum, entry) => sum + parseFloat(entry.total_revenue || 0), 
    0
  );

  // Helper function to parse services JSON string
  const parseServices = (servicesStr) => {
    try {
      return JSON.parse(servicesStr);
    } catch (error) {
      console.error("Error parsing services:", error);
      return [];
    }
  };

  // Helper function to get appointment date from services
  const getAppointmentDate = (appt) => {
    if (!appt.services) return 'N/A';
    
    try {
      const services = parseServices(appt.services);
      if (services.length > 0 && services[0].date) {
        return new Date(services[0].date).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        });
      }
      return 'N/A';
    } catch {
      return 'N/A';
    }
  };

  // Format currency properly with error handling
  const formatCurrency = (amount) => {
    // Ensure amount is a number before using toFixed
    const numAmount = Number(amount);
    if (isNaN(numAmount)) {
      return '₱ 0.00'; // Return default value if conversion fails
    }
    return `₱ ${numAmount.toFixed(2)}`;
  };

  // Handle date selection
  const handleDateChange = (e) => {
    setSelectedDate(e.target.value);
  };

  // Clear date filter
  const clearDateFilter = () => {
    setSelectedDate('');
  };

  // Pagination component
  const Pagination = ({ currentPage, totalPages, onPageChange, section }) => {
    return (
      <div className="pagination-controls">
        <button 
          onClick={() => onPageChange(section, 1)} 
          disabled={currentPage === 1}
          className="pagination-button"
        >
          First
        </button>
        <button 
          onClick={() => onPageChange(section, currentPage - 1)} 
          disabled={currentPage === 1}
          className="pagination-button"
        >
          <FaAngleLeft />
        </button>
        <span className="pagination-info">
          Page {currentPage} of {totalPages}
        </span>
        <button 
          onClick={() => onPageChange(section, currentPage + 1)} 
          disabled={currentPage === totalPages}
          className="pagination-button"
        >
          <FaAngleRight />
        </button>
        <button 
          onClick={() => onPageChange(section, totalPages)} 
          disabled={currentPage === totalPages}
          className="pagination-button"
        >
          Last
        </button>
      </div>
    );
  };

  // Export data to CSV
  const exportToCSV = (data, filename) => {
    const csvData = [];
    
    // Add headers
    if (activeTab === 'revenue') {
      csvData.push(['Date Recorded', 'Service Type', 'Booking ID', 'Total Revenue']);
      
      // Add data rows - export filtered data
      filteredRevenueHistory.forEach(entry => {
        csvData.push([
          entry.revenue_date,
          entry.service_types || 'N/A',
          entry.booking_id || 'N/A',
          formatCurrency(entry.total_revenue)
        ]);
      });
      
      // Add total row
      csvData.push(['Total', '', '', formatCurrency(filteredTotalRevenue)]);
    } else {
      // Add appointment headers
      csvData.push(['ID', 'Name', 'Status', 'Contact', 'Email', 'Address', 'Services']);
      
      // Add appointment data
      data.forEach(app => {
        const services = parseServices(app.services);
        const servicesText = services.map(service => 
          `${service.type} on ${new Date(service.date).toLocaleDateString()}${
            service.ac_types && service.ac_types.length > 0 ? 
            ` | AC Types: ${service.ac_types.join(', ')}` : ''
          }`
        ).join('; ');
        
        csvData.push([
          app.id,
          app.name,
          app.status || 'Pending',
          app.phone,
          app.email || 'N/A',
          app.complete_address,
          servicesText
        ]);
      });
    }
    
    // Create CSV string
    const csvString = csvData.map(row => row.join(',')).join('\n');
    
    // Create a blob and download
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export data to Excel
  const exportToExcel = (data, filename) => {
    const workbook = XLSX.utils.book_new();
    let worksheet;
    
    if (activeTab === 'revenue') {
      // Format revenue data for Excel - use filtered data
      const excelData = filteredRevenueHistory.map(entry => ({
        'Date Recorded': entry.revenue_date,
        'Service Type': entry.service_types || 'N/A',
        'Booking ID': entry.booking_id || 'N/A',
        'Total Revenue': formatCurrency(entry.total_revenue)
      }));
      
      // Add total row
      excelData.push({
        'Date Recorded': 'Total',
        'Service Type': '',
        'Booking ID': '',
        'Total Revenue': formatCurrency(filteredTotalRevenue)
      });
      
      worksheet = XLSX.utils.json_to_sheet(excelData);
    } else {
      // Format appointment data for Excel
      const excelData = data.map(app => {
        const services = parseServices(app.services);
        const servicesText = services.map(service => 
          `${service.type} on ${new Date(service.date).toLocaleDateString()}${
            service.ac_types && service.ac_types.length > 0 ? 
            ` | AC Types: ${service.ac_types.join(', ')}` : ''
          }`
        ).join('; ');
        
        return {
          'ID': app.id,
          'Name': app.name,
          'Status': app.status || 'Pending',
          'Contact': app.phone,
          'Email': app.email || 'N/A',
          'Address': app.complete_address,
          'Services': servicesText
        };
      });
      
      worksheet = XLSX.utils.json_to_sheet(excelData);
    }
    
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
    XLSX.writeFile(workbook, `${filename}.xlsx`);
  };

  // Export current active tab data
  const exportData = (format) => {
    let data;
    let filename;
    
    switch (activeTab) {
      case 'completed':
        data = completeAppointments;
        filename = 'completed-appointments';
        break;
      case 'pending':
        data = [...pendingAppointments, ...acceptedAppointments];
        filename = 'pending-appointments';
        break;
      case 'rejected':
        data = rejectedAppointments;
        filename = 'rejected-appointments';
        break;
      case 'revenue':
        data = filteredRevenueHistory;
        filename = `revenue-history${selectedDate ? '-' + selectedDate : ''}`;
        break;
      default:
        data = appointments;
        filename = 'all-appointments';
    }
    
    if (format === 'csv') {
      exportToCSV(data, filename);
    } else if (format === 'excel') {
      exportToExcel(data, filename);
    }
  };

  // Get paginated data for each section
  const paginatedCompletedAppointments = getPaginatedData(
    completeAppointments, 
    currentPage.completed
  );
  
  const paginatedPendingAppointments = getPaginatedData(
    [...pendingAppointments, ...acceptedAppointments], 
    currentPage.pending
  );
  
  const paginatedRejectedAppointments = getPaginatedData(
    rejectedAppointments, 
    currentPage.rejected
  );
  
  const paginatedRevenueHistory = getPaginatedData(
    filteredRevenueHistory, 
    currentPage.revenue
  );

  if (isLoading) {
    return (
      <div className="admin-reports-container loading">
        <div className="loader"></div>
        <p>Loading reports data...</p>
      </div>
    );
  }

  return (
    <div className="admin-reports-container">
      <div className="admin-header">
        <h2>Admin Reports</h2>
        <div className="date-display">
          <FaCalendarAlt /> {new Date().toLocaleDateString('en-US', {
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric'
          })}
        </div>
      </div>

      <ReportStats 
        completeAppointments={completeAppointments}
        pendingAppointments={pendingAppointments}
        acceptedAppointments={acceptedAppointments}
        totalRevenueAmount={totalRevenueAmount}
        formatCurrency={formatCurrency}
      />

      <ReportTabs 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      <ExportControls 
        activeTab={activeTab}
        exportData={exportData}
        selectedDate={selectedDate}
        handleDateChange={handleDateChange}
        clearDateFilter={clearDateFilter}
      />

      <div className="reports-content">
        {activeTab === 'revenue' ? (
          <RevenueHistory 
            selectedDate={selectedDate}
            filteredRevenueHistory={filteredRevenueHistory}
            paginatedRevenueHistory={paginatedRevenueHistory}
            clearDateFilter={clearDateFilter}
            formatCurrency={formatCurrency}
            filteredTotalRevenue={filteredTotalRevenue}
            currentPage={currentPage}
            getTotalPages={getTotalPages}
            handlePageChange={handlePageChange}
          />
        ) : (
          <AppointmentReports 
            activeTab={activeTab}
            completeAppointments={completeAppointments}
            pendingAppointments={pendingAppointments}
            acceptedAppointments={acceptedAppointments}
            rejectedAppointments={rejectedAppointments}
            paginatedCompletedAppointments={paginatedCompletedAppointments}
            paginatedPendingAppointments={paginatedPendingAppointments}
            paginatedRejectedAppointments={paginatedRejectedAppointments}
            parseServices={parseServices}
            getAppointmentDate={getAppointmentDate}
            currentPage={currentPage}
            getTotalPages={getTotalPages}
            handlePageChange={handlePageChange}
            setActiveTab={setActiveTab}
          />
        )}
      </div>
    </div>
  );
};

export default AdminReports;