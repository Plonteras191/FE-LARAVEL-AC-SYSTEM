import React, { useEffect, useRef } from 'react';
import '../styles/BookingModal.css';

const BookingModal = ({ isOpen, onClose, title, children }) => {
  const modalRef = useRef(null);

  useEffect(() => {
    // Handle escape key press to close modal
    const handleEscKey = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    // Handle click outside modal to close
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscKey);
      document.addEventListener('mousedown', handleClickOutside);
      // Prevent scrolling of body when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey);
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'auto';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="booking-modal-overlay">
      <div className="booking-modal-container" ref={modalRef}>
        <div className="booking-modal-header">
          <h2>{title}</h2>
          <button className="booking-modal-close" onClick={onClose}>×</button>
        </div>
        <div className="booking-modal-content">
          {children}
        </div>
      </div>
    </div>
  );
};

export default BookingModal;