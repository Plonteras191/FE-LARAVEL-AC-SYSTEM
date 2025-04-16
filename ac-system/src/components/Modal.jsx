import React from 'react';
import '../styles/AdminAppointments.css';

const Modal = ({ isOpen, title, message, onConfirm, onCancel, actionType }) => {
  if (!isOpen) return null;
  
  // Determine the correct class for the confirm button based on action type
  const getConfirmButtonClass = () => {
    switch (actionType) {
      case 'reject':
        return 'modal-confirm-button modal-reject-confirm';
      case 'accept':
        return 'modal-confirm-button modal-accept-confirm';
      case 'complete':
        return 'modal-confirm-button modal-complete-confirm';
      default:
        return 'modal-confirm-button';
    }
  };
  
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3 className="modal-title">{title}</h3>
        </div>
        <div className="modal-body">
          <p>{message}</p>
        </div>
        <div className="modal-footer">
          <button 
            className="modal-cancel-button"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button 
            className={getConfirmButtonClass()}
            onClick={onConfirm}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

export default Modal;